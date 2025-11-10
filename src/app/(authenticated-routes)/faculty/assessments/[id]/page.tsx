'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    return <p className="text-muted-foreground">Loading submissions...</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Roll Number</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted At</TableHead>
          <TableHead>Marks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No submissions yet
            </TableCell>
          </TableRow>
        ) : (
          submissions.map((submission) => (
            <TableRow key={submission.studentId}>
              <TableCell>{submission.rollNumber}</TableCell>
              <TableCell>{submission.studentName}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    submission.status === 'published'
                      ? 'default'
                      : submission.status === 'evaluated'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {submission.status}
                </Badge>
              </TableCell>
              <TableCell>
                {submission.submittedAt
                  ? format(new Date(submission.submittedAt), 'PPP')
                  : 'Not submitted'}
              </TableCell>
              <TableCell>
                {submission.obtainedMarks} / {submission.totalMarks} (
                {submission.percentage.toFixed(1)}%)
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
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
    return <p className="text-muted-foreground">Loading results...</p>;
  }

  if (!analytics) {
    return <p className="text-muted-foreground">No results available</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overall.totalStudents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overall.averageMarks.toFixed(1)} /{' '}
              {analytics.overall.totalMarks}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overall.averagePercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overall.totalStudents > 0
                ? (
                    (analytics.gradeDistribution
                      .filter((g: any) => g.grade !== 'F')
                      .reduce((sum: number, g: any) => sum + g.count, 0) /
                      analytics.overall.totalStudents) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Grade Distribution</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grade</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics.gradeDistribution.map((grade: any) => (
              <TableRow key={grade.grade}>
                <TableCell>
                  <Badge variant="outline">{grade.grade}</Badge>
                </TableCell>
                <TableCell>{grade.count}</TableCell>
                <TableCell>
                  {analytics.overall.totalStudents > 0
                    ? (
                        (grade.count / analytics.overall.totalStudents) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
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
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [showReminderDialog, setShowReminderDialog] = useState(false);

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
      // In production, this would send actual notifications
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Reminders sent to all students');
      setShowReminderDialog(false);
      setReminderMessage('');
    } catch (error) {
      toast.error('Failed to send reminders');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div>Loading...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto py-6">
        <div>Assessment not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{assessment.title}</h1>
            <p className="text-muted-foreground">
              {assessment.courseOffering.course.code} -{' '}
              {assessment.courseOffering.course.name} (
              {assessment.courseOffering.semester.name})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {assessment.status === 'active' ? (
            <Button onClick={handlePublish}>Publish</Button>
          ) : (
            <Button variant="outline" onClick={handleUnpublish}>
              Unpublish
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowExtendDialog(true)}>
            <Clock className="w-4 h-4 mr-2" />
            Extend Due Date
          </Button>
          <Button variant="outline" onClick={() => setShowReminderDialog(true)}>
            <Send className="w-4 h-4 mr-2" />
            Send Reminder
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/faculty/assessments/${params.id}/analytics`}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="clo-coverage">CLO Coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Type
                  </p>
                  <p className="text-lg">
                    {assessment.type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Marks
                  </p>
                  <p className="text-lg">{assessment.totalMarks}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Weightage
                  </p>
                  <p className="text-lg">{assessment.weightage}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </p>
                  <p className="text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(assessment.dueDate), 'PPP')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-sm mt-1">{assessment.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Instructions
                </p>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {assessment.instructions}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assessment Items</CardTitle>
              <Button asChild>
                <Link href={`/faculty/assessments/${params.id}/items`}>
                  Manage Items
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question No</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>CLO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessment.assessmentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No items added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    assessment.assessmentItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.questionNo}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {item.description}
                        </TableCell>
                        <TableCell>{item.marks}</TableCell>
                        <TableCell>
                          {item.clo ? (
                            <Badge variant="outline">{item.clo.code}</Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              No CLO
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionList assessmentId={assessment.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Results Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsOverview assessmentId={assessment.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clo-coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CLO Coverage Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessment.assessmentItems.length > 0 ? (
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
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No items added yet. Add items to see CLO coverage.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extend Due Date Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Due Date</DialogTitle>
            <DialogDescription>
              Select a new due date for this assessment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Due Date</Label>
              <Input
                type="datetime-local"
                onChange={(e) => setNewDueDate(new Date(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExtendDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExtendDueDate}>Extend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Reminder to Students</DialogTitle>
            <DialogDescription>
              Send a reminder message to all students enrolled in this
              assessment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reminder Message</Label>
              <Textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Enter reminder message..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReminderDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendReminder}>Send Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
