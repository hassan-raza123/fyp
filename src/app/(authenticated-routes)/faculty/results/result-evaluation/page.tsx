'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  ListChecks,
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

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
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <ListChecks className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Result Evaluation</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Evaluate and manage student assessment results
            </p>
          </div>
        </div>
        {selectedAssessment && evaluationData && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowBulkDialog(true)}
              disabled={selectedResults.size === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Bulk Evaluate ({selectedResults.size})
            </button>
            <button
              type="button"
              onClick={() => setSelectedAssessment(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
            >
              Back to List
            </button>
          </div>
        )}
      </div>

      {!selectedAssessment ? (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="bg-card border border-card-border p-1 rounded-lg">
            <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">Evaluation Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Filters */}
            <div className="rounded-lg border border-card-border bg-card overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">Filters</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-secondary-text">Status Filter</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Assessments</SelectItem>
                        <SelectItem value="pending" className="text-primary-text hover:bg-card/50">Pending Evaluation</SelectItem>
                        <SelectItem value="evaluated" className="text-primary-text hover:bg-card/50">Evaluated</SelectItem>
                        <SelectItem value="published" className="text-primary-text hover:bg-card/50">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-secondary-text">Search</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-text" />
                      <Input
                        placeholder="Search by title, course code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessments List */}
            {loading ? (
              <div className="rounded-lg border border-card-border bg-card py-12 text-center">
                <p className="text-xs text-secondary-text">Loading assessments...</p>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="rounded-lg border border-card-border bg-card py-12 text-center">
                <p className="text-xs text-secondary-text">No assessments found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="rounded-lg border border-card-border bg-card p-4 transition-colors hover:bg-[var(--hover-bg)]"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-primary-text">{assessment.title}</h3>
                        <p className="text-xs text-secondary-text mt-0.5">
                          {assessment.course.code} - {assessment.course.name} ({assessment.semester.name})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assessment.status)}
                        <button
                          type="button"
                          onClick={() => setSelectedAssessment(assessment.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
                          style={{ backgroundColor: iconBgColor, color: primaryColor }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Evaluate
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 mt-4 text-xs">
                      <div>
                        <p className="text-secondary-text">Total Students</p>
                        <p className="font-semibold text-primary-text">{assessment.statistics.totalStudents}</p>
                      </div>
                      <div>
                        <p className="text-secondary-text">Pending</p>
                        <p className="font-semibold text-primary-text">{assessment.statistics.pendingCount}</p>
                      </div>
                      <div>
                        <p className="text-secondary-text">Evaluated</p>
                        <p className="font-semibold text-primary-text">{assessment.statistics.evaluatedCount}</p>
                      </div>
                      <div>
                        <p className="text-secondary-text">Published</p>
                        <p className="font-semibold text-primary-text">{assessment.statistics.publishedCount}</p>
                      </div>
                      <div>
                        <p className="text-secondary-text">Completion Rate</p>
                        <p className="font-semibold text-primary-text">{assessment.statistics.completionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    {assessment.dueDate && (
                      <p className="text-xs text-secondary-text mt-2">
                        Due: {format(new Date(assessment.dueDate), 'PPP')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        evaluationData && (
          <div className="space-y-4">
            <div className="rounded-lg border border-card-border bg-card p-4">
              <h2 className="text-sm font-semibold text-primary-text">{evaluationData.assessment.title}</h2>
              <p className="text-xs text-secondary-text mt-0.5">
                {evaluationData.assessment.type} • Total Marks: {evaluationData.assessment.totalMarks}
              </p>
            </div>

            {/* Results Table */}
            <div className="rounded-lg border border-card-border bg-card overflow-hidden">
              <div className="p-4 border-b border-card-border flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-primary-text">Student Results</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
                  >
                    {selectedResults.size === evaluationData.results.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkDialog(true)}
                    disabled={selectedResults.size === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
                  >
                    Bulk Evaluate ({selectedResults.size})
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-xs font-semibold text-primary-text">
                        <CheckSquare className="w-4 h-4" />
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Roll No</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Section</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Percentage</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Submitted</TableHead>
                        <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluationData.results.map((result) => (
                        <TableRow key={result.studentId} className="hover:bg-[var(--hover-bg)]">
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
                          <TableCell className="font-medium text-xs text-primary-text">{result.rollNumber}</TableCell>
                          <TableCell className="text-xs text-primary-text">{result.name}</TableCell>
                          <TableCell className="text-xs text-primary-text">{result.sectionName}</TableCell>
                          <TableCell className="text-xs text-primary-text">{result.obtainedMarks} / {result.totalMarks}</TableCell>
                          <TableCell className="text-xs text-primary-text">{result.percentage.toFixed(1)}%</TableCell>
                          <TableCell className="text-xs text-primary-text">{getStatusBadge(result.status)}</TableCell>
                          <TableCell className="text-xs text-secondary-text">
                            {result.submittedAt ? format(new Date(result.submittedAt), 'PPp') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs text-primary-text">
                            {result.resultId ? (
                              <button
                                type="button"
                                onClick={() => openEvaluationDialog(result)}
                                className="px-2 py-1 rounded-lg text-xs font-medium h-7 inline-flex items-center gap-1.5"
                                style={{ backgroundColor: iconBgColor, color: primaryColor }}
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Evaluate
                              </button>
                            ) : (
                              <span className="text-secondary-text text-xs">No submission</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
          </div>
        )
      )}

      {/* Evaluation Dialog */}
      <Dialog
        open={showEvaluationDialog}
        onOpenChange={setShowEvaluationDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Evaluate Student Result</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              {selectedResult && (
                <>
                  {selectedResult.name} ({selectedResult.rollNumber}) - {evaluationData?.assessment.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && evaluationData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs font-medium text-secondary-text mb-1">Total Marks</p>
                  <div className="text-lg font-bold text-primary-text">
                    {Object.values(itemMarks).reduce((sum, m) => sum + m, 0)} / {evaluationData.assessment.totalMarks}
                  </div>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs font-medium text-secondary-text mb-1">Percentage</p>
                  <div className="text-lg font-bold text-primary-text">
                    {evaluationData.assessment.totalMarks > 0
                      ? ((Object.values(itemMarks).reduce((sum, m) => sum + m, 0) / evaluationData.assessment.totalMarks) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs font-medium text-secondary-text mb-1">Current Status</p>
                  <div className="text-primary-text">{getStatusBadge(selectedResult.status)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-primary-text mb-2">Item-wise Marks</h3>
                <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-primary-text">Q No.</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Max Marks</TableHead>
                      <TableHead className="text-xs font-semibold text-primary-text">Obtained Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedResult.itemResults.map((item) => (
                      <TableRow key={item.assessmentItemId} className="hover:bg-[var(--hover-bg)]">
                        <TableCell className="text-xs text-primary-text">{item.assessmentItem.questionNo}</TableCell>
                        <TableCell className="max-w-md text-xs text-primary-text">{item.assessmentItem.description}</TableCell>
                        <TableCell className="text-xs text-primary-text">{item.assessmentItem.marks}</TableCell>
                        <TableCell className="text-xs text-primary-text">
                          <Input
                            type="number"
                            min={0}
                            max={item.assessmentItem.marks}
                            step={0.5}
                            value={itemMarks[item.assessmentItemId] || 0}
                            onChange={(e) =>
                              setItemMarks({
                                ...itemMarks,
                                [item.assessmentItemId]: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24 h-8 text-xs bg-card border-card-border text-primary-text"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>

              <div>
                <Label htmlFor="remarks" className="text-xs text-secondary-text">Remarks/Comments</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add evaluation remarks..."
                  rows={3}
                  className="mt-1 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
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

          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowEvaluationDialog(false)}
              disabled={evaluating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEvaluate}
              disabled={evaluating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              {evaluating ? 'Evaluating...' : 'Mark as Evaluated'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Evaluation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Bulk Evaluation</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Evaluate {selectedResults.size} selected result(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-secondary-text">Action</Label>
              <Select value={bulkAction} onValueChange={(v: any) => setBulkAction(v)}>
                <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="evaluate" className="text-primary-text hover:bg-card/50">Mark as Evaluated</SelectItem>
                  <SelectItem value="approve" className="text-primary-text hover:bg-card/50">Approve</SelectItem>
                  <SelectItem value="publish" className="text-primary-text hover:bg-card/50">Publish</SelectItem>
                  <SelectItem value="reject" className="text-primary-text hover:bg-card/50">Reject (Back to Pending)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-remarks" className="text-xs text-secondary-text">Remarks (applied to all selected)</Label>
              <Textarea
                id="bulk-remarks"
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                placeholder="Add remarks for all selected results..."
                rows={3}
                className="mt-1 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowBulkDialog(false)}
              disabled={evaluating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkEvaluate}
              disabled={evaluating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              {evaluating ? 'Processing...' : `Apply to ${selectedResults.size} Result(s)`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultEvaluationPage;
