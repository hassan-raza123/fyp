'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Send,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Submission List Component
function SubmissionList({ assessmentId }: { assessmentId: number }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [assessmentId]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(
        `/api/assessments/${assessmentId}/analytics`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const result = await response.json();
      if (result.success) {
        setSubmissions(result.data.studentResults || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-secondary-text">Loading submissions...</p>;
  }

  return (
    <div className="rounded-lg border border-card-border bg-card overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs font-semibold text-primary-text">Roll Number</TableHead>
          <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
          <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
          <TableHead className="text-xs font-semibold text-primary-text">Submitted At</TableHead>
          <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-xs text-secondary-text py-8">
              No submissions yet
            </TableCell>
          </TableRow>
        ) : (
          submissions.map((submission) => (
            <TableRow key={submission.studentId} className="hover:bg-[var(--hover-bg)]">
              <TableCell className="text-xs text-primary-text">{submission.rollNumber}</TableCell>
              <TableCell className="text-xs text-primary-text">{submission.studentName}              </TableCell>
              <TableCell className="text-xs text-primary-text">
                <Badge
                  variant={
                    submission.status === 'published'
                      ? 'default'
                      : submission.status === 'evaluated'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="text-[10px]"
                >
                  {submission.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-secondary-text">
                {submission.submittedAt
                  ? format(new Date(submission.submittedAt), 'PPP')
                  : 'Not submitted'}
              </TableCell>
              <TableCell className="text-xs text-primary-text">
                {submission.obtainedMarks} / {submission.totalMarks} ({submission.percentage.toFixed(1)}%)
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    </div>
  );
}

// Results Overview Component
function ResultsOverview({ assessmentId }: { assessmentId: number }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [assessmentId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(
        `/api/assessments/${assessmentId}/analytics`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch results');
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-secondary-text">Loading results...</p>;
  }

  if (!analytics) {
    return <p className="text-secondary-text">No results available</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-xs font-medium text-secondary-text mb-1">Total Students</p>
          <div className="text-lg font-bold text-primary-text">{analytics.overall.totalStudents}</div>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-xs font-medium text-secondary-text mb-1">Average Marks</p>
          <div className="text-lg font-bold text-primary-text">
            {analytics.overall.averageMarks.toFixed(1)} / {analytics.overall.totalMarks}
          </div>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-xs font-medium text-secondary-text mb-1">Average %</p>
          <div className="text-lg font-bold text-primary-text">{analytics.overall.averagePercentage.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-xs font-medium text-secondary-text mb-1">Pass Rate</p>
          <div className="text-lg font-bold text-primary-text">
            {analytics.overall.totalStudents > 0
              ? (
                  (analytics.gradeDistribution
                    .filter((g: any) => g.grade !== 'F')
                    .reduce((sum: number, g: any) => sum + g.count, 0) /
                    analytics.overall.totalStudents) *
                  100
                ).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h3 className="text-sm font-semibold text-primary-text">Grade Distribution</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Grade</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Count</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics.gradeDistribution.map((grade: any) => (
              <TableRow key={grade.grade} className="hover:bg-[var(--hover-bg)]">
                <TableCell className="text-xs text-primary-text">
                  <Badge variant="outline" className="text-[10px] border-card-border text-primary-text">{grade.grade}</Badge>
                </TableCell>
                <TableCell className="text-xs text-primary-text">{grade.count}</TableCell>
                <TableCell className="text-xs text-primary-text">
                  {analytics.overall.totalStudents > 0
                    ? ((grade.count / analytics.overall.totalStudents) * 100).toFixed(1)
                    : 0}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  type: string;
  totalMarks: number;
  dueDate: string;
  weightage: number;
  instructions: string;
  status: string;
  courseOffering: {
    course: {
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
  assessmentItems: Array<{
    id: number;
    questionNo: string;
    description: string;
    marks: number;
    clo?: {
      id: number;
      code: string;
      description: string;
    };
  }>;
}

export default function AssessmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    fetchAssessment();
  }, [params.id]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/assessments/${params.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch assessment');
      const data = await response.json();
      setAssessment(data);
    } catch (error) {
      toast.error('Failed to load assessment');
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const response = await fetch(`/api/assessments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'published' }),
      });
      if (!response.ok) throw new Error('Failed to publish');
      toast.success('Assessment published successfully');
      fetchAssessment();
    } catch (error) {
      toast.error('Failed to publish assessment');
    }
  };

  const handleUnpublish = async () => {
    try {
      const response = await fetch(`/api/assessments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'active' }),
      });
      if (!response.ok) throw new Error('Failed to unpublish');
      toast.success('Assessment unpublished successfully');
      fetchAssessment();
    } catch (error) {
      toast.error('Failed to unpublish assessment');
    }
  };

  const handleExtendDueDate = async () => {
    if (!newDueDate) {
      toast.error('Please select a new due date');
      return;
    }
    try {
      const response = await fetch(`/api/assessments/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...assessment,
          dueDate: newDueDate.toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to extend due date');
      toast.success('Due date extended successfully');
      setShowExtendDialog(false);
      fetchAssessment();
    } catch (error) {
      toast.error('Failed to extend due date');
    }
  };

  const handleSendReminder = async () => {
    if (!reminderMessage.trim()) {
      toast.error('Please enter a reminder message');
      return;
    }
    try {
      const response = await fetch(
        `/api/assessments/${params.id}/send-reminders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: reminderMessage }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reminders');
      }

      const result = await response.json();
      toast.success(
        result.message || `Reminders sent to ${result.data?.studentsNotified || 0} student(s)`
      );
      setShowReminderDialog(false);
      setReminderMessage('');
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to send reminders'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-page gap-4">
        <p className="text-xs text-secondary-text">Assessment not found</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
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
            <h1 className="text-lg font-bold text-primary-text">{assessment.title}</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              {assessment.courseOffering.course.code} -{' '}
              {assessment.courseOffering.course.name} (
              {assessment.courseOffering.semester.name})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {assessment.status === 'active' ? (
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: primaryColor }}
              onClick={handlePublish}
            >
              Publish
            </button>
          ) : (
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium"
              onClick={handleUnpublish}
            >
              Unpublish
            </button>
          )}
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium inline-flex items-center gap-2"
            onClick={() => setShowExtendDialog(true)}
          >
            <Clock className="w-4 h-4" />
            Extend Due Date
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium inline-flex items-center gap-2"
            onClick={() => setShowReminderDialog(true)}
          >
            <Send className="w-4 h-4" />
            Send Reminder
          </button>
          <Link
            href={`/faculty/assessments/${params.id}/analytics`}
            className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium inline-flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-card border border-card-border p-1 rounded-lg">
          <TabsTrigger value="info" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Info</TabsTrigger>
          <TabsTrigger value="items" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Items</TabsTrigger>
          <TabsTrigger value="submissions" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Submissions</TabsTrigger>
          <TabsTrigger value="results" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Results</TabsTrigger>
          <TabsTrigger value="clo-coverage" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">CLO Coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Assessment Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-secondary-text">
                    Type
                  </p>
                  <p className="text-lg text-primary-text">
                    {assessment.type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-text">
                    Status
                  </p>
                  <Badge
                    variant={
                      assessment.status === 'published'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {assessment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-text">
                    Total Marks
                  </p>
                  <p className="text-lg text-primary-text">{assessment.totalMarks}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-text">
                    Weightage
                  </p>
                  <p className="text-lg text-primary-text">{assessment.weightage}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-text">
                    Due Date
                  </p>
                  <p className="text-lg flex items-center gap-2 text-primary-text">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(assessment.dueDate), 'PPP')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Description
                </p>
                <p className="text-sm mt-1 text-primary-text">{assessment.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-text">
                  Instructions
                </p>
                <p className="text-sm mt-1 whitespace-pre-wrap text-primary-text">
                  {assessment.instructions}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border flex flex-row items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-primary-text">Assessment Items</h2>
              <Link
                href={`/faculty/assessments/${params.id}/items`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Manage Items
              </Link>
            </div>
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-primary-text">Question No</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text">CLO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessment.assessmentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-secondary-text py-8">
                        No items added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    assessment.assessmentItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-[var(--hover-bg)]">
                        <TableCell className="text-xs text-primary-text">{item.questionNo}</TableCell>
                        <TableCell className="max-w-md truncate text-xs text-primary-text">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-xs text-primary-text">{item.marks}</TableCell>
                        <TableCell className="text-xs text-primary-text">
                          {item.clo ? (
                            <Badge variant="outline" className="text-[10px] border-card-border">{item.clo.code}</Badge>
                          ) : (
                            <span className="text-secondary-text">No CLO</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Student Submissions</h2>
            </div>
            <div className="p-4">
              <SubmissionList assessmentId={assessment.id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Results Overview</h2>
            </div>
            <div className="p-4">
              <ResultsOverview assessmentId={assessment.id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clo-coverage" className="space-y-4">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">CLO Coverage Analysis</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {assessment.assessmentItems.length > 0 ? (
                  <>
                    {/* CLO Summary */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        CLOs Covered by Assessment Items:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          new Set(
                            assessment.assessmentItems
                              .filter((item) => item.clo)
                              .map((item) => item.clo!.code)
                          )
                        ).map((cloCode) => (
                          <Badge key={cloCode} variant="outline">
                            {cloCode}
                          </Badge>
                        ))}
                        {assessment.assessmentItems.filter((item) => !item.clo).length > 0 && (
                          <Badge variant="secondary">
                            {assessment.assessmentItems.filter((item) => !item.clo).length} Unmapped
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* CLO-wise Breakdown */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium">CLO-wise Marks Distribution:</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>CLO Code</TableHead>
                            <TableHead>Items Count</TableHead>
                            <TableHead>Total Marks</TableHead>
                            <TableHead>Percentage of Assessment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from(
                            new Map(
                              assessment.assessmentItems
                                .filter((item) => item.clo)
                                .map((item) => [
                                  item.clo!.code,
                                  {
                                    code: item.clo!.code,
                                    items: [] as any[],
                                  },
                                ])
                            ).values()
                          ).map((cloGroup) => {
                            const cloItems = assessment.assessmentItems.filter(
                              (item) => item.clo?.code === cloGroup.code
                            );
                            const totalMarks = cloItems.reduce(
                              (sum, item) => sum + item.marks,
                              0
                            );
                            const percentage =
                              assessment.totalMarks > 0
                                ? ((totalMarks / assessment.totalMarks) * 100).toFixed(1)
                                : '0';

                            return (
                              <TableRow key={cloGroup.code}>
                                <TableCell>
                                  <Badge variant="outline">{cloGroup.code}</Badge>
                                </TableCell>
                                <TableCell>{cloItems.length}</TableCell>
                                <TableCell>{totalMarks}</TableCell>
                                <TableCell>{percentage}%</TableCell>
                              </TableRow>
                            );
                          })}
                          {assessment.assessmentItems.filter((item) => !item.clo).length > 0 && (
                            <TableRow>
                              <TableCell>
                                <Badge variant="secondary">Unmapped</Badge>
                              </TableCell>
                              <TableCell>
                                {assessment.assessmentItems.filter((item) => !item.clo).length}
                              </TableCell>
                              <TableCell>
                                {assessment.assessmentItems
                                  .filter((item) => !item.clo)
                                  .reduce((sum, item) => sum + item.marks, 0)}
                              </TableCell>
                              <TableCell>
                                {assessment.totalMarks > 0
                                  ? (
                                      (assessment.assessmentItems
                                        .filter((item) => !item.clo)
                                        .reduce((sum, item) => sum + item.marks, 0) /
                                        assessment.totalMarks) *
                                      100
                                    ).toFixed(1)
                                  : '0'}
                                %
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Items per CLO */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium">Items by CLO:</p>
                      {Array.from(
                        new Set(
                          assessment.assessmentItems
                            .filter((item) => item.clo)
                            .map((item) => item.clo!.code)
                        )
                      ).map((cloCode) => {
                        const cloItems = assessment.assessmentItems.filter(
                          (item) => item.clo?.code === cloCode
                        );
                        return (
                          <div
                            key={cloCode}
                            className="rounded-lg border border-card-border bg-card overflow-hidden"
                          >
                            <div className="p-4 border-b border-card-border">
                              <p className="text-sm font-semibold text-primary-text">
                                <Badge variant="outline" className="mr-2">
                                  {cloCode}
                                </Badge>
                                {cloItems.length} item(s) -{' '}
                                {cloItems.reduce((sum, item) => sum + item.marks, 0)} marks
                              </p>
                            </div>
                            <div className="p-4">
                              <div className="space-y-2">
                                {cloItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 border border-card-border rounded-lg bg-[var(--hover-bg)]"
                                  >
                                    <div>
                                      <span className="font-medium text-primary-text">{item.questionNo}:</span>{' '}
                                      <span className="text-sm text-secondary-text">
                                        {item.description}
                                      </span>
                                    </div>
                                    <Badge variant="secondary">{item.marks} marks</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-secondary-text">
                    No items added yet. Add items to see CLO coverage.
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Extend Due Date Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Extend Due Date</DialogTitle>
            <DialogDescription className="text-secondary-text text-xs">
              Select a new due date for this assessment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-secondary-text">New Due Date</Label>
              <Input
                type="datetime-local"
                className="h-8 text-xs bg-card border-card-border text-primary-text mt-1"
                onChange={(e) => setNewDueDate(new Date(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium"
              onClick={() => setShowExtendDialog(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: primaryColor }}
              onClick={handleExtendDueDate}
            >
              Extend
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Send Reminder to Students</DialogTitle>
            <DialogDescription className="text-secondary-text text-xs">
              Send a reminder message to all students enrolled in this
              assessment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-secondary-text">Reminder Message</Label>
              <Textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Enter reminder message..."
                rows={5}
                className="mt-1 text-xs bg-card border-card-border text-primary-text"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium"
              onClick={() => setShowReminderDialog(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: primaryColor }}
              onClick={handleSendReminder}
            >
              Send Reminder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
