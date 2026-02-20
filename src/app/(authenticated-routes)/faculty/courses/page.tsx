'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: number;
  code: string;
  name: string;
  creditHours: number;
  type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS';
  department: {
    id: number;
    name: string;
    code: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  prerequisites: {
    prerequisite: {
      id: number;
      code: string;
      name: string;
    };
  }[];
  corequisites: {
    corequisite: {
      id: number;
      code: string;
      name: string;
    };
  }[];
}


export default function CoursesPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCourses();
  }, [search, type, status, page]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (type && type !== 'all') params.append('type', type);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/courses?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (courseType: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS') => {
    switch (courseType) {
      case 'THEORY':
        return <Badge variant="default" className="text-[10px]">Theory</Badge>;
      case 'LAB':
        return <Badge className="text-[10px] bg-[var(--success-green)] hover:bg-[var(--success-green)]">Lab</Badge>;
      case 'PROJECT':
        return <Badge variant="secondary" className="text-[10px]">Project</Badge>;
      case 'THESIS':
        return <Badge variant="destructive" className="text-[10px]">Thesis</Badge>;
      default:
        return <Badge className="text-[10px]">{courseType}</Badge>;
    }
  };

  const getStatusBadge = (courseStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    switch (courseStatus) {
      case 'ACTIVE':
        return <Badge className="text-[10px] bg-[var(--success-green)] hover:bg-[var(--success-green)]">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary" className="text-[10px]">Inactive</Badge>;
      case 'ARCHIVED':
        return <Badge variant="destructive" className="text-[10px]">Archived</Badge>;
      default:
        return <Badge className="text-[10px]">{courseStatus}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
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
          <p className="text-xs text-secondary-text">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - same as admin/faculty dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: primaryColor }} />
            My Courses
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View and manage your assigned courses
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs border-card-border"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs border-card-border">
              <SelectValue placeholder="Course Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="THEORY">Theory</SelectItem>
              <SelectItem value="LAB">Lab</SelectItem>
              <SelectItem value="PROJECT">Project</SelectItem>
              <SelectItem value="THESIS">Thesis</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs border-card-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border-card-border rounded-xl shadow-sm border">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Course list</h2>
          <p className="text-xs text-secondary-text mt-0.5">
            {courses.length} course{courses.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-card-border hover:bg-transparent">
                <TableHead className="text-xs text-secondary-text">Code</TableHead>
                <TableHead className="text-xs text-secondary-text">Name</TableHead>
                <TableHead className="text-xs text-secondary-text">Credit Hours</TableHead>
                <TableHead className="text-xs text-secondary-text">Type</TableHead>
                <TableHead className="text-xs text-secondary-text">Status</TableHead>
                <TableHead className="text-xs text-secondary-text text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow className="border-card-border hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-text">
                    No courses found
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow
                    key={course.id}
                    className="border-card-border hover:bg-[var(--hover-bg)] cursor-pointer"
                    onClick={() => router.push(`/faculty/courses/${course.id}`)}
                  >
                    <TableCell className="font-medium text-sm text-primary-text">{course.code}</TableCell>
                    <TableCell className="text-sm text-primary-text">{course.name}</TableCell>
                    <TableCell className="text-xs text-secondary-text">{course.creditHours}</TableCell>
                    <TableCell>{getTypeBadge(course.type)}</TableCell>
                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/faculty/courses/${course.id}`)}
                        className="p-2 rounded-lg transition-colors hover:bg-[var(--hover-bg)]"
                        style={{ color: primaryColor }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-card-border"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-xs text-secondary-text">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-card-border"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
