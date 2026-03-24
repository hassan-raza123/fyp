'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Offering {
  courseOfferingId: number;
  semester: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  section: {
    id: number;
    name: string;
    faculty: string;
  };
  grade: {
    grade: string;
    percentage: number;
    gpaPoints: number;
    obtainedMarks: number;
    totalMarks: number;
  } | null;
  enrollmentDate: string;
}

interface OfferingsData {
  course: {
    id: number;
    code: string;
    name: string;
  };
  offerings: Offering[];
}

export default function CourseOfferingsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OfferingsData | null>(null);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!courseId) return;
    fetchOfferings();
  }, [courseId]);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/courses/${courseId}/offerings`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch offerings');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch offerings');
      }
    } catch (error) {
      console.error('Error fetching offerings:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch offerings'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
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
          <p className="text-xs text-secondary-text">Loading offerings...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary-text">Course Offerings</h1>
            <p className="text-xs text-secondary-text mt-0.5">No offerings data available</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Course
          </button>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-xs text-secondary-text">No offerings data available for this course.</p>
        </div>
      </div>
    );
  }

  const getGradeBadgeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'bg-[var(--success-green)] text-white';
    if (['B+', 'B'].includes(grade)) return 'bg-[var(--blue)] text-white dark:bg-[var(--orange)]';
    if (['C+', 'C'].includes(grade)) return 'bg-[var(--warning)] text-white';
    return 'bg-[var(--error)] text-white';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header - admin CLO style (title + subtitle, back on right) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Course Offerings</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            {data.course.code} - {data.course.name}
          </p>
        </div>
        <button
          onClick={() => router.push(`/student/courses/${courseId}`)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Course
        </button>
      </div>

      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-text" style={{ color: primaryColor }} />
          <h2 className="text-sm font-semibold text-primary-text">All Semesters</h2>
        </div>
        <div className="p-4">
          {data.offerings.length === 0 ? (
            <p className="text-xs text-secondary-text text-center py-4">No course offerings found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Section</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Instructor</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Enrollment Date</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Grade</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Percentage</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">GPA Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.offerings.map((offering) => (
                  <TableRow key={offering.courseOfferingId} className="hover:bg-hover-bg transition-colors">
                    <TableCell className="text-xs font-medium text-primary-text">{offering.semester.name}</TableCell>
                    <TableCell className="text-xs text-secondary-text">{offering.section.name}</TableCell>
                    <TableCell className="text-xs text-secondary-text">{offering.section.faculty}</TableCell>
                    <TableCell className="text-xs text-secondary-text">{formatDate(offering.enrollmentDate)}</TableCell>
                    <TableCell>
                      {offering.grade ? (
                        <Badge className={`${getGradeBadgeColor(offering.grade.grade)} text-[10px] px-1.5 py-0.5`}>
                          {offering.grade.grade}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-text">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">
                      {offering.grade ? `${offering.grade.percentage.toFixed(1)}%` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">
                      {offering.grade ? offering.grade.gpaPoints.toFixed(2) : 'N/A'}
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

