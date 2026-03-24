'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { Grid3X3, AlertTriangle, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type BloomLevel =
  | 'Remember'
  | 'Understand'
  | 'Apply'
  | 'Analyze'
  | 'Evaluate'
  | 'Create';

interface Program {
  id: number;
  name: string;
  code: string;
}

interface PLO {
  id: number;
  code: string;
  description: string;
  programId: number;
  bloomLevel: BloomLevel | null;
  program: {
    id: number;
    name: string;
    code: string;
  };
}

interface CLO {
  id: number;
  code: string;
  description: string;
  courseId: number;
  bloomLevel: BloomLevel | null;
  course: {
    id: number;
    code: string;
    name: string;
    programs: { id: number; name: string; code: string }[];
  };
}

interface CLOPLOMapping {
  id: number;
  cloId: number;
  ploId: number;
  weight: number;
  clo: CLO;
  plo: PLO;
}

// Per course: the highest bloom level mapping to a given PLO
// (a course may have multiple CLOs mapping to the same PLO at different levels)
interface CourseRow {
  courseId: number;
  courseCode: string;
  courseName: string;
  // ploId → highest bloom level among all CLOs for this course that map to that PLO
  ploMapping: Record<number, BloomLevel>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOM_ORDER: BloomLevel[] = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
];

const BLOOM_ABBR: Record<BloomLevel, string> = {
  Remember: 'C1',
  Understand: 'C2',
  Apply: 'C3',
  Analyze: 'C4',
  Evaluate: 'C5',
  Create: 'C6',
};

// Tailwind class pairs for each Bloom level
const BLOOM_CELL_CLASSES: Record<BloomLevel, string> = {
  Remember: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Understand: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  Apply: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Analyze: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Evaluate: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Create: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// Dot colors for the legend (visible in both modes)
const BLOOM_DOT_STYLE: Record<BloomLevel, string> = {
  Remember: '#3b82f6',
  Understand: '#06b6d4',
  Apply: '#22c55e',
  Analyze: '#eab308',
  Evaluate: '#f97316',
  Create: '#ef4444',
};

/** Return the higher Bloom level of two */
function higherBloom(a: BloomLevel, b: BloomLevel): BloomLevel {
  return BLOOM_ORDER.indexOf(a) >= BLOOM_ORDER.indexOf(b) ? a : b;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a sorted list of unique courses from the filtered mappings,
 * computing per-course the highest Bloom level that maps to each PLO.
 */
function buildMatrix(
  mappings: CLOPLOMapping[],
  plos: PLO[]
): CourseRow[] {
  const courseMap = new Map<number, CourseRow>();

  for (const m of mappings) {
    const { courseId, courseCode, courseName } = {
      courseId: m.clo.course.id,
      courseCode: m.clo.course.code,
      courseName: m.clo.course.name,
    };

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        courseId,
        courseCode,
        courseName,
        ploMapping: {},
      });
    }

    const row = courseMap.get(courseId)!;
    const ploId = m.plo.id;

    // Use CLO's bloomLevel for the mapping cell; fall back to PLO level if CLO has none
    const level: BloomLevel | null = m.clo.bloomLevel ?? m.plo.bloomLevel ?? null;
    if (level) {
      row.ploMapping[ploId] =
        ploId in row.ploMapping
          ? higherBloom(row.ploMapping[ploId], level)
          : level;
    } else {
      // Mark with a sentinel so we know a mapping exists but no level recorded
      if (!(ploId in row.ploMapping)) {
        // We'll represent "mapped but no level" as undefined — handled below
        // Keep the key present so coverage count works
        (row.ploMapping as Record<number, BloomLevel | undefined>)[ploId] = undefined as unknown as BloomLevel;
      }
    }
  }

  // Sort courses alphabetically by code
  return Array.from(courseMap.values()).sort((a, b) =>
    a.courseCode.localeCompare(b.courseCode)
  );
}

