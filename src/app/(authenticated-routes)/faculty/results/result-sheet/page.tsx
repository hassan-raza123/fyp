'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TableIcon, Printer, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface SectionOption {
  id: number;
  name: string;
  course: { id: number; code: string; name: string; creditHours: number };
  semester: { id: number; name: string };
}

interface Assessment {
  id: number;
  title: string;
  type: string;
  totalMarks: number;
  weightage: number | null;
}

interface StudentRow {
  studentId: number;
  rollNumber: string;
  name: string;
  assessmentMarks: Record<
    number,
    { obtained: number | null; total: number; percentage: number | null; status: string }
  >;
  finalGrade: {
    obtained: number;
    total: number;
    percentage: number;
    grade: string;
    gpaPoints: number;
  } | null;
}

interface ResultSheetData {
  section: {
    id: number;
    name: string;
    course: { id: number; code: string; name: string; creditHours: number };
    semester: { id: number; name: string };
  };
  assessments: Assessment[];
  rows: StudentRow[];
  stats: {
    totalStudents: number;
    gradedStudents: number;
    averagePercentage: number | null;
  };
}

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  quiz: 'Quiz',
  assignment: 'Assign.',
  mid_exam: 'Mid',
  final_exam: 'Final',
  presentation: 'Pres.',
  project: 'Project',
  viva: 'Viva',
  sessional_exam: 'Sessional',
  class_participation: 'CP',
  case_study: 'Case',
  lab_exam: 'Lab Exam',
  lab_report: 'Lab Rpt.',
};

function shortLabel(assessment: Assessment, index: number) {
  const typeLabel = ASSESSMENT_TYPE_LABELS[assessment.type] ?? assessment.type;
  return `${typeLabel} ${index + 1}`;
}

