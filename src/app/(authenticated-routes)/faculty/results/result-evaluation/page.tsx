'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  Clock,
  Eye,
  FileCheck,
  Filter,
  Search,
  Send,
  XCircle,
  Edit,
  CheckSquare,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

interface Assessment {
  id: number;
  title: string;
  type: string;
  totalMarks: number;
  dueDate: string;
  status: string;
  course: {
    code: string;
    name: string;
  };
  semester: {
    name: string;
  };
  sections: Array<{
    id: number;
    name: string;
  }>;
  statistics: {
    totalStudents: number;
    pendingCount: number;
    evaluatedCount: number;
    publishedCount: number;
    completionRate: number;
  };
}

interface StudentResult {
  resultId?: number;
  studentId: number;
  rollNumber: string;
  name: string;
  email: string;
  sectionId: number;
  sectionName: string;
  status: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  remarks: string;
  submittedAt?: string;
  evaluatedAt?: string;
  itemResults: Array<{
    assessmentItemId: number;
    obtainedMarks: number;
    totalMarks: number;
    assessmentItem: {
      id: number;
      questionNo: string;
      description: string;
      marks: number;
    };
  }>;
}

const ResultEvaluationPage = () => {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>(
    []
  );
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(
    null
  );
  const [evaluationData, setEvaluationData] = useState<{
    assessment: any;
    results: StudentResult[];
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Evaluation dialog state
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(
    null
  );
  const [itemMarks, setItemMarks] = useState<Record<number, number>>({});
  const [remarks, setRemarks] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Bulk evaluation state
  const [selectedResults, setSelectedResults] = useState<Set<number>>(
    new Set()
  );
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [bulkAction, setBulkAction] = useState<
    'approve' | 'reject' | 'evaluate' | 'publish'
  >('evaluate');

  useEffect(() => {
    fetchAssessments();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedAssessment) {
      fetchEvaluationData(selectedAssessment);
    } else {
      setEvaluationData(null);
    }
  }, [selectedAssessment]);

  useEffect(() => {
    // Filter assessments based on search and status
    let filtered = assessments;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => {
        if (statusFilter === 'pending') {
          return a.statistics.pendingCount > 0;
        } else if (statusFilter === 'evaluated') {
          return a.statistics.evaluatedCount > 0;
        } else if (statusFilter === 'published') {
          return a.statistics.publishedCount > 0;
        }
        return true;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAssessments(filtered);
  }, [assessments, statusFilter, searchQuery]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter !== 'all'
          ? `/api/faculty/evaluations?status=${statusFilter}`
          : '/api/faculty/evaluations';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch assessments');
      const result = await response.json();
      if (result.success) {
        setAssessments(result.data);
      }
    } catch (error) {
      toast.error('Failed to load assessments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluationData = async (assessmentId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/assessments/${assessmentId}/evaluations`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch evaluation data');
      const result = await response.json();
      if (result.success) {
        setEvaluationData(result.data);
        // Initialize item marks for all results
        const initialMarks: Record<number, Record<number, number>> = {};
        result.data.results.forEach((r: StudentResult) => {
          if (r.itemResults) {
            initialMarks[r.studentId] = {};
            r.itemResults.forEach((item) => {
              initialMarks[r.studentId][item.assessmentItemId] =
                item.obtainedMarks;
            });
          }
        });
        // Store in a way that's accessible when evaluating
        setItemMarks({});
      }
    } catch (error) {
      toast.error('Failed to load evaluation data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openEvaluationDialog = (result: StudentResult) => {
    setSelectedResult(result);
    // Initialize item marks from result
    const marks: Record<number, number> = {};
    result.itemResults.forEach((item) => {
      marks[item.assessmentItemId] = item.obtainedMarks;
    });
    setItemMarks(marks);
    setRemarks(result.remarks || '');
    setAdjustmentReason('');
    setShowEvaluationDialog(true);
  };

  const handleEvaluate = async () => {
    if (!selectedResult) return;

    setEvaluating(true);
    try {
      const itemMarksArray = Object.entries(itemMarks).map(
        ([itemId, marks]) => ({
          itemId: parseInt(itemId),
          marks: marks,
        })
      );

      const response = await fetch(
        `/api/assessment-results/${selectedResult.resultId}/evaluate`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            itemMarks: itemMarksArray,
            remarks,
            status: 'evaluated',
            adjustmentReason: adjustmentReason || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to evaluate');
      }

      toast.success('Result evaluated successfully');
      setShowEvaluationDialog(false);
      if (selectedAssessment) {
        fetchEvaluationData(selectedAssessment);
      }
      fetchAssessments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to evaluate result'
      );
      console.error(error);
    } finally {
      setEvaluating(false);
    }
  };

  const handleBulkEvaluate = async () => {
    if (selectedResults.size === 0) {
      toast.error('Please select at least one result');
      return;
    }

    setEvaluating(true);
    try {
      const response = await fetch('/api/assessment-results/bulk-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resultIds: Array.from(selectedResults),
          remarks: bulkRemarks || undefined,
          action: bulkAction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform bulk evaluation');
      }

      toast.success(
        `Successfully ${bulkAction}d ${selectedResults.size} result(s)`
      );
      setShowBulkDialog(false);
      setSelectedResults(new Set());
      setBulkRemarks('');
      if (selectedAssessment) {
        fetchEvaluationData(selectedAssessment);
      }
      fetchAssessments();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to perform bulk evaluation'
      );
      console.error(error);
    } finally {
      setEvaluating(false);
    }
  };

  const toggleResultSelection = (resultId: number) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const toggleSelectAll = () => {
    if (!evaluationData) return;
    if (selectedResults.size === evaluationData.results.length) {
      setSelectedResults(new Set());
    } else {
      const allResultIds = evaluationData.results
        .filter((r) => r.resultId)
        .map((r) => r.resultId!);
      setSelectedResults(new Set(allResultIds));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'outline' | 'destructive'
    > = {
      published: 'default',
      evaluated: 'secondary',
      pending: 'outline',
      draft: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Result Evaluation</h1>
          <p className="text-muted-foreground">
            Evaluate and manage student assessment results
          </p>
        </div>
        {selectedAssessment && evaluationData && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(true)}
              disabled={selectedResults.size === 0}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Bulk Evaluate ({selectedResults.size})
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedAssessment(null)}
            >
              Back to List
            </Button>
          </div>
        )}
      </div>

      {!selectedAssessment ? (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Evaluation Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status Filter</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assessments</SelectItem>
                        <SelectItem value="pending">
                          Pending Evaluation
                        </SelectItem>
                        <SelectItem value="evaluated">Evaluated</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by title, course code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessments List */}
            {loading ? (
              <div className="text-center py-8">Loading assessments...</div>
            ) : filteredAssessments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No assessments found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAssessments.map((assessment) => (
                  <Card
                    key={assessment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{assessment.title}</CardTitle>
                          <CardDescription>
                            {assessment.course.code} - {assessment.course.name}{' '}
                            ({assessment.semester.name})
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(assessment.status)}
                          <Button
                            onClick={() => setSelectedAssessment(assessment.id)}
                            variant="outline"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Evaluate
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Total Students
                          </p>
                          <p className="font-semibold">
                            {assessment.statistics.totalStudents}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending</p>
                          <p className="font-semibold text-yellow-600">
                            {assessment.statistics.pendingCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Evaluated</p>
                          <p className="font-semibold text-blue-600">
                            {assessment.statistics.evaluatedCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Published</p>
                          <p className="font-semibold text-green-600">
                            {assessment.statistics.publishedCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Completion Rate
                          </p>
                          <p className="font-semibold">
                            {assessment.statistics.completionRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      {assessment.dueDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Due: {format(new Date(assessment.dueDate), 'PPP')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        evaluationData && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{evaluationData.assessment.title}</CardTitle>
                <CardDescription>
                  {evaluationData.assessment.type} • Total Marks:{' '}
                  {evaluationData.assessment.totalMarks}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Results Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Student Results</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {selectedResults.size === evaluationData.results.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkDialog(true)}
                      disabled={selectedResults.size === 0}
                    >
                      Bulk Evaluate ({selectedResults.size})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <CheckSquare className="w-4 h-4" />
                        </TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluationData.results.map((result) => (
                        <TableRow key={result.studentId}>
                          <TableCell>
                            {result.resultId && (
                              <input
                                type="checkbox"
                                checked={selectedResults.has(result.resultId)}
                                onChange={() =>
                                  toggleResultSelection(result.resultId!)
                                }
                                className="w-4 h-4"
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {result.rollNumber}
                          </TableCell>
                          <TableCell>{result.name}</TableCell>
                          <TableCell>{result.sectionName}</TableCell>
                          <TableCell>
                            {result.obtainedMarks} / {result.totalMarks}
                          </TableCell>
                          <TableCell>{result.percentage.toFixed(1)}%</TableCell>
                          <TableCell>{getStatusBadge(result.status)}</TableCell>
                          <TableCell>
                            {result.submittedAt
                              ? format(new Date(result.submittedAt), 'PPp')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {result.resultId ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEvaluationDialog(result)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Evaluate
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No submission
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Evaluation Dialog */}
      <Dialog
        open={showEvaluationDialog}
        onOpenChange={setShowEvaluationDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluate Student Result</DialogTitle>
            <DialogDescription>
              {selectedResult && (
                <>
                  {selectedResult.name} ({selectedResult.rollNumber}) -{' '}
                  {evaluationData?.assessment.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && evaluationData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Marks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.values(itemMarks).reduce((sum, m) => sum + m, 0)}{' '}
                      / {evaluationData.assessment.totalMarks}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Percentage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {evaluationData.assessment.totalMarks > 0
                        ? (
                            (Object.values(itemMarks).reduce(
                              (sum, m) => sum + m,
                              0
                            ) /
                              evaluationData.assessment.totalMarks) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getStatusBadge(selectedResult.status)}
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Item-wise Marks</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Q No.</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Max Marks</TableHead>
                      <TableHead>Obtained Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedResult.itemResults.map((item) => (
                      <TableRow key={item.assessmentItemId}>
                        <TableCell>{item.assessmentItem.questionNo}</TableCell>
                        <TableCell className="max-w-md">
                          {item.assessmentItem.description}
                        </TableCell>
                        <TableCell>{item.assessmentItem.marks}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.assessmentItem.marks}
                            step="0.5"
                            value={itemMarks[item.assessmentItemId] || 0}
                            onChange={(e) =>
                              setItemMarks({
                                ...itemMarks,
                                [item.assessmentItemId]:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <Label htmlFor="remarks">Remarks/Comments</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add evaluation remarks..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="adjustment-reason">
                  Adjustment Reason (if marks were adjusted)
                </Label>
                <Input
                  id="adjustment-reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Reason for mark adjustment (optional)"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEvaluationDialog(false)}
              disabled={evaluating}
            >
              Cancel
            </Button>
            <Button onClick={handleEvaluate} disabled={evaluating}>
              {evaluating ? 'Evaluating...' : 'Mark as Evaluated'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Evaluation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Evaluation</DialogTitle>
            <DialogDescription>
              Evaluate {selectedResults.size} selected result(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select
                value={bulkAction}
                onValueChange={(v: any) => setBulkAction(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evaluate">Mark as Evaluated</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="reject">
                    Reject (Back to Pending)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-remarks">
                Remarks (applied to all selected)
              </Label>
              <Textarea
                id="bulk-remarks"
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                placeholder="Add remarks for all selected results..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              disabled={evaluating}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkEvaluate} disabled={evaluating}>
              {evaluating
                ? 'Processing...'
                : `Apply to ${selectedResults.size} Result(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultEvaluationPage;
