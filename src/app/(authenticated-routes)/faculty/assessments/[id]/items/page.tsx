'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { AssessmentItemForm } from '@/components/assessments/AssessmentItemForm';
import { notFound, useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Upload, Edit2, Trash2, FileSpreadsheet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LAB_ASSESSMENT_TYPES = ['lab_exam', 'lab_report'];

export default function AssessmentItemsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';

  const [assessment, setAssessment] = useState<any>(null);
  const [clos, setClos] = useState<any[]>([]);
  const [llos, setLlos] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLabAssessment = LAB_ASSESSMENT_TYPES.includes(assessment?.type);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assessmentRes = await fetch(`/api/assessments/${params.id}`);
        if (!assessmentRes.ok) throw new Error('Failed to fetch assessment');
        const assessmentData = await assessmentRes.json();
        setAssessment(assessmentData);
        setItems(assessmentData.assessmentItems || []);

        const isLab = LAB_ASSESSMENT_TYPES.includes(assessmentData?.type);

        // For lab assessments fetch LLOs for the course; for theory fetch CLOs
        // courseOffering.course.id is included in the API response
        const courseId = assessmentData?.courseOffering?.course?.id || assessmentData?.courseOffering?.courseId;

        const [outcomeRes, plosRes] = await Promise.all([
          isLab
            ? fetch(`/api/llos${courseId ? `?courseId=${courseId}` : ''}`)
            : fetch(`/api/clos${courseId ? `?courseId=${courseId}` : ''}`),
          fetch('/api/plos'),
        ]);

        const [outcomeData, plosData] = await Promise.all([
          outcomeRes.json(),
          plosRes.json(),
        ]);

        if (isLab) {
          setLlos(Array.isArray(outcomeData.data) ? outcomeData.data : []);
          setClos([]);
        } else {
          setClos(Array.isArray(outcomeData.data) ? outcomeData.data : []);
          setLlos([]);
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const assessmentRes = await fetch(`/api/assessments/${params.id}`, {
        credentials: 'include',
      });
      if (!assessmentRes.ok) throw new Error('Failed to fetch assessment');
      const assessmentData = await assessmentRes.json();
      setAssessment(assessmentData);
      setItems(assessmentData.assessmentItems || []);
    } catch (error) {
      console.error('Error fetching assessment:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const url = editingItem
        ? `/api/assessments/${params.id}/items/${editingItem.id}`
        : `/api/assessments/${params.id}/items`;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || (editingItem ? 'Failed to update assessment item' : 'Failed to create assessment item'));
      }

      toast.success(
        editingItem
          ? 'Assessment item updated successfully'
          : 'Assessment item created successfully'
      );
      setShowForm(false);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || (editingItem ? 'Failed to update assessment item' : 'Failed to create assessment item'));
      console.error('Error saving assessment item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(
        `/api/assessments/${params.id}/items/${itemId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to delete item');
      toast.success('Item deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
      console.error('Error deleting item:', error);
    }
  };

  // CSV template columns differ for lab vs theory assessments
  const csvOutcomeColumn = isLabAssessment ? 'lloId' : 'cloId';

  const handleDownloadTemplate = () => {
    const template = [
      ['questionNo', 'description', 'marks', csvOutcomeColumn],
      ['Q1', 'Question 1 description', '10', '1'],
      ['Q2', 'Question 2 description', '15', '2'],
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-items-template-${isLabAssessment ? 'lab' : 'theory'}.csv`;
    a.click();
    toast.success('Template downloaded');
  };

  const handleBulkImport = async () => {
    if (!bulkFile) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      const text = await bulkFile.text();
      const lines = text.split('\n').filter((line) => line.trim());

      const itemsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        if (values.length < 3) continue;

        const item: any = {
          questionNo: values[0],
          description: values[1],
          marks: parseFloat(values[2]),
        };

        if (isLabAssessment) {
          item.lloId = values[3] ? parseInt(values[3]) : null;
        } else {
          item.cloId = values[3] ? parseInt(values[3]) : null;
        }

        itemsToImport.push(item);
      }

      let successCount = 0;
      for (const item of itemsToImport) {
        const res = await fetch(`/api/assessments/${params.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(item),
        });
        if (res.ok) successCount++;
      }

      toast.success(`Successfully imported ${successCount} of ${itemsToImport.length} items`);
      setShowBulkImport(false);
      setBulkFile(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to import items');
      console.error('Error importing items:', error);
    }
  };

  if (!mounted || isLoading) {
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
    return notFound();
  }

  const assessmentId =
    typeof params.id === 'string'
      ? parseInt(params.id)
      : Array.isArray(params.id)
      ? parseInt(params.id[0])
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Assessment Items</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              {assessment?.title || 'Loading...'}{' '}
              {isLabAssessment && (
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  Lab Assessment — items mapped to LLOs
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium inline-flex items-center gap-2"
            onClick={handleDownloadTemplate}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Template
          </button>
          <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-card-border text-primary-text">
              <DialogHeader>
                <DialogTitle className="text-primary-text">Bulk Import Items</DialogTitle>
                <DialogDescription className="text-secondary-text text-xs">
                  Upload a CSV file with assessment items
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
                    Format: questionNo, description, marks,{' '}
                    <span className="font-medium">{csvOutcomeColumn}</span>
                    {isLabAssessment
                      ? ' (LLO ID — required for lab assessments)'
                      : ' (CLO ID — required for theory assessments)'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-card-border text-primary-text hover:bg-[var(--hover-bg)] text-xs font-medium"
                  onClick={() => setShowBulkImport(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                  onClick={handleBulkImport}
                  disabled={!bulkFile}
                >
                  Import
                </button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white inline-flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-card-border text-primary-text">
              <DialogHeader>
                <DialogTitle className="text-primary-text">
                  {editingItem ? 'Edit Item' : 'Add Assessment Item'}
                </DialogTitle>
              </DialogHeader>
              <AssessmentItemForm
                assessmentId={assessmentId}
                clos={clos}
                llos={llos}
                isLabAssessment={isLabAssessment}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                initialData={editingItem}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">
            Assessment Items ({items.length})
          </h2>
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold text-primary-text">Question No</TableHead>
                <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                <TableHead className="text-xs font-semibold text-primary-text">
                  {isLabAssessment ? 'LLO (Lab Outcome)' : 'CLO (Course Outcome)'}
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-primary-text">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-secondary-text py-8">
                    No items added yet.{' '}
                    {isLabAssessment
                      ? 'Add lab assessment items and map them to LLOs.'
                      : 'Add items and map them to CLOs.'}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[var(--hover-bg)]">
                    <TableCell className="text-xs text-primary-text">{item.questionNo}</TableCell>
                    <TableCell className="max-w-md truncate text-xs text-primary-text">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">{item.marks}</TableCell>
                    <TableCell>
                      {item.llo ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {item.llo.code}
                        </Badge>
                      ) : item.clo ? (
                        <Badge variant="outline">{item.clo.code}</Badge>
                      ) : (
                        <span className="text-xs text-secondary-text">Not mapped</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
                          onClick={() => {
                            setEditingItem(item);
                            setShowForm(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
