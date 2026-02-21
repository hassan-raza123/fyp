'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  currentSection?: string;
  currentInstructor?: string;
  currentSemester?: string;
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

interface Semester {
  id: number;
  name: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [semesterId, setSemesterId] = useState<string>('all');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [search, type, status, semesterId, page]);


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
      if (semesterId && semesterId !== 'all') params.append('semesterId', semesterId);

      const response = await fetch(`/api/student/courses?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS') => {
    switch (type) {
      case 'THEORY':
        return <Badge className="bg-[var(--blue)] text-white text-[10px] px-1.5 py-0.5">Theory</Badge>;
      case 'LAB':
        return <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5">Lab</Badge>;
      case 'PROJECT':
        return <Badge className="bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5">Project</Badge>;
      case 'THESIS':
        return <Badge className="bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5">Thesis</Badge>;
      default:
        return <Badge className="text-[10px] px-1.5 py-0.5">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5">Active</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5">Inactive</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5">Archived</Badge>;
      default:
        return <Badge className="text-[10px] px-1.5 py-0.5">{status}</Badge>;
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
              borderRightColor: 'transparent',
              borderBottomColor: primaryColor,
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
      {/* Header - admin CLO style (title + subtitle only) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My Courses</h1>
          <p className="text-xs text-secondary-text mt-0.5">View enrolled courses and details</p>
        </div>
      </div>

      {/* Filters - admin CLO style */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search enrolled courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-card border-card-border text-primary-text">
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
          <SelectTrigger className="w-[180px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="ACTIVE" className="text-primary-text hover:bg-card/50">Active</SelectItem>
            <SelectItem value="INACTIVE" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
            <SelectItem value="ARCHIVED" className="text-primary-text hover:bg-card/50">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={semesterId} onValueChange={setSemesterId}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Semester" />
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

      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Section</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Instructor</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Credit Hours</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Type</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">{course.code}</TableCell>
                <TableCell className="text-xs text-primary-text">{course.name}</TableCell>
                <TableCell className="text-xs text-secondary-text">{course.currentSection || 'N/A'}</TableCell>
                <TableCell className="text-xs text-secondary-text">{course.currentInstructor || 'TBA'}</TableCell>
                <TableCell className="text-xs text-secondary-text">{course.currentSemester || 'N/A'}</TableCell>
                <TableCell className="text-xs text-primary-text">{course.creditHours}</TableCell>
                <TableCell>{getTypeBadge(course.type)}</TableCell>
                <TableCell>{getStatusBadge(course.status)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => router.push(`/student/courses/${course.id}`)}
                    className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7 flex items-center justify-center"
                    style={{ backgroundColor: iconBgColor, color: primaryColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = iconBgColor;
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
