'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Target } from 'lucide-react';

interface CLO {
  id: number;
  code: string;
  description: string;
  bloomLevel: string | null;
  status: 'active' | 'inactive' | 'archived';
  courseId: number;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function CourseCLOsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const courseId = params.id as string;
  const [clos, setCLOs] = useState<CLO[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [closRes, courseRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/clos`, {
          credentials: 'include',
        }),
        fetch(`/api/courses/${courseId}`, {
          credentials: 'include',
        }),
      ]);
      const [closData, courseData] = await Promise.all([
        closRes.json(),
        courseRes.json(),
      ]);
      if (!closData.success || !courseData.success) {
        throw new Error(
          closData.error || courseData.error || 'Failed to fetch data'
        );
      }
      setCLOs(closData.data);
      setCourse(courseData.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching CLOs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  if (!mounted || isLoading) {
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
          <p className="text-xs text-secondary-text">Loading CLOs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-hover-bg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-primary-text">CLOs for {course?.name} ({course?.code})</h1>
            <p className="text-xs text-secondary-text mt-0.5">View Course Learning Outcomes</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-text" style={{ color: primaryColor }} />
          <h2 className="text-sm font-semibold text-primary-text">Course Learning Outcomes</h2>
        </div>
        <div className="p-4">
          {clos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-secondary-text">No learning outcomes defined for this course</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Bloom&apos;s Level</TableHead>
                  <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clos.map((clo) => (
                  <TableRow key={clo.id} className="hover:bg-hover-bg transition-colors">
                    <TableCell className="text-xs font-medium text-primary-text">{clo.code}</TableCell>
                    <TableCell className="text-xs text-secondary-text">{clo.description}</TableCell>
                    <TableCell className="text-xs text-secondary-text">{clo.bloomLevel || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          clo.status === 'active'
                            ? 'bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5'
                            : clo.status === 'inactive'
                            ? 'bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5'
                            : 'bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5'
                        }
                        variant="secondary"
                      >
                        {clo.status}
                      </Badge>
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