function gradeColor(grade: string | undefined) {
  if (!grade) return '';
  if (['A+', 'A', 'A-'].includes(grade)) return 'text-green-600 dark:text-green-400';
  if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600 dark:text-blue-400';
  if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-600 dark:text-yellow-400';
  if (['D+', 'D'].includes(grade)) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

const ResultSheetPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [sheetData, setSheetData] = useState<ResultSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch('/api/faculty/result-sheet', { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSections(res.data);
      })
      .catch(() => toast.error('Failed to load sections'));
  }, []);

  useEffect(() => {
    if (!selectedSectionId) { setSheetData(null); return; }
    setLoading(true);
    fetch(`/api/faculty/result-sheet?sectionId=${selectedSectionId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSheetData(res.data);
        else toast.error('Failed to load result sheet');
      })
      .catch(() => toast.error('Failed to load result sheet'))
      .finally(() => setLoading(false));
  }, [selectedSectionId]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  // Group assessments by type for column headers
  const assessments = sheetData?.assessments ?? [];
  const typeGroups = assessments.reduce<Record<string, Assessment[]>>((acc, a) => {
    (acc[a.type] = acc[a.type] ?? []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <TableIcon className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Result Sheet</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Consolidated marks sheet for all students across all assessments
            </p>
          </div>
        </div>
        {sheetData && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setSelectedSectionId(''); setSheetData(null); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)] inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Change Section
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        )}
      </div>

      {/* Section Selector */}
      {!sheetData && (
        <div className="rounded-lg border border-card-border bg-card p-6 max-w-md">
          <h2 className="text-sm font-semibold text-primary-text mb-4">Select Section</h2>
          <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
            <SelectTrigger className="h-9 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Choose a section..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {sections.map((s) => (
                <SelectItem key={s.id} value={String(s.id)} className="text-xs text-primary-text hover:bg-[var(--hover-bg)]">
                  {s.course.code} — {s.name} ({s.semester.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && (
            <p className="text-xs text-secondary-text mt-3">Loading result sheet...</p>
          )}
        </div>
      )}

      {/* Result Sheet */}
      {sheetData && (
        <div ref={printRef} className="space-y-4 print-area">
          {/* Course info + stats */}
          <div className="rounded-lg border border-card-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-primary-text">
                  {sheetData.section.course.code} — {sheetData.section.course.name}
                </h2>
                <p className="text-xs text-secondary-text mt-0.5">
                  Section: <span className="font-medium text-primary-text">{sheetData.section.name}</span>
                  {' · '}
                  Semester: <span className="font-medium text-primary-text">{sheetData.section.semester.name}</span>
                  {' · '}
                  Credit Hours: <span className="font-medium text-primary-text">{sheetData.section.course.creditHours}</span>
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="text-center">
                  <p className="text-secondary-text">Students</p>
                  <p className="font-bold text-primary-text text-base">{sheetData.stats.totalStudents}</p>
                </div>
                <div className="text-center">
                  <p className="text-secondary-text">Graded</p>
                  <p className="font-bold text-primary-text text-base">{sheetData.stats.gradedStudents}</p>
                </div>
                {sheetData.stats.averagePercentage !== null && (
                  <div className="text-center">
                    <p className="text-secondary-text">Avg %</p>
                    <p className="font-bold text-primary-text text-base">
                      {sheetData.stats.averagePercentage.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {assessments.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card py-12 text-center">
              <p className="text-xs text-secondary-text">No assessments found for this section.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-card-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    {/* Row 1: Type group headers */}
                    <tr className="border-b border-card-border bg-[var(--hover-bg)]">
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-left font-semibold text-primary-text border-r border-card-border sticky left-0 bg-[var(--hover-bg)] z-10 min-w-[50px]"
                      >
                        #
                      </th>
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-left font-semibold text-primary-text border-r border-card-border sticky left-[50px] bg-[var(--hover-bg)] z-10 min-w-[90px]"
                      >
                        Roll No.
                      </th>
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-left font-semibold text-primary-text border-r border-card-border sticky left-[140px] bg-[var(--hover-bg)] z-10 min-w-[160px]"
                      >
                        Student Name
                      </th>
                      {Object.entries(typeGroups).map(([type, items]) => (
                        <th
                          key={type}
                          colSpan={items.length}
                          className="px-2 py-1.5 text-center font-semibold text-primary-text border-r border-card-border capitalize"
                        >
                          {ASSESSMENT_TYPE_LABELS[type] ?? type} ({items.length})
                        </th>
                      ))}
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-center font-semibold text-primary-text border-r border-card-border min-w-[80px]"
                      >
                        Total %
                      </th>
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-center font-semibold text-primary-text border-r border-card-border min-w-[60px]"
                      >
                        Grade
                      </th>
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-center font-semibold text-primary-text min-w-[50px]"
                      >
                        GPA
                      </th>
                    </tr>
                    {/* Row 2: Individual assessment headers */}
                    <tr className="border-b border-card-border bg-[var(--hover-bg)]">
                      {Object.entries(typeGroups).map(([type, items]) =>
                        items.map((a, idx) => (
                          <th
                            key={a.id}
                            className="px-2 py-1 text-center font-medium text-secondary-text border-r border-card-border whitespace-nowrap"
                            title={a.title}
                          >
                            <div>{shortLabel(a, idx)}</div>
                            <div className="font-normal text-muted-text">/{a.totalMarks}</div>
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetData.rows.map((row, rowIdx) => (
                      <tr
                        key={row.studentId}
                        className="border-b border-card-border hover:bg-[var(--hover-bg)] transition-colors"
                      >
                        <td className="px-3 py-2 text-secondary-text border-r border-card-border sticky left-0 bg-card z-10">
                          {rowIdx + 1}
                        </td>
                        <td className="px-3 py-2 font-medium text-primary-text border-r border-card-border sticky left-[50px] bg-card z-10 whitespace-nowrap">
                          {row.rollNumber}
                        </td>
                        <td className="px-3 py-2 text-primary-text border-r border-card-border sticky left-[140px] bg-card z-10 whitespace-nowrap">
                          {row.name}
                        </td>
                        {Object.entries(typeGroups).map(([, items]) =>
                          items.map((a) => {
                            const m = row.assessmentMarks[a.id];
                            return (
                              <td
                                key={a.id}
                                className="px-2 py-2 text-center border-r border-card-border"
                              >
                                {m?.obtained !== null && m?.obtained !== undefined ? (
                                  <span className="text-primary-text font-medium">
                                    {m.obtained % 1 === 0 ? m.obtained : m.obtained.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-muted-text">—</span>
                                )}
                              </td>
                            );
                          })
                        )}
                        <td className="px-3 py-2 text-center border-r border-card-border">
                          {row.finalGrade ? (
                            <span className="font-semibold text-primary-text">
                              {row.finalGrade.percentage.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-text text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center border-r border-card-border">
                          {row.finalGrade ? (
                            <span className={`font-bold text-sm ${gradeColor(row.finalGrade.grade)}`}>
                              {row.finalGrade.grade}
                            </span>
                          ) : (
                            <span className="text-muted-text text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.finalGrade ? (
                            <span className="text-primary-text font-medium">
                              {row.finalGrade.gpaPoints.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-text text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer: column totals / max marks */}
                  <tfoot>
                    <tr className="border-t-2 border-card-border bg-[var(--hover-bg)]">
                      <td colSpan={3} className="px-3 py-2 font-semibold text-primary-text border-r border-card-border sticky left-0 bg-[var(--hover-bg)] z-10">
                        Max Marks
                      </td>
                      {Object.entries(typeGroups).map(([, items]) =>
                        items.map((a) => (
                          <td key={a.id} className="px-2 py-2 text-center font-semibold text-primary-text border-r border-card-border">
                            {a.totalMarks}
                          </td>
                        ))
                      )}
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="rounded-lg border border-card-border bg-card p-3">
            <p className="text-xs font-semibold text-secondary-text mb-2">Assessment Columns</p>
            <div className="flex flex-wrap gap-3">
              {assessments.map((a, idx) => {
                const sameType = assessments.filter((x) => x.type === a.type);
                const typeIdx = sameType.indexOf(a);
                return (
                  <div key={a.id} className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-primary-text">{shortLabel(a, typeIdx)}:</span>
                    <span className="text-secondary-text">{a.title} ({a.totalMarks} marks)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body > *:not(.print-area) { display: none !important; }
          .print-area { display: block !important; }
          nav, aside, header { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ResultSheetPage;