/** Sort PLOs by their numeric suffix if present, else lexicographically */
function sortPLOs(plos: PLO[]): PLO[] {
  return [...plos].sort((a, b) => {
    const numA = parseInt(a.code.replace(/\D/g, ''), 10);
    const numB = parseInt(b.code.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.code.localeCompare(b.code);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PLOCoverageMatrixContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  const [plos, setPlos] = useState<PLO[]>([]);
  const [matrixRows, setMatrixRows] = useState<CourseRow[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Track which PLO columns have zero coverage
  const [zeroCoveragePloIds, setZeroCoveragePloIds] = useState<number[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const res = await fetch('/api/programs', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch programs');
        const result = await res.json();
        const list: Program[] = result.success
          ? (result.data ?? [])
          : Array.isArray(result)
          ? result
          : [];
        setPrograms(list);
      } catch {
        toast.error('Failed to load programs');
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, []);

  // Fetch matrix data when a program is selected
  useEffect(() => {
    if (!selectedProgram) {
      setPlos([]);
      setMatrixRows([]);
      setZeroCoveragePloIds([]);
      return;
    }

    const fetchMatrix = async () => {
      setMatrixLoading(true);
      try {
        // Fetch PLOs for the program and all CLO-PLO mappings in parallel
        const [ploRes, mappingRes] = await Promise.all([
          fetch(`/api/plos?programId=${selectedProgram}`, {
            credentials: 'include',
          }),
          fetch('/api/clo-plo-mappings', { credentials: 'include' }),
        ]);

        if (!ploRes.ok) throw new Error('Failed to fetch PLOs');
        if (!mappingRes.ok) throw new Error('Failed to fetch CLO-PLO mappings');

        const ploResult = await ploRes.json();
        const mappingResult = await mappingRes.json();

        const programId = parseInt(selectedProgram, 10);

        // All PLOs for this program
        const allPlos: PLO[] = ploResult.success
          ? (ploResult.data ?? [])
          : Array.isArray(ploResult)
          ? ploResult
          : [];
        const programPlos = sortPLOs(
          allPlos.filter((p) => p.programId === programId)
        );

        // Build a set of PLO ids for this program for quick lookup
        const programPloIds = new Set(programPlos.map((p) => p.id));

        // Filter mappings to only those whose PLO belongs to the selected program
        const allMappings: CLOPLOMapping[] = mappingResult.success
          ? (mappingResult.data ?? [])
          : Array.isArray(mappingResult)
          ? mappingResult
          : [];
        const filteredMappings = allMappings.filter((m) =>
          programPloIds.has(m.plo.id)
        );

        const rows = buildMatrix(filteredMappings, programPlos);

        // Compute PLOs with zero coverage (no course maps to them)
        const coveredPloIds = new Set<number>();
        for (const row of rows) {
          for (const ploId of Object.keys(row.ploMapping)) {
            coveredPloIds.add(parseInt(ploId, 10));
          }
        }
        const zeroCoverage = programPlos
          .filter((p) => !coveredPloIds.has(p.id))
          .map((p) => p.id);

        setPlos(programPlos);
        setMatrixRows(rows);
        setZeroCoveragePloIds(zeroCoverage);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load matrix data');
      } finally {
        setMatrixLoading(false);
      }
    };

    fetchMatrix();
  }, [selectedProgram]);

  // Coverage count per PLO column: number of courses that have at least one mapping
  const coverageCount = (ploId: number): number =>
    matrixRows.filter((row) => ploId in row.ploMapping).length;

  if (!mounted || loadingPrograms) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 rounded-full animate-spin"
            style={{
              borderTopColor: 'transparent',
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: primaryColor,
            }}
          />
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedProgramData = programs.find(
    (p) => p.id.toString() === selectedProgram
  );

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <Grid3X3 className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">
            CLO-PLO Coverage Matrix
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Program-wide view of which courses address each PLO and at what
            Bloom&apos;s taxonomy level
          </p>
        </div>
      </div>

      {/* ── Program selector ── */}
      <div className="flex items-center gap-3 max-w-sm">
        <div className="flex-1">
          <Select
            value={selectedProgram}
            onValueChange={setSelectedProgram}
            disabled={programs.length === 0}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {programs.map((program) => (
                <SelectItem
                  key={program.id}
                  value={program.id.toString()}
                  className="text-xs text-primary-text hover:bg-card/50"
                >
                  {program.code} — {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── No program selected ── */}
      {!selectedProgram && (
        <div className="rounded-lg border border-card-border bg-card p-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <Grid3X3 className="h-8 w-8 text-secondary-text opacity-30" />
            <p className="text-xs text-secondary-text">
              Select a program to view the CLO-PLO coverage matrix
            </p>
          </div>
        </div>
      )}

      {/* ── Loading matrix ── */}
      {selectedProgram && matrixLoading && (
        <div className="rounded-lg border border-card-border bg-card p-10 flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{
              borderTopColor: 'transparent',
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: primaryColor,
            }}
          />
          <p className="text-xs text-secondary-text">Building coverage matrix…</p>
        </div>
      )}

      {/* ── Matrix content ── */}
      {selectedProgram && !matrixLoading && plos.length > 0 && (
        <>
          {/* Zero-coverage warning */}
          {zeroCoveragePloIds.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                  PLOs with no course coverage detected
                </p>
                <p className="text-[11px] text-yellow-600 dark:text-yellow-500 mt-0.5">
                  The following PLOs are not addressed by any course in the
                  program:{' '}
                  <span className="font-medium">
                    {plos
                      .filter((p) => zeroCoveragePloIds.includes(p.id))
                      .map((p) => p.code)
                      .join(', ')}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-card-border bg-card px-4 py-3">
              <p className="text-2xl font-bold text-primary-text">
                {plos.length}
              </p>
              <p className="text-[11px] text-secondary-text mt-0.5">
                PLOs in {selectedProgramData?.code ?? 'Program'}
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-card px-4 py-3">
              <p className="text-2xl font-bold text-primary-text">
                {matrixRows.length}
              </p>
              <p className="text-[11px] text-secondary-text mt-0.5">
                Courses with CLO mappings
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-card px-4 py-3">
              <p
                className="text-2xl font-bold"
                style={{
                  color: zeroCoveragePloIds.length === 0 ? '#22c55e' : '#f97316',
                }}
              >
                {plos.length - zeroCoveragePloIds.length}/{plos.length}
              </p>
              <p className="text-[11px] text-secondary-text mt-0.5">
                PLOs covered
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-card-border bg-card px-4 py-3">
            <div className="flex items-center gap-1.5 mr-1">
              <Info className="h-3.5 w-3.5 text-secondary-text" />
              <span className="text-[11px] font-medium text-secondary-text">
                Bloom&apos;s Level:
              </span>
            </div>
            {BLOOM_ORDER.map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${BLOOM_DOT_STYLE[level]}22`,
                    color: BLOOM_DOT_STYLE[level],
                  }}
                >
                  {BLOOM_ABBR[level]}
                </span>
                <span className="text-[11px] text-secondary-text">{level}</span>
              </div>
            ))}
          </div>

          {/* ── The Matrix Table ── */}
          {matrixRows.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card p-8 text-center">
              <p className="text-xs text-secondary-text">
                No CLO-PLO mappings found for courses in this program. Add CLOs
                and map them to PLOs first.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-card-border overflow-hidden">
              {/* Table header */}
              <div className="bg-muted/30 border-b border-card-border px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-primary-text">
                  Coverage Matrix — {selectedProgramData?.code}{' '}
                  {selectedProgramData?.name}
                </p>
                <p className="text-[11px] text-secondary-text">
                  Cell shows highest Bloom&apos;s level among all CLOs for that
                  course mapping to the PLO
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-card-border">
                      {/* Course column header */}
                      <th
                        className="sticky left-0 z-10 bg-muted/50 text-left px-4 py-3 font-semibold text-secondary-text whitespace-nowrap min-w-[200px] border-r border-card-border"
                        style={{ backdropFilter: 'blur(4px)' }}
                      >
                        Course
                      </th>
                      {/* PLO column headers */}
                      {plos.map((plo) => (
                        <th
                          key={plo.id}
                          className="px-3 py-3 text-center font-semibold text-secondary-text whitespace-nowrap min-w-[70px]"
                          title={plo.description}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-primary-text">{plo.code}</span>
                            {plo.bloomLevel && (
                              <span className="text-[9px] text-secondary-text font-normal">
                                {BLOOM_ABBR[plo.bloomLevel]}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {/* Data rows */}
                    {matrixRows.map((row, rowIdx) => (
                      <tr
                        key={row.courseId}
                        className={`hover:bg-muted/20 transition-colors ${
                          rowIdx % 2 === 0 ? '' : 'bg-muted/10'
                        }`}
                      >
                        {/* Sticky course name cell */}
                        <td
                          className="sticky left-0 z-10 px-4 py-2.5 border-r border-card-border"
                          style={{
                            backgroundColor: isDarkMode
                              ? rowIdx % 2 === 0
                                ? '#1a1a2e'
                                : '#16213e'
                              : rowIdx % 2 === 0
                              ? '#ffffff'
                              : '#f9fafb',
                          }}
                        >
                          <div className="font-semibold text-primary-text whitespace-nowrap">
                            {row.courseCode}
                          </div>
                          <div className="text-[10px] text-secondary-text mt-0.5 max-w-[180px] truncate">
                            {row.courseName}
                          </div>
                        </td>

                        {/* PLO cells */}
                        {plos.map((plo) => {
                          const bloomLevel = row.ploMapping[plo.id] as
                            | BloomLevel
                            | undefined;
                          return (
                            <td
                              key={plo.id}
                              className="px-3 py-2.5 text-center align-middle"
                            >
                              {bloomLevel ? (
                                <span
                                  className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[11px] font-bold ${BLOOM_CELL_CLASSES[bloomLevel]}`}
                                  title={bloomLevel}
                                >
                                  {BLOOM_ABBR[bloomLevel]}
                                </span>
                              ) : plo.id in row.ploMapping ? (
                                // Mapping exists but no Bloom level recorded
                                <span
                                  className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                  title="Mapped (no Bloom level set)"
                                >
                                  ✓
                                </span>
                              ) : (
                                // No mapping
                                <span className="text-secondary-text opacity-30 text-xs">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Coverage count footer row */}
                    <tr className="bg-muted/40 border-t-2 border-card-border font-semibold">
                      <td
                        className="sticky left-0 z-10 px-4 py-2.5 border-r border-card-border text-xs font-semibold text-secondary-text whitespace-nowrap"
                        style={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                        }}
                      >
                        Coverage (# courses)
                      </td>
                      {plos.map((plo) => {
                        const count = coverageCount(plo.id);
                        const isZero = count === 0;
                        return (
                          <td
                            key={plo.id}
                            className="px-3 py-2.5 text-center align-middle"
                          >
                            <span
                              className={`inline-flex items-center justify-center rounded-full w-7 h-7 text-[11px] font-bold ${
                                isZero
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                  : count >= 3
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                              }`}
                            >
                              {count}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PLO descriptions reference */}
          <div className="rounded-lg border border-card-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-primary-text mb-2">
              PLO Reference — {selectedProgramData?.code}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {plos.map((plo) => (
                <div key={plo.id} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      backgroundColor: zeroCoveragePloIds.includes(plo.id)
                        ? '#fef3c7'
                        : `${primaryColor}22`,
                      color: zeroCoveragePloIds.includes(plo.id)
                        ? '#d97706'
                        : primaryColor,
                    }}
                  >
                    {plo.code}
                  </span>
                  <p className="text-[11px] text-secondary-text leading-relaxed">
                    {plo.description.length > 120
                      ? plo.description.slice(0, 120) + '…'
                      : plo.description}
                    {zeroCoveragePloIds.includes(plo.id) && (
                      <span className="ml-1 text-yellow-600 dark:text-yellow-400 font-medium">
                        (no coverage)
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* No PLOs found for selected program */}
      {selectedProgram && !matrixLoading && plos.length === 0 && (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center">
          <p className="text-xs text-secondary-text">
            No PLOs found for this program. Add PLOs to the program first.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page export (wrapped in Suspense per requirements) ───────────────────────

export default function PLOCoverageMatrixPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-blue-500" />
        </div>
      }
    >
      <PLOCoverageMatrixContent />
    </Suspense>
  );
}
