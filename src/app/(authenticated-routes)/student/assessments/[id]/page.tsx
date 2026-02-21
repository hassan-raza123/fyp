'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
      <div className="flex items-center justify-center min-h-[60vh] bg-page">
        <div className="text-center space-y-4">
          <p className="text-sm text-secondary-text">Assessment not found</p>
          <button
            onClick={() => router.push('/student/assessments')}
            className="px-3 py-1.5 rounded-lg border border-card-border bg-transparent text-xs font-medium h-8 flex items-center gap-2 mx-auto"
            style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </button>
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
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: iconBgColor, color: primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = iconBgColor;
            }}
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
            <Card className="bg-card border border-card-border">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-primary-text">Assessment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted-text">Title</p>
                  <p className="text-sm font-medium text-primary-text">{assessment.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text">Type</p>
                  <div className="mt-1">{getTypeBadge(assessment.type)}</div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text">Total Marks</p>
                  <p className="text-sm font-medium text-primary-text">{assessment.totalMarks}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text">Weightage</p>
                  <p className="text-sm font-medium text-primary-text">{assessment.weightage}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text">Due Date</p>
                  <p className="text-sm font-medium text-primary-text">
                    {assessment.dueDate
                      ? format(new Date(assessment.dueDate), 'PPP')
                      : 'No due date'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-card-border">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-primary-text">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted-text">Course</p>
                  <p className="text-sm font-medium text-primary-text">
                    {assessment.course.code} - {assessment.course.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text">Semester</p>
                  <p className="text-sm font-medium text-primary-text">{assessment.semester.name}</p>
                </div>
                {result && (
                  <>
                    <div>
                      <p className="text-[10px] text-muted-text">Status</p>
                      <div className="mt-1">{getStatusBadge(result.status)}</div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text">Submitted At</p>
                      <p className="text-sm font-medium text-primary-text">
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
          <Card className="bg-card border border-card-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-primary-text">Assessment Items</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-xs text-secondary-text text-center py-4">
                  No items available
                </p>
              ) : (
                <div className="rounded-lg border border-card-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-primary-text">Question</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">CLO</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Your Marks</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className="hover:bg-hover-bg transition-colors">
                          <TableCell className="text-xs font-medium text-primary-text">
                            Q{item.questionNo}
                          </TableCell>
                          <TableCell className="max-w-md text-xs text-secondary-text">{item.description}</TableCell>
                          <TableCell className="text-xs text-primary-text">{item.marks}</TableCell>
                          <TableCell>
                            {item.clo ? (
                              <Badge variant="outline" className="border border-card-border text-[10px] px-1.5 py-0.5 text-primary-text">{item.clo.code}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-primary-text">
                            {item.obtainedMarks !== null ? (
                              <span className="font-medium">
                                {item.obtainedMarks} / {item.marks}
                              </span>
                            ) : (
                              <span className="text-secondary-text">Not evaluated</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs text-xs text-secondary-text">
                            {item.remarks || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result" className="mt-6">
          {result ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-card border border-card-border">
                  <CardHeader>
                    <CardTitle className="text-[10px] text-muted-text">
                      Obtained Marks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-primary-text">
                      {result.obtainedMarks.toFixed(1)} / {result.totalMarks.toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border border-card-border">
                  <CardHeader>
                    <CardTitle className="text-[10px] text-muted-text">
                      Percentage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-primary-text">
                      {result.percentage.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border border-card-border">
                  <CardHeader>
                    <CardTitle className="text-[10px] text-muted-text">
                      Grade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-primary-text">
                      {result.grade || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border border-card-border">
                  <CardHeader>
                    <CardTitle className="text-[10px] text-muted-text">
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">{getStatusBadge(result.status)}</div>
                  </CardContent>
                </Card>
              </div>

              {result.remarks && (
                <Card className="bg-card border border-card-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-primary-text">Remarks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-primary-text">{result.remarks}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card border border-card-border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-primary-text">Item-wise Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-card-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-semibold text-primary-text">Question</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Obtained</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">CLO</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.itemResults.map((item) => (
                          <TableRow key={item.id} className="hover:bg-hover-bg transition-colors">
                            <TableCell className="text-xs font-medium text-primary-text">
                              Q{item.questionNo}
                            </TableCell>
                            <TableCell className="max-w-md text-xs text-secondary-text">{item.description}</TableCell>
                            <TableCell className="text-xs text-primary-text">{item.totalMarks}</TableCell>
                            <TableCell className="text-xs font-medium text-primary-text">
                              {item.obtainedMarks.toFixed(1)}
                            </TableCell>
                            <TableCell>
                              {item.clo ? (
                                <Badge variant="outline" className="border border-card-border text-[10px] px-1.5 py-0.5 text-primary-text">{item.clo.code}</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs text-xs text-secondary-text">
                              {item.remarks || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-card border border-card-border">
              <CardContent className="text-center py-8">
                <p className="text-xs text-secondary-text">
                  No result available yet. Assessment may not be evaluated.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CLO Coverage Tab */}
        <TabsContent value="clo-coverage" className="mt-6">
          <Card className="bg-card border border-card-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-primary-text">CLO Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              {cloCoverage.length === 0 ? (
                <p className="text-xs text-secondary-text text-center py-4">
                  No CLO coverage data available
                </p>
              ) : (
                <div className="space-y-6">
                  {cloCoverage.map((coverage) => (
                    <Card key={coverage.clo.id} className="bg-card border border-card-border">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-sm font-bold text-primary-text">
                              {coverage.clo.code}
                            </CardTitle>
                            <p className="text-xs text-secondary-text mt-1">
                              {coverage.clo.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-text">
                              {coverage.percentage.toFixed(1)}%
                            </p>
                            <p className="text-xs text-secondary-text">
                              {coverage.obtainedMarks.toFixed(1)} / {coverage.totalMarks.toFixed(1)} marks
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border border-card-border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs font-semibold text-primary-text">Question</TableHead>
                                <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                                <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                                <TableHead className="text-xs font-semibold text-primary-text">Obtained</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {coverage.items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-hover-bg transition-colors">
                                  <TableCell className="text-xs font-medium text-primary-text">
                                    Q{item.questionNo}
                                  </TableCell>
                                  <TableCell className="max-w-md text-xs text-secondary-text">
                                    {item.description}
                                  </TableCell>
                                  <TableCell className="text-xs text-primary-text">{item.marks}</TableCell>
                                  <TableCell className="text-xs font-medium text-primary-text">
                                    {item.obtainedMarks.toFixed(1)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
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

