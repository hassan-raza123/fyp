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

  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  return (
    <div className="space-y-4">
      {/* Header - same as admin CLO page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My Courses</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View and manage your assigned courses
          </p>
        </div>
      </div>

      {/* Filters - inline row like admin CLO page */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Course Type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Types</SelectItem>
            <SelectItem value="THEORY" className="text-primary-text hover:bg-card/50">Theory</SelectItem>
            <SelectItem value="LAB" className="text-primary-text hover:bg-card/50">Lab</SelectItem>
            <SelectItem value="PROJECT" className="text-primary-text hover:bg-card/50">Project</SelectItem>
            <SelectItem value="THESIS" className="text-primary-text hover:bg-card/50">Thesis</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="ACTIVE" className="text-primary-text hover:bg-card/50">Active</SelectItem>
            <SelectItem value="INACTIVE" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
            <SelectItem value="ARCHIVED" className="text-primary-text hover:bg-card/50">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table - same wrapper as admin CLO: rounded-lg border bg-card, no extra header */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Credit Hours</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Type</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <BookOpen className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No courses found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow
                  key={course.id}
                  className="hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/faculty/courses/${course.id}`)}
                >
                  <TableCell className="text-xs font-medium text-primary-text">{course.code}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    <div>
                      <div className="font-medium">{course.name}</div>
                      {course.department?.code && (
                        <div className="text-secondary-text">{course.department.code}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">{course.creditHours}</TableCell>
                  <TableCell>{getTypeBadge(course.type)}</TableCell>
                  <TableCell>{getStatusBadge(course.status)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/faculty/courses/${course.id}`)}
                      className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7 flex items-center gap-1"
                      style={{ backgroundColor: iconBgColor, color: primaryColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = iconBgColor;
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - same as before */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-card-border"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-xs text-secondary-text">
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
