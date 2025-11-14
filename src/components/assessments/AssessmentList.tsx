'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Edit2, FileText, Trash2, Eye, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Assessment {
  id: number;
  title: string;
  description: string;
  type: string;
  totalMarks: number;
  dueDate: string;
  weightage: number;
  courseOffering?: {
    course: {
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
}

export function AssessmentList() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseOfferingFilter, setCourseOfferingFilter] =
    useState<string>('all');
  const [courseOfferings, setCourseOfferings] = useState<any[]>([]);
  const [isStudentRoute, setIsStudentRoute] = useState(false);

  const fetchAssessments = async () => {
    try {
      const apiUrl = isStudentRoute ? '/api/student/assessments' : '/api/assessments';
      
      const response = await fetch(apiUrl, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }
      const data = await response.json();
      const assessmentsList = data.success ? data.data : (Array.isArray(data) ? data : []);
      setAssessments(assessmentsList);
      setFilteredAssessments(assessmentsList);
    } catch (error) {
      toast.error('Failed to load assessments');
      console.error('Error fetching assessments:', error);
      setAssessments([]);
      setFilteredAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we're on student route
    const studentRoute = window.location.pathname.startsWith('/student');
    setIsStudentRoute(studentRoute);
    fetchAssessments();
    if (!studentRoute) {
      fetchCourseOfferings();
    }
  }, []);

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch('/api/faculty/course-offerings', {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCourseOfferings(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching course offerings:', error);
    }
  };

  useEffect(() => {
    let filtered = [...assessments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (assessment) =>
          assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assessment.courseOffering?.course.code
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assessment.courseOffering?.course.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(
        (assessment) => assessment.type === typeFilter
      );
    }

    // Status filter (if status exists in assessment)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((assessment: any) => {
        const status = assessment.status || 'active';
        return status === statusFilter;
      });
    }

    // Course offering filter
    if (courseOfferingFilter !== 'all') {
      filtered = filtered.filter((assessment: any) => {
        return assessment.courseOffering?.id === parseInt(courseOfferingFilter);
      });
    }

    setFilteredAssessments(filtered);
  }, [searchTerm, typeFilter, statusFilter, courseOfferingFilter, assessments]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assessment');
      }

      toast.success('Assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      toast.error('Failed to delete assessment');
      console.error('Error deleting assessment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const uniqueTypes = Array.from(
    new Set(assessments.map((a) => a.type))
  ).sort();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={courseOfferingFilter}
              onValueChange={setCourseOfferingFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courseOfferings.map((offering) => (
                  <SelectItem key={offering.id} value={offering.id.toString()}>
                    {offering.course.code} - {offering.semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm ||
            typeFilter !== 'all' ||
            statusFilter !== 'all' ||
            courseOfferingFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setCourseOfferingFilter('all');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredAssessments.length} result(s)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessments Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !Array.isArray(filteredAssessments) ||
        filteredAssessments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No assessments found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{assessment.title}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={isStudentRoute ? `/student/assessments/${assessment.id}` : `/faculty/assessments/${assessment.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {!isStudentRoute && (
                      <>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/faculty/assessments/${assessment.id}/items`}
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(assessment.id)}
                          disabled={deletingId === assessment.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {assessment.type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                  {(assessment as any).status && (
                    <Badge
                      variant={
                        (assessment as any).status === 'published'
                          ? 'default'
                          : (assessment as any).status === 'completed'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {(assessment as any).status}
                    </Badge>
                  )}
                  {assessment.courseOffering && (
                    <span className="text-xs">
                      {assessment.courseOffering.course.code} (
                      {assessment.courseOffering.semester.name})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assessment.courseOffering && (
                    <p className="text-sm font-medium">
                      {assessment.courseOffering.course.code} -{' '}
                      {assessment.courseOffering.course.name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {assessment.description}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span>Total Marks: {assessment.totalMarks}</span>
                    <span>Weightage: {assessment.weightage}%</span>
                  </div>
                  <p className="text-sm">
                    Due: {format(new Date(assessment.dueDate), 'PPP')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
