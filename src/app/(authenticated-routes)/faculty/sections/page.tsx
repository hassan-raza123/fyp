'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
  faculty: {
    user: {
      first_name: string;
      last_name: string;
    };
  } | null;
  batch: {
    name: string;
  };
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
}

export default function SectionsPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections');
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setSections(data);
      } else if (Array.isArray(data.data)) {
        setSections(data.data);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to fetch sections');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sections.filter((section) => {
    const matchesSearch =
      section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.courseOffering.course.code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      section.courseOffering.course.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (section.faculty &&
        `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || section.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[var(--success-green)] text-white';
      case 'inactive':
        return 'bg-[var(--gray-500)] text-white';
      case 'suspended':
        return 'bg-amber-500 text-white';
      case 'deleted':
        return 'bg-[var(--error)] text-white';
      default:
        return 'bg-[var(--gray-500)] text-white';
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
          <p className="text-xs text-secondary-text">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - same as My Courses / admin CLO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">My Sections</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View and manage your assigned sections
          </p>
        </div>
      </div>

      {/* Filters - inline row like My Courses */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
            <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
            <SelectItem value="suspended" className="text-primary-text hover:bg-card/50">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table - same wrapper as My Courses / admin CLO */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Section Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Course</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Batch</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Students</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No sections found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSections.map((section) => (
                <TableRow
                  key={section.id}
                  className="hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/faculty/sections/${section.id}`)}
                >
                  <TableCell className="text-xs font-medium text-primary-text">
                    {section.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    <div>
                      <div className="font-medium">
                        {section.courseOffering?.course?.code || 'N/A'}
                      </div>
                      <div className="text-secondary-text">
                        {section.courseOffering?.course?.name || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {section.courseOffering?.semester?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {section.batch?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {section.currentStudents ?? 0} / {section.maxStudents ?? 0}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(section.status)} text-[10px] px-1.5 py-0.5`}
                      variant="secondary"
                    >
                      {section.status.charAt(0).toUpperCase() + section.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/faculty/sections/${section.id}`)}
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
    </div>
  );
}
