'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, List, Award, Target } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface AssessmentData {
  assessment: {
    id: number;
    title: string;
    type: string;
    totalMarks: number;
    weightage: number;
    dueDate: string | null;
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: {
      id: number;
      name: string;
    };
  };
  result: {
    id: number;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    grade: string | null;
    status: string;
    submittedAt: string | null;
    evaluatedAt: string | null;
    remarks: string | null;
    itemResults: Array<{
      id: number;
      questionNo: number;
      description: string;
      totalMarks: number;
      obtainedMarks: number;
      remarks: string | null;
      clo: {
        id: number;
        code: string;
        description: string;
      } | null;
    }>;
  } | null;
}

interface AssessmentItem {
  id: number;
  questionNo: number;
  description: string;
  marks: number;
  clo: {
    id: number;
    code: string;
    description: string;
  } | null;
  obtainedMarks: number | null;
  remarks: string | null;
}

interface CLOCoverage {
  clo: {
    id: number;
    code: string;
    description: string;
  };
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  items: Array<{
    id: number;
    questionNo: number;
    description: string;
    marks: number;
    obtainedMarks: number;
  }>;
}

export default function AssessmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const assessmentId = params?.id;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('information');
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [cloCoverage, setCloCoverage] = useState<CLOCoverage[]>([]);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!assessmentId) return;
    fetchAssessmentData();
  }, [assessmentId]);

  useEffect(() => {
    if (activeTab === 'items' && assessmentId) {
      fetchItems();
    } else if (activeTab === 'clo-coverage' && assessmentId) {
      fetchCLOCoverage();
    }
  }, [activeTab, assessmentId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/assessments/${assessmentId}/result`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch assessment');
      const result = await response.json();
      if (result.success) {
        setAssessmentData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch assessment');
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch assessment'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/student/assessments/${assessmentId}/items`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      const result = await response.json();
      if (result.success) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch assessment items');
    }
  };

  const fetchCLOCoverage = async () => {
    try {
      const response = await fetch(`/api/student/assessments/${assessmentId}/clo-coverage`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch CLO coverage');
      const result = await response.json();
      if (result.success) {
        setCloCoverage(result.data.cloCoverage);
      }
    } catch (error) {
      console.error('Error fetching CLO coverage:', error);
      toast.error('Failed to fetch CLO coverage');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'evaluated':
        return <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5">Completed</Badge>;
      case 'submitted':
        return <Badge className="bg-[var(--blue)] text-white text-[10px] px-1.5 py-0.5 dark:bg-[var(--orange)]">Submitted</Badge>;
      case 'not_submitted':
      case 'pending':
        return <Badge className="bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5">Pending</Badge>;
      default:
        return <Badge className="text-[10px] px-1.5 py-0.5">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge className="border border-card-border text-[10px] px-1.5 py-0.5 text-primary-text">
        {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
      </Badge>
    );
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
          <p className="text-xs text-secondary-text">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Assessment not found</p>
          <Button
            variant="outline"
            onClick={() => router.push('/student/assessments')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  const { assessment, result } = assessmentData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/student/assessments')}
            className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-hover-bg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-primary-text">{assessment.title}</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              {assessment.course.code} - {assessment.semester.name}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="information">
            <FileText className="w-4 h-4 mr-2" />
            Information
          </TabsTrigger>
          <TabsTrigger value="items">
            <List className="w-4 h-4 mr-2" />
            Items
          </TabsTrigger>
          <TabsTrigger value="result">
            <Award className="w-4 h-4 mr-2" />
            My Result
          </TabsTrigger>
          <TabsTrigger value="clo-coverage">
            <Target className="w-4 h-4 mr-2" />
            CLO Coverage
          </TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="information" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{assessment.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <div className="mt-1">{getTypeBadge(assessment.type)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Marks</p>
                  <p className="font-medium">{assessment.totalMarks}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weightage</p>
                  <p className="font-medium">{assessment.weightage}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {assessment.dueDate
                      ? format(new Date(assessment.dueDate), 'PPP')
                      : 'No due date'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="font-medium">
                    {assessment.course.code} - {assessment.course.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-medium">{assessment.semester.name}</p>
                </div>
                {result && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">{getStatusBadge(result.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted At</p>
                      <p className="font-medium">
                        {result.submittedAt
                          ? format(new Date(result.submittedAt), 'PPP p')
                          : 'Not submitted'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Items</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No items available
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>CLO</TableHead>
                      <TableHead>Your Marks</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          Q{item.questionNo}
                        </TableCell>
                        <TableCell className="max-w-md">{item.description}</TableCell>
                        <TableCell>{item.marks}</TableCell>
                        <TableCell>
                          {item.clo ? (
                            <Badge variant="outline">{item.clo.code}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {item.obtainedMarks !== null ? (
                            <span className="font-medium">
                              {item.obtainedMarks} / {item.marks}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not evaluated</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {item.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result" className="mt-6">
          {result ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Obtained Marks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {result.obtainedMarks.toFixed(1)} / {result.totalMarks.toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Percentage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {result.percentage.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Grade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {result.grade || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">{getStatusBadge(result.status)}</div>
                  </CardContent>
                </Card>
              </div>

              {result.remarks && (
                <Card>
                  <CardHeader>
                    <CardTitle>Remarks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{result.remarks}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Item-wise Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Obtained</TableHead>
                        <TableHead>CLO</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.itemResults.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            Q{item.questionNo}
                          </TableCell>
                          <TableCell className="max-w-md">{item.description}</TableCell>
                          <TableCell>{item.totalMarks}</TableCell>
                          <TableCell className="font-medium">
                            {item.obtainedMarks.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            {item.clo ? (
                              <Badge variant="outline">{item.clo.code}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {item.remarks || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No result available yet. Assessment may not be evaluated.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CLO Coverage Tab */}
        <TabsContent value="clo-coverage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CLO Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              {cloCoverage.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No CLO coverage data available
                </p>
              ) : (
                <div className="space-y-6">
                  {cloCoverage.map((coverage) => (
                    <Card key={coverage.clo.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg">
                              {coverage.clo.code}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {coverage.clo.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {coverage.percentage.toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {coverage.obtainedMarks.toFixed(1)} / {coverage.totalMarks.toFixed(1)} marks
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Question</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Marks</TableHead>
                              <TableHead>Obtained</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {coverage.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  Q{item.questionNo}
                                </TableCell>
                                <TableCell className="max-w-md">
                                  {item.description}
                                </TableCell>
                                <TableCell>{item.marks}</TableCell>
                                <TableCell className="font-medium">
                                  {item.obtainedMarks.toFixed(1)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

