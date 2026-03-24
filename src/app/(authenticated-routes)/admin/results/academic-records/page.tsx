'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronRight,
  Download,
  BarChart3,
  TableIcon,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseGrade {
  courseCode: string;
  courseName: string;
  creditHours: number;
  grade: string;
  gpaPoints: number;
  percentage: number;
}

interface SemesterData {
  semesterId: number;
  semesterName: string;
  gpa: number;
  creditHours: number;
  courses: CourseGrade[];
}

interface StudentRecord {
  id: number;
  rollNumber: string;
  name: string;
  email: string;
  program: { id: number; code: string; name: string } | null;
  batch: { id: string; name: string } | null;
  cgpa: number;
  completedSemesters: number;
  totalCreditHours: number;
  semesters: SemesterData[];
}

interface AcademicRecordsData {
  students: StudentRecord[];
  stats: {
    totalStudents: number;
    avgCGPA: number;
    passRate: number;
    distinctionCount: number;
  };
  gradeDistribution: { grade: string; count: number }[];
  semesterTrends: { semester: string; avgGPA: number; studentCount: number; passRate: number }[];
  filters: {
    programs: { id: number; code: string; name: string }[];
    batches: { id: string; name: string }[];
    semesters: { id: number; name: string }[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGradeBadgeClass(grade: string): string {
  if (['A+', 'A'].includes(grade)) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (['B+', 'B'].includes(grade)) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  if (['C+', 'C'].includes(grade)) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (grade === 'D') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
}

function cgpaColor(cgpa: number): string {
  if (cgpa >= 3.5) return 'text-green-600 dark:text-green-400';
  if (cgpa >= 3.0) return 'text-blue-600 dark:text-blue-400';
  if (cgpa >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
  if (cgpa >= 2.0) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AcademicRecordsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252,153,40,0.15)' : 'rgba(38,40,149,0.15)';

  const [data, setData] = useState<AcademicRecordsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'sheet' | 'charts'>('sheet');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  useEffect(() => { setMounted(true); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProgram !== 'all') params.set('programId', selectedProgram);
      if (selectedBatch !== 'all') params.set('batchId', selectedBatch);
      if (selectedSemester !== 'all') params.set('semesterId', selectedSemester);

      const res = await fetch(`/api/admin/academic-records?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load records');
      }
    } catch (err) {
      toast.error('Failed to load academic records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedProgram, selectedBatch, selectedSemester]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleRow = (studentId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const filteredStudents = data?.students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      (s.program?.name.toLowerCase().includes(q) ?? false)
    );
  }) ?? [];

  const exportToCSV = () => {
    if (!data?.students.length) { toast.error('No data to export'); return; }
    const rows: string[][] = [
      ['Roll No', 'Name', 'Program', 'Batch', 'CGPA', 'Completed Semesters', 'Total Credit Hours'],
    ];
    for (const s of data.students) {
      rows.push([
        s.rollNumber, s.name,
        s.program?.name ?? '', s.batch?.name ?? '',
        s.cgpa.toFixed(2),
        s.completedSemesters.toString(),
        s.totalCreditHours.toString(),
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `academic_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Academic Records</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Semester-wise academic performance of all students
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!data?.students.length}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5 disabled:opacity-50"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-card-border rounded-lg p-3 flex flex-wrap gap-3 items-center">
        <span className="text-xs font-medium text-secondary-text">Filters:</span>

        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-xs text-primary-text">All Programs</SelectItem>
            {data?.filters.programs.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()} className="text-xs text-primary-text">
                {p.code} – {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[150px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-xs text-primary-text">All Batches</SelectItem>
            {data?.filters.batches.map((b) => (
              <SelectItem key={b.id} value={b.id} className="text-xs text-primary-text">
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="All Semesters" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-xs text-primary-text">All Semesters</SelectItem>
            {data?.filters.semesters.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()} className="text-xs text-primary-text">
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(selectedProgram !== 'all' || selectedBatch !== 'all' || selectedSemester !== 'all') && (
          <button
            onClick={() => { setSelectedProgram('all'); setSelectedBatch('all'); setSelectedSemester('all'); }}
            className="text-xs px-2 py-1 rounded border border-card-border text-secondary-text hover:text-primary-text transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: data?.stats.totalStudents ?? '—', icon: <Users className="h-5 w-5" /> },
          { label: 'Average CGPA', value: data ? data.stats.avgCGPA.toFixed(2) : '—', icon: <TrendingUp className="h-5 w-5" /> },
          { label: 'Pass Rate', value: data ? `${data.stats.passRate}%` : '—', icon: <GraduationCap className="h-5 w-5" /> },
          { label: 'Distinctions (≥3.5)', value: data?.stats.distinctionCount ?? '—', icon: <Award className="h-5 w-5" /> },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: iconBgColor, color: primaryColor }}>
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] text-secondary-text">{card.label}</p>
              <p className="text-lg font-bold text-primary-text">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {(['sheet', 'charts'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={
              activeView === view
                ? { backgroundColor: primaryColor, color: '#fff' }
                : { backgroundColor: iconBgColor, color: primaryColor }
            }
          >
            {view === 'sheet' ? <TableIcon className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
            {view === 'sheet' ? 'Data Sheet' : 'Charts'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderBottomColor: primaryColor, borderRightColor: 'transparent', borderLeftColor: 'transparent' }}
          />
          <span className="ml-3 text-xs text-secondary-text">Loading records...</span>
        </div>
      ) : activeView === 'sheet' ? (
        <DataSheetView
          students={filteredStudents}
          expandedRows={expandedRows}
          onToggleRow={toggleRow}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isDarkMode={isDarkMode}
          primaryColor={primaryColor}
          iconBgColor={iconBgColor}
        />
      ) : (
        <ChartsView
          data={data}
          isDarkMode={isDarkMode}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}

// ─── Data Sheet View ──────────────────────────────────────────────────────────

function DataSheetView({
  students,
  expandedRows,
  onToggleRow,
  searchQuery,
  onSearchChange,
  isDarkMode,
  primaryColor,
  iconBgColor,
}: {
  students: StudentRecord[];
  expandedRows: Set<number>;
  onToggleRow: (id: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDarkMode: boolean;
  primaryColor: string;
  iconBgColor: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-lg overflow-hidden">
      {/* Search bar */}
      <div className="p-3 border-b border-card-border flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-secondary-text flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by name, roll number, or program..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-xs text-primary-text placeholder:text-muted-text outline-none"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="text-xs text-secondary-text hover:text-primary-text">✕</button>
        )}
        <span className="text-[10px] text-muted-text">{students.length} student{students.length !== 1 ? 's' : ''}</span>
      </div>

      {students.length === 0 ? (
        <div className="py-12 text-center text-xs text-secondary-text">No students found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-card-border bg-hover-bg">
                <th className="text-left px-4 py-2.5 font-semibold text-primary-text w-8"></th>
                <th className="text-left px-4 py-2.5 font-semibold text-primary-text">Roll No</th>
                <th className="text-left px-4 py-2.5 font-semibold text-primary-text">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-primary-text">Program</th>
                <th className="text-left px-4 py-2.5 font-semibold text-primary-text">Batch</th>
                <th className="text-center px-4 py-2.5 font-semibold text-primary-text">CGPA</th>
                <th className="text-center px-4 py-2.5 font-semibold text-primary-text">Semesters</th>
                <th className="text-center px-4 py-2.5 font-semibold text-primary-text">Credit Hrs</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <React.Fragment key={student.id}>
                  {/* Student row */}
                  <tr
                    className="border-b border-card-border hover:bg-hover-bg cursor-pointer transition-colors"
                    onClick={() => onToggleRow(student.id)}
                  >
                    <td className="px-4 py-2.5 text-secondary-text">
                      {expandedRows.has(student.id) ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-primary-text">{student.rollNumber || '—'}</td>
                    <td className="px-4 py-2.5 text-primary-text">{student.name}</td>
                    <td className="px-4 py-2.5 text-secondary-text">
                      {student.program ? (
                        <span>
                          <span className="font-medium text-primary-text">{student.program.code}</span>
                          <span className="ml-1 hidden md:inline">– {student.program.name}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-secondary-text">{student.batch?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`font-bold ${cgpaColor(student.cgpa)}`}>
                        {student.cgpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-secondary-text">{student.completedSemesters}</td>
                    <td className="px-4 py-2.5 text-center text-secondary-text">{student.totalCreditHours}</td>
                  </tr>

                  {/* Expanded: semester details */}
                  {expandedRows.has(student.id) && (
                    <tr className="border-b border-card-border">
                      <td colSpan={8} className="px-4 py-3 bg-hover-bg/50">
                        {student.semesters.length === 0 ? (
                          <p className="text-xs text-muted-text italic">No grades recorded yet</p>
                        ) : (
                          <div className="space-y-3">
                            {student.semesters.map((sem) => (
                              <div key={sem.semesterId} className="bg-card border border-card-border rounded-lg overflow-hidden">
                                {/* Semester header */}
                                <div className="px-3 py-2 border-b border-card-border flex items-center justify-between bg-hover-bg">
                                  <span className="text-xs font-semibold text-primary-text">{sem.semesterName}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-secondary-text">
                                      GPA: <span className={`font-bold ${cgpaColor(sem.gpa)}`}>{sem.gpa.toFixed(2)}</span>
                                    </span>
                                    <span className="text-[10px] text-secondary-text">
                                      Credits: <span className="font-semibold text-primary-text">{sem.creditHours}</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Courses table */}
                                <table className="w-full text-[11px]">
                                  <thead>
                                    <tr className="border-b border-card-border">
                                      <th className="text-left px-3 py-1.5 font-semibold text-secondary-text">Code</th>
                                      <th className="text-left px-3 py-1.5 font-semibold text-secondary-text">Course</th>
                                      <th className="text-center px-3 py-1.5 font-semibold text-secondary-text">Cr.Hrs</th>
                                      <th className="text-center px-3 py-1.5 font-semibold text-secondary-text">%</th>
                                      <th className="text-center px-3 py-1.5 font-semibold text-secondary-text">Grade</th>
                                      <th className="text-center px-3 py-1.5 font-semibold text-secondary-text">GPA Pts</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sem.courses.map((course, idx) => (
                                      <tr key={idx} className="border-b border-card-border last:border-0 hover:bg-hover-bg transition-colors">
                                        <td className="px-3 py-1.5 font-medium text-primary-text">{course.courseCode}</td>
                                        <td className="px-3 py-1.5 text-secondary-text max-w-[200px] truncate">{course.courseName}</td>
                                        <td className="px-3 py-1.5 text-center text-secondary-text">{course.creditHours}</td>
                                        <td className="px-3 py-1.5 text-center text-secondary-text">{course.percentage.toFixed(1)}%</td>
                                        <td className="px-3 py-1.5 text-center">
                                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${getGradeBadgeClass(course.grade)}`}>
                                            {course.grade || '—'}
                                          </span>
                                        </td>
                                        <td className="px-3 py-1.5 text-center text-secondary-text">{course.gpaPoints.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Charts View ──────────────────────────────────────────────────────────────

function ChartsView({
  data,
  isDarkMode,
  primaryColor,
}: {
  data: AcademicRecordsData | null;
  isDarkMode: boolean;
  primaryColor: string;
}) {
  if (!data) return null;

  const gridStroke = isDarkMode ? '#404040' : '#e5e5e5';
  const axisStyle = { fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' };
  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#171717' : '#ffffff',
    border: `1px solid ${isDarkMode ? '#404040' : '#e5e5e5'}`,
    borderRadius: '8px',
    fontSize: 12,
    padding: '8px 12px',
  };

  // CGPA distribution buckets
  const cgpaBuckets: Record<string, number> = {
    '3.5–4.0': 0, '3.0–3.49': 0, '2.5–2.99': 0, '2.0–2.49': 0, 'Below 2.0': 0,
  };
  for (const s of data.students) {
    if (s.cgpa >= 3.5) cgpaBuckets['3.5–4.0']++;
    else if (s.cgpa >= 3.0) cgpaBuckets['3.0–3.49']++;
    else if (s.cgpa >= 2.5) cgpaBuckets['2.5–2.99']++;
    else if (s.cgpa >= 2.0) cgpaBuckets['2.0–2.49']++;
    else cgpaBuckets['Below 2.0']++;
  }
  const cgpaDistribution = Object.entries(cgpaBuckets).map(([range, count]) => ({ range, count }));

  return (
    <div className="space-y-4">
      {/* Row 1: Semester GPA Trend + Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Semester GPA Trend */}
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-primary-text mb-3">
            Semester-wise Average GPA Trend
          </h3>
          {data.semesterTrends.length === 0 ? (
            <p className="text-xs text-muted-text text-center py-8">No data available</p>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.semesterTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                  <XAxis dataKey="semester" tick={axisStyle} stroke={gridStroke} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={axisStyle} stroke={gridStroke} domain={[0, 4]} width={35} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="avgGPA" name="Avg GPA" stroke={primaryColor} strokeWidth={2} dot={{ r: 4, fill: primaryColor }} />
                  <Line type="monotone" dataKey="passRate" name="Pass Rate %" stroke={isDarkMode ? '#22c55e' : '#16a34a'} strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Grade Distribution Pie */}
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-primary-text mb-3">Grade Distribution</h3>
          {data.gradeDistribution.length === 0 ? (
            <p className="text-xs text-muted-text text-center py-8">No data available</p>
          ) : (
            <div className="h-[240px] flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={data.gradeDistribution}
                    dataKey="count"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                  >
                    {data.gradeDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[40%] pl-2 space-y-1.5">
                {data.gradeDistribution.map((item, i) => (
                  <div key={item.grade} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[11px] text-secondary-text">{item.grade}</span>
                    <span className="text-[11px] font-semibold text-primary-text ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: CGPA Distribution Bar */}
      <div className="bg-card border border-card-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary-text mb-3">CGPA Distribution of Students</h3>
        {data.students.length === 0 ? (
          <p className="text-xs text-muted-text text-center py-8">No data available</p>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cgpaDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                <XAxis dataKey="range" tick={axisStyle} stroke={gridStroke} />
                <YAxis tick={axisStyle} stroke={gridStroke} width={35} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Students" fill={primaryColor} radius={[4, 4, 0, 0]}>
                  {cgpaDistribution.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Row 3: Semester-wise Student Count & Pass Rate */}
      <div className="bg-card border border-card-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary-text mb-3">Semester-wise Student Count & Pass Rate</h3>
        {data.semesterTrends.length === 0 ? (
          <p className="text-xs text-muted-text text-center py-8">No data available</p>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.semesterTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                <XAxis dataKey="semester" tick={axisStyle} stroke={gridStroke} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={axisStyle} stroke={gridStroke} width={35} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="studentCount" name="Students" fill={primaryColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="passRate" name="Pass Rate %" fill={isDarkMode ? '#22c55e' : '#16a34a'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
