'use client';

import { useEffect, useState } from 'react';
import { AssessmentItemForm } from '@/components/assessments/AssessmentItemForm';
import { notFound, useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssessmentItemsPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [clos, setClos] = useState<any[]>([]);
  const [plos, setPlos] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentRes, closRes, plosRes] = await Promise.all([
          fetch(`/api/assessments/${params.id}`),
          fetch('/api/clos'),
          fetch('/api/plos'),
        ]);

        if (!assessmentRes.ok || !closRes.ok || !plosRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [assessmentData, closData, plosData] = await Promise.all([
          assessmentRes.json(),
          closRes.json(),
          plosRes.json(),
        ]);

        setAssessment(assessmentData);
        setItems(assessmentData.assessmentItems || []);
        setClos(Array.isArray(closData.data) ? closData.data : []);
        setPlos(Array.isArray(plosData.data) ? plosData.data : []);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

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
        throw new Error(
          editingItem
            ? 'Failed to update assessment item'
            : 'Failed to create assessment item'
        );
      }

      toast.success(
        editingItem
          ? 'Assessment item updated successfully'
          : 'Assessment item created successfully'
      );
      setShowForm(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      toast.error(
        editingItem
          ? 'Failed to update assessment item'
          : 'Failed to create assessment item'
      );
      console.error('Error saving assessment item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleBulkImport = async () => {
    if (!bulkFile) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      const text = await bulkFile.text();
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim());

      const itemsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        if (values.length < 3) continue;

        itemsToImport.push({
          questionNo: values[0],
          description: values[1],
          marks: parseFloat(values[2]),
          cloId: values[3] ? parseInt(values[3]) : null,
        });
      }

      // Import items one by one
      for (const item of itemsToImport) {
        await fetch(`/api/assessments/${params.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(item),
        });
      }

      toast.success(`Successfully imported ${itemsToImport.length} items`);
      setShowBulkImport(false);
      setBulkFile(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to import items');
      console.error('Error importing items:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
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
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>Assessment Items</h1>
            <p className='text-muted-foreground'>
              {assessment?.title || 'Loading...'}
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              const template = [
                ['questionNo', 'description', 'marks', 'cloId'],
                ['Q1', 'Question 1 description', '10', '1'],
                ['Q2', 'Question 2 description', '15', '2'],
              ]
                .map((row) => row.join(','))
                .join('\n');
              const blob = new Blob([template], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'assessment-items-template.csv';
              a.click();
              toast.success('Template downloaded');
            }}
          >
            <FileSpreadsheet className='w-4 h-4 mr-2' />
            Download Template
          </Button>
          <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
            <DialogTrigger asChild>
              <Button variant='outline'>
                <Upload className='w-4 h-4 mr-2' />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Import Items</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with assessment items
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label>CSV File</Label>
                  <Input
                    type='file'
                    accept='.csv'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setBulkFile(file);
                    }}
                    className='mt-2'
                  />
                  <p className='text-xs text-muted-foreground mt-2'>
                    Format: questionNo, description, marks, cloId
                  </p>
                </div>
              </div>
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setShowBulkImport(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleBulkImport} disabled={!bulkFile}>
                  Import
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='w-4 h-4 mr-2' />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Item' : 'Add Assessment Item'}
                </DialogTitle>
              </DialogHeader>
              <AssessmentItemForm
                assessmentId={assessmentId}
                clos={clos}
                plos={plos}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                initialData={editingItem}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question No</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>CLO</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center'>
                    No items added yet
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.questionNo}</TableCell>
                    <TableCell className='max-w-md truncate'>
                      {item.description}
                    </TableCell>
                    <TableCell>{item.marks}</TableCell>
                    <TableCell>
                      {item.clo ? (
                        <Badge variant='outline'>{item.clo.code}</Badge>
                      ) : (
                        <span className='text-muted-foreground'>No CLO</span>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => {
                            setEditingItem(item);
                            setShowForm(true);
                          }}
                        >
                          <Edit2 className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
