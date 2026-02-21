'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, FileText, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface CourseOffering {
  id: number;
  semester: {
    id: number;
    name: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
  };
  status: string;
  sections: Array<{
    id: number;
    name: string;
    batch: {
      id: string;
      name: string;
    } | null;
    currentStudents: number;
    averagePerformance: number;
    totalAssessments: number;
  }>;
  totalAssessments: number;
}

export default function CourseOfferingsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, offeringsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`, { credentials: 'include' }),
        fetch(`/api/courses/${courseId}/offerings`, { credentials: 'include' }),
      ]);

      const [courseData, offeringsData] = await Promise.all([
        courseRes.json(),
        offeringsRes.json(),
      ]);

      if (!courseData.success) {
        throw new Error(courseData.error || 'Failed to fetch course');
      }

      setCourse(courseData.data);

      if (offeringsData.success) {
        setOfferings(offeringsData.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading course offerings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/faculty/courses/${courseId}`)}
          className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <FileText className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">
            Course Offerings - {course?.name} ({course?.code})
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View all offerings and section-wise performance
          </p>
        </div>
      </div>

      {offerings.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-card py-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-secondary-text" />
          <p className="text-xs text-secondary-text">No course offerings found for this course</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offerings.map((offering) => (
            <div key={offering.id} className="rounded-lg border border-card-border bg-card overflow-hidden">
              <div className="p-4 pb-2 border-b border-card-border">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-primary-text">
                      <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                      {offering.semester.name}
                    </h2>
                    <p className="text-xs text-secondary-text mt-0.5">
                      {offering.semester.startDate && new Date(offering.semester.startDate).toLocaleDateString()}
                      {' - '}
                      {offering.semester.endDate && new Date(offering.semester.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={offering.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                    {offering.status}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                {offering.sections.length === 0 ? (
                  <p className="text-xs text-secondary-text text-center py-4">No sections found</p>
                ) : (
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-semibold text-primary-text">Section Name</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Batch</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Enrollment</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Assessments</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Avg Performance</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offering.sections.map((section) => (
                          <TableRow key={section.id} className="hover:bg-[var(--hover-bg)]">
                            <TableCell className="font-medium text-xs text-primary-text">{section.name}</TableCell>
                            <TableCell className="text-xs text-primary-text">{section.batch?.name || 'N/A'}</TableCell>
                            <TableCell className="text-xs text-primary-text">
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-secondary-text" />
                                {section.currentStudents}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-primary-text">{section.totalAssessments}</TableCell>
                            <TableCell className="text-xs text-primary-text">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-[var(--success-green)]" />
                                <span className="font-medium">{section.averagePerformance.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-primary-text">
                              <button
                                type="button"
                                onClick={() => router.push(`/faculty/sections/${section.id}`)}
                                className="px-2 py-1 rounded-lg text-xs font-medium h-7"
                                style={{ backgroundColor: iconBgColor, color: primaryColor }}
                              >
                                View Details
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
