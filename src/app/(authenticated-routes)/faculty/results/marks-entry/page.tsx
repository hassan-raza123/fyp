'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Upload,
  Save,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Eye,
  Lock,
  FileText,
} from 'lucide-react';
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
}

interface Assessment {
  id: number;
  title: string;
  type: string;
  totalMarks: number;
  items: Array<{
    id: number;
    questionNo: string;
    description: string;
    marks: number;
    cloId: number | null;
  }>;
}

interface Student {
  studentId: number;
  rollNumber: string;
  name: string;
  marks: Record<number, number>;
  existingResultId?: number;
  status?: string;
  totalMarks?: number;
  percentage?: number;
}

interface MarksData {
  assessment: Assessment;
  students: Student[];
}

const MarksEntryPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [sections, setSections] = useState<Section[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(
    null
  );
  const [marksData, setMarksData] = useState<MarksData | null>(null);
  const [marks, setMarks] = useState<Record<number, Record<number, number>>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [previousAssessmentData, setPreviousAssessmentData] =
    useState<any>(null);
  const [outliers, setOutliers] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/sections', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch sections');
        const result = await response.json();
        // Sections API returns { success, data, pagination }
        setSections(Array.isArray(result) ? result : result.data || []);
      } catch (error) {
        toast.error('Failed to load sections');
        console.error(error);
      }
    };
    fetchSections();
  }, []);

  // Fetch assessments when section is selected
  useEffect(() => {
    if (!selectedSection) {
      setAssessments([]);
      return;
    }

    const fetchAssessments = async () => {
      try {
        const response = await fetch('/api/assessments', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch assessments');
        const data = await response.json();
          // Filter assessments for the selected section's course offering
          const section = sections.find((s) => s.id === selectedSection);
          if (section && section.courseOffering) {
            // Filter assessments for this course offering
            const courseOfferingId = (section.courseOffering as any).id;
            const filtered = Array.isArray(data)
              ? data.filter(
                  (a: any) =>
                    a.courseOffering?.id === courseOfferingId ||
                    a.courseOfferingId === courseOfferingId
                )
              : [];
            setAssessments(filtered);
          } else {
            setAssessments([]);
          }
      } catch (error) {
        toast.error('Failed to load assessments');
        console.error(error);
      }
    };
    fetchAssessments();
  }, [selectedSection, sections]);

  // Fetch marks when assessment and section are selected
  useEffect(() => {
    if (!selectedSection || !selectedAssessment) {
      setMarksData(null);
      setMarks({});
      setPreviousAssessmentData(null);
      setIsLocked(false);
      return;
    }

    const fetchMarks = async () => {
      setLoading(true);
      try {
        const [marksResponse, previousResponse] = await Promise.all([
          fetch(
            `/api/assessments/${selectedAssessment}/section/${selectedSection}/marks`,
            { credentials: 'include' }
          ),
          fetch(
            `/api/assessments/${selectedAssessment}/section/${selectedSection}/previous`,
            { credentials: 'include' }
          ).catch(() => null), // Previous assessments are optional
        ]);

        if (!marksResponse.ok) throw new Error('Failed to fetch marks');
        const result = await marksResponse.json();
        if (result.success) {
          setMarksData(result.data);
          // Initialize marks from existing data
          const initialMarks: Record<number, Record<number, number>> = {};
          result.data.students.forEach((student: Student) => {
            initialMarks[student.studentId] = { ...student.marks };
            // Check if marks are locked (published status)
            if (student.status === 'published') {
              setIsLocked(true);
            }
          });
          setMarks(initialMarks);

          // Fetch previous assessment data if available
          if (previousResponse && previousResponse.ok) {
            const prevResult = await previousResponse.json();
            if (prevResult.success) {
              setPreviousAssessmentData(prevResult.data);
            }
          }
        }
      } catch (error) {
        toast.error('Failed to load marks data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [selectedSection, selectedAssessment]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!selectedSection || !selectedAssessment || !marksData) return;

    const hasChanges = Object.keys(marks).some((studentId) => {
      const student = marksData.students.find(
        (s) => s.studentId === parseInt(studentId)
      );
      if (!student) return false;
      return Object.keys(marks[parseInt(studentId)]).some(
        (itemId) =>
          marks[parseInt(studentId)][parseInt(itemId)] !==
          student.marks[parseInt(itemId)]
      );
    });

    if (!hasChanges) return;

    try {
      await saveMarks(true); // Save as draft
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [selectedSection, selectedAssessment, marks, marksData]);

  // Setup auto-save timer
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 30000); // Auto-save after 30 seconds of inactivity

    setAutoSaveTimer(timer);

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [marks, handleAutoSave]);

  const handleMarkChange = (
    studentId: number,
    itemId: number,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    const assessmentItem = marksData?.assessment.items.find(
      (item) => item.id === itemId
    );

    if (assessmentItem && numValue > assessmentItem.marks) {
      toast.error(
        `Marks cannot exceed ${assessmentItem.marks} for ${assessmentItem.questionNo}`
      );
      return;
    }

    if (numValue < 0) {
      toast.error('Marks cannot be negative');
      return;
    }

    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [itemId]: numValue,
      },
    }));
  };

  const validateMarks = (): { errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!marksData) return { errors, warnings };

    marksData.students.forEach((student) => {
      const studentMarks = marks[student.studentId] || {};
      marksData.assessment.items.forEach((item) => {
        const mark = studentMarks[item.id] || 0;
        if (mark > item.marks) {
          errors.push(
            `${student.rollNumber}: Marks for ${item.questionNo} (${mark}) exceed maximum (${item.marks})`
          );
        }
        if (mark < 0) {
          errors.push(
            `${student.rollNumber}: Marks for ${item.questionNo} cannot be negative`
          );
        }
      });

      // Check if all items have marks
      const totalItems = marksData.assessment.items.length;
      const filledItems = Object.keys(studentMarks).filter(
        (itemId) => (studentMarks[parseInt(itemId)] || 0) > 0
      ).length;
      if (filledItems === 0 && totalItems > 0) {
        warnings.push(`${student.rollNumber}: No marks entered`);
      }

      // Check for duplicate entries (if marks already exist and are being re-entered)
      if (student.existingResultId && student.status === 'published') {
        warnings.push(
          `${student.rollNumber}: Marks already published. Changes will update existing results.`
        );
      }
    });

    return { errors, warnings };
  };

  const detectOutliers = () => {
    if (!marksData || !statistics) return [];

    const mean = statistics.averageMarks;
    const stdDev = calculateStandardDeviation(statistics.studentResults);
    const threshold = 2 * stdDev; // 2 standard deviations

    return statistics.studentResults.filter((result) => {
      const deviation = Math.abs(result.obtainedMarks - mean);
      return deviation > threshold;
    });
  };

  const calculateStandardDeviation = (results: any[]): number => {
    if (results.length === 0) return 0;
    const mean =
      results.reduce((sum, r) => sum + r.obtainedMarks, 0) / results.length;
    const variance =
      results.reduce((sum, r) => sum + Math.pow(r.obtainedMarks - mean, 2), 0) /
      results.length;
    return Math.sqrt(variance);
  };

  const calculateStatistics = () => {
    if (!marksData) return null;

    const studentResults = marksData.students.map((student) => {
      const studentMarks = marks[student.studentId] || {};
      const totalMarks = marksData.assessment.items.reduce(
        (sum, item) => sum + item.marks,
        0
      );
      const obtainedMarks = marksData.assessment.items.reduce(
        (sum, item) => sum + (studentMarks[item.id] || 0),
        0
      );
      const percentage =
        totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

      return {
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        name: student.name,
        obtainedMarks,
        totalMarks,
        percentage,
      };
    });

    const averageMarks =
      studentResults.length > 0
        ? studentResults.reduce((sum, r) => sum + r.obtainedMarks, 0) /
          studentResults.length
        : 0;
    const averagePercentage =
      studentResults.length > 0
        ? studentResults.reduce((sum, r) => sum + r.percentage, 0) /
          studentResults.length
        : 0;
    const highestMarks =
      studentResults.length > 0
        ? Math.max(...studentResults.map((r) => r.obtainedMarks))
        : 0;
    const lowestMarks =
      studentResults.length > 0
        ? Math.min(...studentResults.map((r) => r.obtainedMarks))
        : 0;

    return {
      studentResults,
      averageMarks,
      averagePercentage,
      highestMarks,
      lowestMarks,
      totalStudents: studentResults.length,
    };
  };

  const saveMarks = async (isDraft = false) => {
    if (!selectedSection || !selectedAssessment || !marksData) return;

    if (isLocked && !isDraft) {
      toast.error('Marks are locked and cannot be modified');
      return;
    }

    const validation = validateMarks();
    setValidationErrors(validation.errors);
    setWarnings(validation.warnings);

    if (validation.errors.length > 0 && !isDraft) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setSaving(true);
    try {
      const marksArray = marksData.students.map((student) => ({
        studentId: student.studentId,
        items: marksData.assessment.items.map((item) => ({
          itemId: item.id,
          marks: marks[student.studentId]?.[item.id] || 0,
        })),
      }));

      const response = await fetch(
        `/api/assessments/${selectedAssessment}/section/${selectedSection}/marks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            marks: marksArray,
            status: isDraft ? 'pending' : 'evaluated',
            isDraft,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save marks');
      }

      const result = await response.json();
      toast.success(result.message || 'Marks saved successfully');
      setLastSaved(new Date());
      setValidationErrors([]);

      // Refresh marks data
      const refreshResponse = await fetch(
        `/api/assessments/${selectedAssessment}/section/${selectedSection}/marks`,
        { credentials: 'include' }
      );
      if (refreshResponse.ok) {
        const refreshResult = await refreshResponse.json();
        if (refreshResult.success) {
          setMarksData(refreshResult.data);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save marks'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !marksData) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      const text = await bulkFile.text();
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim());

      // Parse CSV: rollNumber, itemId1, marks1, itemId2, marks2, ...
      const bulkMarks: Record<number, Record<number, number>> = {};

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const rollNumber = values[0];
        const student = marksData.students.find(
          (s) => s.rollNumber === rollNumber
        );

        if (!student) continue;

        bulkMarks[student.studentId] = {};
        for (let j = 1; j < values.length; j += 2) {
          if (values[j] && values[j + 1]) {
            const itemId = parseInt(values[j]);
            const mark = parseFloat(values[j + 1]);
            if (!isNaN(itemId) && !isNaN(mark)) {
              bulkMarks[student.studentId][itemId] = mark;
            }
          }
        }
      }

      setMarks((prev) => ({ ...prev, ...bulkMarks }));
      toast.success('Bulk marks loaded successfully');
      setShowBulkUpload(false);
      setBulkFile(null);
    } catch (error) {
      toast.error('Failed to process bulk upload');
      console.error('Error processing bulk upload:', error);
    }
  };

  const exportTemplate = () => {
    if (!marksData) return;

    const headers = [
      'rollNumber',
      ...marksData.assessment.items.map(
        (item) => `${item.id},${item.questionNo}`
      ),
    ];
    const rows = marksData.students.map((student) => [
      student.rollNumber,
      ...marksData.assessment.items.map(
        (item) => `${item.id},${marks[student.studentId]?.[item.id] || 0}`
      ),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n'
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-template-${selectedAssessment}-${selectedSection}.csv`;
    a.click();
    toast.success('Template downloaded');
  };

  const statistics = calculateStatistics();

  // Update outliers when marks data changes (not statistics — it's a new object every render)
  useEffect(() => {
    if (Object.keys(marks).length > 0) {
      const detected = detectOutliers();
      setOutliers(detected);
    }
  }, [marks, marksData]); // eslint-disable-line react-hooks/exhaustive-deps

  const detectedOutliers = outliers;

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - same as Results Management / admin CLO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <FileText className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Marks Entry</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Enter and manage student assessment marks
            </p>
          </div>
        </div>
        {lastSaved && (
          <div className="text-xs text-secondary-text">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Selection Section */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Select Assessment & Section</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-secondary-text">Section</Label>
              <Select
                value={selectedSection?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedSection(value ? parseInt(value) : null);
                  setSelectedAssessment(null);
                }}
              >
                <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id.toString()} className="text-primary-text hover:bg-card/50">
                      {section.courseOffering.course.code} - {section.name} (
                      {section.courseOffering.semester.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-secondary-text">Assessment</Label>
              <Select
                value={selectedAssessment?.toString() || ''}
                onValueChange={(value) =>
                  setSelectedAssessment(value ? parseInt(value) : null)
                }
                disabled={!selectedSection}
              >
                <SelectTrigger className="h-8 text-xs mt-1 bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select an assessment" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {assessments.map((assessment) => (
                    <SelectItem
                      key={assessment.id}
                      value={assessment.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {assessment.title} ({assessment.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-[var(--error)]/40 bg-[var(--error-opacity-05)] p-4">
          <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-[var(--error)]" />
            Validation Errors
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-primary-text">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-[var(--error)]">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-[var(--warning)]/50 p-4" style={{ backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.08)' : 'rgba(252, 153, 40, 0.08)' }}>
          <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" style={{ color: primaryColor }} />
            Warnings
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-primary-text">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Locked Status */}
      {isLocked && (
        <div className="rounded-lg border border-card-border bg-card p-4" style={{ borderLeftWidth: '4px', borderLeftColor: primaryColor }}>
          <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4" style={{ color: primaryColor }} />
            Marks Locked
          </h3>
          <p className="text-xs text-secondary-text">
            These marks have been published and are locked. You can still save as draft, but final submission will update existing published marks.
          </p>
        </div>
      )}

      {/* Marks Entry Table */}
      {loading ? (
        <div className="text-center py-8 text-xs text-secondary-text">Loading marks data...</div>
      ) : marksData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-primary-text">
                {marksData.assessment.title}
              </h2>
              <p className="text-xs text-secondary-text mt-0.5">
                Total Marks: {marksData.assessment.totalMarks} | Students: {marksData.students.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportTemplate}
                disabled={!marksData}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Template
              </button>
              <button
                type="button"
                onClick={() => setShowBulkUpload(true)}
                disabled={!marksData}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Bulk Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  const validation = validateMarks();
                  setValidationErrors(validation.errors);
                  setWarnings(validation.warnings);
                  setShowReview(true);
                }}
                disabled={!marksData}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Review
              </button>
              <button
                type="button"
                onClick={() => saveMarks(true)}
                disabled={saving || !marksData || isLocked}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => saveMarks(false)}
                disabled={saving || !marksData || isLocked}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Submit Marks'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 text-xs font-semibold text-primary-text">
                      Roll No
                    </TableHead>
                    <TableHead className="sticky left-12 bg-card z-10 text-xs font-semibold text-primary-text">
                      Name
                    </TableHead>
                      {marksData.assessment.items.map((item) => (
                        <TableHead key={item.id} className="min-w-[120px] text-xs font-semibold text-primary-text">
                          <div className="text-center">
                            <div className="font-semibold">{item.questionNo}</div>
                            <div className="text-xs text-secondary-text">Max: {item.marks}</div>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center text-xs font-semibold text-primary-text">Total</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">%</TableHead>
                      <TableHead className="text-center text-xs font-semibold text-primary-text">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marksData.students.map((student) => {
                      const studentMarks = marks[student.studentId] || {};
                      const totalMarks = marksData.assessment.items.reduce(
                        (sum, item) => sum + item.marks,
                        0
                      );
                      const obtainedMarks = marksData.assessment.items.reduce(
                        (sum, item) => sum + (studentMarks[item.id] || 0),
                        0
                      );
                      const percentage =
                        totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

                      return (
                        <TableRow key={student.studentId} className="hover:bg-[var(--hover-bg)]">
                          <TableCell className="sticky left-0 bg-card font-medium text-xs text-primary-text">
                            {student.rollNumber}
                          </TableCell>
                          <TableCell className="sticky left-12 bg-card text-xs text-primary-text">
                            {student.name}
                          </TableCell>
                          {marksData.assessment.items.map((item) => (
                            <TableCell key={item.id} className="text-xs text-primary-text">
                              <Input
                                type="number"
                                min={0}
                                max={item.marks}
                                step={0.5}
                                value={studentMarks[item.id] || ''}
                                onChange={(e) =>
                                  handleMarkChange(
                                    student.studentId,
                                    item.id,
                                    e.target.value
                                  )
                                }
                                className="w-20 text-center h-8 text-xs bg-card border-card-border text-primary-text"
                                disabled={isLocked && student.status === 'published'}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-medium text-xs text-primary-text">
                            {obtainedMarks.toFixed(1)} / {totalMarks}
                          </TableCell>
                          <TableCell className="text-center text-xs text-primary-text">
                            {percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-center text-xs text-primary-text">
                            <Badge
                              variant={
                                student.status === 'published'
                                  ? 'default'
                                  : student.status === 'evaluated'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {student.status || 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-card-border bg-card py-12 text-center text-xs text-secondary-text">
          Select a section and assessment to enter marks
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Marks Review & Statistics</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Review marks, statistics, and outliers before final submission
            </DialogDescription>
          </DialogHeader>
          {statistics && (
            <Tabs defaultValue="statistics" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-card border border-card-border p-1 rounded-lg">
                <TabsTrigger value="statistics" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text">Statistics</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text">Preview</TabsTrigger>
                <TabsTrigger value="outliers" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text">Outliers</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text">Comparison</TabsTrigger>
              </TabsList>

              <TabsContent value="statistics" className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-card-border bg-card p-4">
                    <p className="text-xs font-medium text-secondary-text mb-1">Total Students</p>
                    <div className="text-lg font-bold text-primary-text">{statistics.totalStudents}</div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card p-4">
                    <p className="text-xs font-medium text-secondary-text mb-1">Average Marks</p>
                    <div className="text-lg font-bold text-primary-text">
                      {statistics.averageMarks.toFixed(1)} / {marksData?.assessment.totalMarks}
                    </div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card p-4">
                    <p className="text-xs font-medium text-secondary-text mb-1">Average %</p>
                    <div className="text-lg font-bold text-primary-text">{statistics.averagePercentage.toFixed(1)}%</div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card p-4">
                    <p className="text-xs font-medium text-secondary-text mb-1">Range</p>
                    <div className="text-lg font-bold text-primary-text">
                      {statistics.lowestMarks.toFixed(1)} - {statistics.highestMarks.toFixed(1)}
                    </div>
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <div className="rounded-lg border border-[var(--error)]/40 bg-[var(--error-opacity-05)] p-4">
                    <h3 className="text-sm font-semibold text-primary-text mb-2">Validation Errors ({validationErrors.length})</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[var(--error)]">
                      {validationErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li>...and {validationErrors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="rounded-lg border border-card-border bg-card p-4" style={{ borderLeftWidth: '4px', borderLeftColor: primaryColor }}>
                    <h3 className="text-sm font-semibold text-primary-text mb-2">Warnings ({warnings.length})</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-secondary-text">
                      {warnings.slice(0, 5).map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                      {warnings.length > 5 && (
                        <li>...and {warnings.length - 5} more warnings</li>
                      )}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary-text mb-2">Student Results Preview</h3>
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-card-border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-semibold text-primary-text">Roll No</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Percentage</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statistics.studentResults.map((result) => {
                          const student = marksData?.students.find(
                            (s) => s.studentId === result.studentId
                          );
                          return (
                            <TableRow key={result.studentId} className="hover:bg-[var(--hover-bg)]">
                              <TableCell className="text-xs text-primary-text">{result.rollNumber}</TableCell>
                              <TableCell className="text-xs text-primary-text">{result.name}</TableCell>
                              <TableCell className="text-xs text-primary-text">
                                {result.obtainedMarks.toFixed(1)} / {result.totalMarks}
                              </TableCell>
                              <TableCell className="text-xs text-primary-text">{result.percentage.toFixed(1)}%</TableCell>
                              <TableCell className="text-xs text-primary-text">
                                <Badge
                                  variant={
                                    student?.status === 'published'
                                      ? 'default'
                                      : student?.status === 'evaluated'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className="text-[10px]"
                                >
                                  {student?.status || 'Pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="outliers" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary-text mb-2">
                    Outlier Detection ({detectedOutliers.length})
                  </h3>
                  <p className="text-xs text-secondary-text mb-4">
                    Students with marks significantly different from the average (2+ standard deviations)
                  </p>
                  {detectedOutliers.length === 0 ? (
                    <p className="text-xs text-secondary-text text-center py-8">No outliers detected</p>
                  ) : (
                    <div className="rounded-lg border border-card-border bg-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-semibold text-primary-text">Roll No</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Percentage</TableHead>
                          <TableHead className="text-xs font-semibold text-primary-text">Deviation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detectedOutliers.map((outlier) => {
                          const deviation =
                            outlier.obtainedMarks - statistics.averageMarks;
                          return (
                            <TableRow key={outlier.studentId} className="hover:bg-[var(--hover-bg)]">
                              <TableCell className="text-xs text-primary-text">{outlier.rollNumber}</TableCell>
                              <TableCell className="text-xs text-primary-text">{outlier.name}</TableCell>
                              <TableCell className="text-xs text-primary-text">
                                {outlier.obtainedMarks.toFixed(1)} / {outlier.totalMarks}
                              </TableCell>
                              <TableCell className="text-xs text-primary-text">{outlier.percentage.toFixed(1)}%</TableCell>
                              <TableCell className="text-xs text-primary-text">
                                <Badge variant={deviation > 0 ? 'default' : 'destructive'} className="text-[10px]">
                                  {deviation > 0 ? '+' : ''}{deviation.toFixed(1)} from average
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary-text mb-2">Comparison with Previous Assessments</h3>
                  {previousAssessmentData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-card-border bg-card p-4">
                          <p className="text-xs font-medium text-secondary-text mb-1">Previous Average</p>
                          <div className="text-lg font-bold text-primary-text">{previousAssessmentData.averageMarks?.toFixed(1) || 'N/A'}</div>
                        </div>
                        <div className="rounded-lg border border-card-border bg-card p-4">
                          <p className="text-xs font-medium text-secondary-text mb-1">Current Average</p>
                          <div className="text-lg font-bold text-primary-text">{statistics.averageMarks.toFixed(1)}</div>
                        </div>
                        <div className="rounded-lg border border-card-border bg-card p-4">
                          <p className="text-xs font-medium text-secondary-text mb-1">Difference</p>
                          <div className="text-lg font-bold text-primary-text">
                            {previousAssessmentData.averageMarks
                              ? (statistics.averageMarks - previousAssessmentData.averageMarks).toFixed(1)
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-secondary-text">{previousAssessmentData.assessmentTitle || 'Previous assessment data'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-secondary-text text-center py-8">No previous assessment data available for comparison</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowReview(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => { setShowReview(false); saveMarks(true); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => { setShowReview(false); saveMarks(false); }}
              disabled={validationErrors.length > 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              Submit Marks
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">Bulk Upload Marks</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Upload a CSV file with marks. Download template for format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-secondary-text">CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setBulkFile(file);
                }}
                className="mt-2 h-8 text-xs bg-card border-card-border text-primary-text"
              />
              <p className="text-xs text-secondary-text mt-2">
                Format: rollNumber, itemId1, marks1, itemId2, marks2, ...
              </p>
            </div>
          </div>
          <DialogFooter className="border-t border-card-border pt-4 gap-2">
            <button
              type="button"
              onClick={() => setShowBulkUpload(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkUpload}
              disabled={!bulkFile}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              Upload
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarksEntryPage;
