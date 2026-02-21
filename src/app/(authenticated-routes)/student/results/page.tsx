'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  GraduationCap,
  Target,
  Award,
  FileText,
  Download,
  Eye,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Grade {
  id: number;
  courseOffering: {
    course: {
      id: number;
      code: string;
      name: string;
      creditHours: number;
    };
    semester: {
      name: string;
    };
  };
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  gpaPoints: number;
  creditHours: number;
  qualityPoints: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [cgpa, setCgpa] = useState<number>(0);
  const [semesterGPAs, setSemesterGPAs] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [selectedSemester]);

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters', {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSemesters(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSemester !== 'all') {
        params.append('semesterId', selectedSemester);
      }

      const response = await fetch(
        `/api/student/grades?${params.toString()}`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch grades');
      const result = await response.json();
      if (result.success) {
        setGrades(result.data);
        calculateGPAs(result.data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const calculateGPAs = (gradesData: Grade[]) => {
    // Calculate CGPA (overall)
    let totalQualityPoints = 0;
    let totalCreditHours = 0;
    gradesData.forEach((grade) => {
      totalQualityPoints += grade.qualityPoints;
      totalCreditHours += grade.creditHours;
    });
    const overallCGPA = totalCreditHours > 0 ? totalQualityPoints / totalCreditHours : 0;
    setCgpa(overallCGPA);

    // Calculate semester-wise GPA
    const semesterMap = new Map<string, { qualityPoints: number; creditHours: number }>();
    gradesData.forEach((grade) => {
      const semesterName = grade.courseOffering.semester.name;
      const existing = semesterMap.get(semesterName) || { qualityPoints: 0, creditHours: 0 };
      semesterMap.set(semesterName, {
        qualityPoints: existing.qualityPoints + grade.qualityPoints,
        creditHours: existing.creditHours + grade.creditHours,
      });
    });

    const semesterGPAMap = new Map<string, number>();
    semesterMap.forEach((data, semester) => {
      const gpa = data.creditHours > 0 ? data.qualityPoints / data.creditHours : 0;
      semesterGPAMap.set(semester, gpa);
    });
    setSemesterGPAs(semesterGPAMap);
  };

  const exportToCSV = () => {
    if (grades.length === 0) {
      toast.error('No grades to export');
      return;
    }

    const headers = [
      'Course Code',
      'Course Name',
      'Semester',
      'Credit Hours',
      'Obtained Marks',
      'Total Marks',
      'Percentage',
      'Grade',
      'GPA Points',
      'Quality Points',
    ];

    const rows = grades.map((grade) => [
      grade.courseOffering.course.code,
      grade.courseOffering.course.name,
      grade.courseOffering.semester.name,
      grade.creditHours.toString(),
      grade.obtainedMarks.toFixed(1),
      grade.totalMarks.toFixed(1),
      grade.percentage.toFixed(1),
      grade.grade,
      grade.gpaPoints.toFixed(2),
      grade.qualityPoints.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `grades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Grades exported successfully');
  };

  const getGradeBadgeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'bg-[var(--success-green)] text-white';
    if (['B+', 'B'].includes(grade)) return 'bg-[var(--blue)] text-white';
    if (['C+', 'C'].includes(grade)) return 'bg-[var(--warning)] text-white';
    return 'bg-[var(--error)] text-white';
  };

  // Get unique semesters from grades for display
  const uniqueSemesters = Array.from(
    new Set(grades.map((g) => g.courseOffering.semester.name))
  );

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: primaryColor,
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          />
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">My Results</h1>
            <p className="text-xs text-secondary-text mt-0.5">View grades and attainments</p>
          </div>
        </div>
        {grades.length > 0 && (
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export to CSV
          </button>
        )}
      </div>

      {/* CGPA and Semester GPAs Summary */}
      {grades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-card-border rounded-lg p-4">
            <p className="text-xs font-medium text-secondary-text">Overall CGPA</p>
            <div className="text-lg font-bold mt-1 text-primary-text">{cgpa.toFixed(2)}</div>
            <p className="text-[10px] text-muted-text mt-1">Cumulative Grade Point Average</p>
          </div>
          {uniqueSemesters.slice(0, 3).map((semester) => {
            const semesterGPA = semesterGPAs.get(semester) || 0;
            return (
              <div key={semester} className="bg-card border border-card-border rounded-lg p-4">
                <p className="text-xs font-medium text-secondary-text">{semester} GPA</p>
                <div className="text-lg font-bold mt-1 text-primary-text">{semesterGPA.toFixed(2)}</div>
                <p className="text-[10px] text-muted-text mt-1">Semester Grade Point Average</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/student/results/clo-attainments">
          <div className="bg-card border border-card-border rounded-lg p-4 hover:bg-hover-bg transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary-text" />
              <span className="text-sm font-semibold text-primary-text">My CLO Attainments</span>
            </div>
            <p className="text-xs text-secondary-text">View my Course Learning Outcomes achievement</p>
          </div>
        </Link>
        <Link href="/student/results/plo-attainments">
          <div className="bg-card border border-card-border rounded-lg p-4 hover:bg-hover-bg transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-primary-text" />
              <span className="text-sm font-semibold text-primary-text">My PLO Attainments</span>
            </div>
            <p className="text-xs text-secondary-text">View my Program Learning Outcomes achievement</p>
          </div>
        </Link>
        <div className="bg-card border border-card-border rounded-lg p-4 h-full">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-primary-text" />
            <span className="text-sm font-semibold text-primary-text">My Grades</span>
          </div>
          <p className="text-xs text-secondary-text">View all your course grades and GPA</p>
        </div>
      </div>

      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary-text">Course Grades</h2>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Filter by semester" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Semesters</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id.toString()} className="text-primary-text hover:bg-card/50">
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
              />
              <span className="text-xs text-secondary-text ml-2">Loading grades...</span>
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-8 text-xs text-secondary-text">No grades available yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-primary-text">Course Code</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Course Name</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Credit Hours</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Percentage</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Grade</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">GPA Points</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Quality Points</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id} className="hover:bg-hover-bg transition-colors">
                    <TableCell className="text-xs font-medium text-primary-text">{grade.courseOffering.course.code}</TableCell>
                    <TableCell className="text-xs text-primary-text">{grade.courseOffering.course.name}</TableCell>
                    <TableCell className="text-xs text-secondary-text">{grade.courseOffering.semester.name}</TableCell>
                    <TableCell className="text-xs text-primary-text">{grade.creditHours}</TableCell>
                    <TableCell className="text-xs text-primary-text">{grade.obtainedMarks.toFixed(1)} / {grade.totalMarks.toFixed(1)}</TableCell>
                    <TableCell className="text-xs text-primary-text">{grade.percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge className={`${getGradeBadgeColor(grade.grade)} text-[10px] px-1.5 py-0.5`}>{grade.grade}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">{grade.gpaPoints.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-primary-text">{grade.qualityPoints.toFixed(2)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => router.push(`/student/courses/${grade.courseOffering.course.id}`)}
                        className="px-2 py-1 rounded-md text-xs font-medium h-7 flex items-center gap-1 transition-colors"
                        style={{ backgroundColor: iconBgColor, color: primaryColor }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
