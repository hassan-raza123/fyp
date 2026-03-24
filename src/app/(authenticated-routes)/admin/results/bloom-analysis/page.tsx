'use client';

import { useEffect, useState, Suspense } from 'react';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Info, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Brain } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LevelEntry {
  level: string;
  clos: number;
  llos: number;
  total: number;
  isHOT: boolean;
}

interface DomainCount {
  Cognitive: number;
  Affective: number;
  Psychomotor: number;
  unset: number;
}

interface CourseOutcome {
  id: number;
  code: string;
  bloomLevel: string | null;
  bloomDomain: string | null;
}

interface CourseRow {
  courseId: number;
  courseCode: string;
  courseName: string;
  courseType: string;
  semesterSlot: number;
  clos: CourseOutcome[];
  llos: CourseOutcome[];
}

interface BloomData {
  levelBreakdown: LevelEntry[];
  hotPercent: number;
  lotPercent: number;
  unsetPercent: number;
  hotCount: number;
  lotCount: number;
  total: number;
  totalWithLevel: number;
  byDomain: DomainCount;
  byCourse: CourseRow[];
  recommendation: string;
  hec_compliant: boolean | null;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

// ─── Bloom level color mapping ────────────────────────────────────────────────

const BLOOM_COLORS: Record<string, string> = {
  Remember: '#94a3b8',
  Understand: '#64748b',
  Apply: '#3b82f6',
  Analyze: '#f59e0b',
  Evaluate: '#f97316',
  Create: '#22c55e',
};

const DOMAIN_COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#94a3b8'];

// ─── Component ────────────────────────────────────────────────────────────────

function BloomAnalysisContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
  const tickColor = isDarkMode ? '#9ca3af' : '#6b7280';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BloomData | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
    fetch('/api/programs', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setPrograms(d.success ? d.data : d.data ?? []))
      .catch(() => toast.error('Failed to fetch programs'));
  }, []);

  const fetchAnalysis = async (programId: string) => {
    if (!programId) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/bloom-analysis?programId=${programId}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.error || 'Failed to fetch analysis');
      }
    } catch {
      toast.error('Failed to fetch Bloom\'s analysis');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (id: number) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const domainPieData = data
    ? Object.entries(data.byDomain)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-primary-text flex items-center gap-2">
          <Brain className="w-5 h-5" style={{ color: primaryColor }} />
          Bloom&apos;s Taxonomy Analysis
        </h1>
        <p className="text-xs text-secondary-text mt-0.5">
          HOT/LOT distribution of CLOs and LLOs across the program curriculum
        </p>
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-2 p-3 rounded-lg border text-xs"
        style={{
          backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.08)' : 'rgba(38, 40, 149, 0.06)',
          borderColor: isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.15)',
          color: primaryColor,
        }}
      >
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          HEC Pakistan / Washington Accord recommends ≥40% Higher Order Thinking (HOT) outcomes —
          Analyze, Evaluate, Create. Lower Order Thinking (LOT) = Remember, Understand, Apply.
        </span>
      </div>

      {/* Program selector */}
      <div className="flex items-end gap-3">
        <div className="w-72">
          <p className="text-xs text-secondary-text mb-1">Program *</p>
          <Select
            value={selectedProgram}
            onValueChange={(v) => {
              setSelectedProgram(v);
              fetchAnalysis(v);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()} className="text-xs text-primary-text">
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loading && (
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin mb-1"
            style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
          />
        )}
      </div>

      {data && (
        <>
          {/* Recommendation Banner */}
          <div
            className="flex items-start gap-2 p-3 rounded-lg border text-xs"
            style={{
              backgroundColor:
                data.hec_compliant === null
                  ? isDarkMode ? 'rgba(107,114,128,0.08)' : 'rgba(107,114,128,0.06)'
                  : data.hec_compliant
                  ? 'rgba(34,197,94,0.08)'
                  : 'rgba(239,68,68,0.08)',
              borderColor:
                data.hec_compliant === null
                  ? 'rgba(107,114,128,0.2)'
                  : data.hec_compliant
                  ? 'rgba(34,197,94,0.25)'
                  : 'rgba(239,68,68,0.25)',
              color:
                data.hec_compliant === null
                  ? '#6b7280'
                  : data.hec_compliant
                  ? '#16a34a'
                  : '#dc2626',
            }}
          >
            {data.hec_compliant ? (
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            )}
            <span>{data.recommendation}</span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: 'Total Outcomes',
                value: data.total,
                sub: `${data.totalWithLevel} with Bloom level`,
                color: primaryColor,
                bg: iconBgColor,
              },
              {
                label: 'HOT (High Order)',
                value: `${data.hotPercent}%`,
                sub: `${data.hotCount} outcomes — Analyze/Evaluate/Create`,
                color: '#22c55e',
                bg: 'rgba(34,197,94,0.1)',
              },
              {
                label: 'LOT (Low Order)',
                value: `${data.lotPercent}%`,
                sub: `${data.lotCount} outcomes — Remember/Understand/Apply`,
                color: '#3b82f6',
                bg: 'rgba(59,130,246,0.1)',
              },
              {
                label: 'Unassigned',
                value: data.total - data.totalWithLevel,
                sub: `${data.unsetPercent}% without Bloom level`,
                color: '#f59e0b',
                bg: 'rgba(245,158,11,0.1)',
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-card-border bg-card p-3 flex items-start gap-3"
              >
                <div className="rounded-lg p-2 mt-0.5" style={{ backgroundColor: card.bg }}>
                  <Brain className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-primary-text">{card.value}</p>
                  <p className="text-[10px] font-medium text-primary-text">{card.label}</p>
                  <p className="text-[10px] text-muted-text mt-0.5">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Bar chart — Bloom level distribution */}
            <div className="col-span-2 rounded-lg border border-card-border bg-card p-4">
              <h3 className="text-xs font-semibold text-primary-text mb-1">Outcomes per Bloom Level</h3>
              <p className="text-[10px] text-secondary-text mb-3">Green = HOT, Blue/Grey = LOT</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.levelBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="level"
                    tick={{ fontSize: 10, fill: tickColor }}
                    tickFormatter={(v) => v.slice(0, 3)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: tickColor }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${gridColor}`,
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number, name: string) => [value, name === 'clos' ? 'CLOs' : 'LLOs']}
                  />
                  <Bar dataKey="clos" name="clos" stackId="a" radius={[0, 0, 0, 0]}>
                    {data.levelBreakdown.map((entry) => (
                      <Cell
                        key={entry.level}
                        fill={BLOOM_COLORS[entry.level] ?? '#94a3b8'}
                        opacity={0.9}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="llos" name="llos" stackId="a" radius={[3, 3, 0, 0]}>
                    {data.levelBreakdown.map((entry) => (
                      <Cell
                        key={entry.level}
                        fill={BLOOM_COLORS[entry.level] ?? '#94a3b8'}
                        opacity={0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-2">
                {data.levelBreakdown.map((entry) => (
                  <div key={entry.level} className="flex items-center gap-1">
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: BLOOM_COLORS[entry.level] }}
                    />
                    <span className="text-[10px] text-secondary-text">
                      {entry.level} ({entry.total})
                      {entry.isHOT && (
                        <span className="ml-0.5 text-emerald-500 font-medium">HOT</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie chart — Domain distribution */}
            <div className="rounded-lg border border-card-border bg-card p-4">
              <h3 className="text-xs font-semibold text-primary-text mb-1">Domain Distribution</h3>
              <p className="text-[10px] text-secondary-text mb-2">Cognitive / Affective / Psychomotor</p>
              {domainPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={domainPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {domainPieData.map((entry, i) => (
                        <Cell key={entry.name} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${gridColor}`,
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                    />
                    <Legend
                      iconSize={8}
                      wrapperStyle={{ fontSize: '10px', color: tickColor }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-xs text-muted-text">
                  No domain data
                </div>
              )}
            </div>
          </div>

          {/* Course-by-course table */}
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-3 border-b border-card-border flex items-center justify-between">
              <h3 className="text-xs font-semibold text-primary-text">
                Course Breakdown ({data.byCourse.length} courses)
              </h3>
              <button
                onClick={() => {
                  if (expandedCourses.size === data.byCourse.length) {
                    setExpandedCourses(new Set());
                  } else {
                    setExpandedCourses(new Set(data.byCourse.map((c) => c.courseId)));
                  }
                }}
                className="text-[10px] text-secondary-text hover:text-primary-text transition-colors"
              >
                {expandedCourses.size === data.byCourse.length ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border bg-hover-bg/50">
                  <th className="text-left p-2.5 w-5 font-semibold text-primary-text"></th>
                  <th className="text-left p-2.5 font-semibold text-primary-text">Sem</th>
                  <th className="text-left p-2.5 font-semibold text-primary-text">Course</th>
                  <th className="text-left p-2.5 font-semibold text-primary-text">CLOs</th>
                  <th className="text-left p-2.5 font-semibold text-primary-text">LLOs</th>
                  {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(
                    (lvl) => (
                      <th
                        key={lvl}
                        className="text-center p-2.5 font-semibold"
                        style={{ color: BLOOM_COLORS[lvl] }}
                        title={lvl}
                      >
                        {lvl.slice(0, 3)}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.byCourse.map((row) => {
                  const expanded = expandedCourses.has(row.courseId);
                  const allOutcomes = [...row.clos, ...row.llos];
                  // Combined bloom count for this course row
                  const rowCount: Record<string, number> = {};
                  for (const o of allOutcomes) {
                    const k = o.bloomLevel ?? 'unset';
                    rowCount[k] = (rowCount[k] ?? 0) + 1;
                  }

                  return (
                    <>
                      <tr
                        key={row.courseId}
                        className="border-b border-card-border hover:bg-hover-bg cursor-pointer"
                        onClick={() => toggleCourse(row.courseId)}
                      >
                        <td className="p-2.5 text-secondary-text">
                          {expanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </td>
                        <td className="p-2.5 text-secondary-text">{row.semesterSlot}</td>
                        <td className="p-2.5">
                          <div className="font-medium text-primary-text">{row.courseCode}</div>
                          <div className="text-muted-text text-[10px] truncate max-w-[160px]">
                            {row.courseName}
                          </div>
                        </td>
                        <td className="p-2.5 text-secondary-text">{row.clos.length}</td>
                        <td className="p-2.5 text-secondary-text">{row.llos.length}</td>
                        {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(
                          (lvl) => (
                            <td key={lvl} className="p-2.5 text-center">
                              {rowCount[lvl] ? (
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold text-white"
                                  style={{ backgroundColor: BLOOM_COLORS[lvl] }}
                                >
                                  {rowCount[lvl]}
                                </span>
                              ) : (
                                <span className="text-muted-text">—</span>
                              )}
                            </td>
                          )
                        )}
                      </tr>
                      {expanded &&
                        allOutcomes.map((o) => (
                          <tr
                            key={`${row.courseId}-${o.id}`}
                            className="border-b border-card-border/40 bg-hover-bg/30"
                          >
                            <td className="p-1.5"></td>
                            <td className="p-1.5"></td>
                            <td className="p-1.5 pl-6 text-secondary-text" colSpan={2}>
                              <span className="font-medium text-primary-text">{o.code}</span>
                              <Badge
                                className="ml-2 text-[9px] px-1 py-0 h-3.5"
                                style={{
                                  backgroundColor: row.llos.some((l) => l.id === o.id)
                                    ? 'rgba(139,92,246,0.15)'
                                    : iconBgColor,
                                  color: row.llos.some((l) => l.id === o.id) ? '#7c3aed' : primaryColor,
                                }}
                                variant="secondary"
                              >
                                {row.llos.some((l) => l.id === o.id) ? 'LLO' : 'CLO'}
                              </Badge>
                            </td>
                            <td className="p-1.5"></td>
                            {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(
                              (lvl) => (
                                <td key={lvl} className="p-1.5 text-center">
                                  {o.bloomLevel === lvl ? (
                                    <div
                                      className="w-2 h-2 rounded-full mx-auto"
                                      style={{ backgroundColor: BLOOM_COLORS[lvl] }}
                                    />
                                  ) : null}
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && !data && selectedProgram && (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center">
          <Brain className="w-8 h-8 text-muted-text mx-auto mb-2" />
          <p className="text-xs text-secondary-text">No curriculum data found for this program.</p>
        </div>
      )}

      {!selectedProgram && !loading && (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center">
          <Brain className="w-8 h-8 text-muted-text mx-auto mb-2" />
          <p className="text-xs text-secondary-text">
            Select a program to analyze Bloom&apos;s taxonomy distribution
          </p>
        </div>
      )}
    </div>
  );
}

export default function BloomAnalysisPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BloomAnalysisContent />
    </Suspense>
  );
}
