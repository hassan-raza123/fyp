'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function AssessmentItemsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params?.id;
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentTitle, setAssessmentTitle] = useState('');

  useEffect(() => {
    if (!assessmentId) return;
    fetchData();
  }, [assessmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, assessmentRes] = await Promise.all([
        fetch(`/api/student/assessments/${assessmentId}/items`, {
          credentials: 'include',
        }),
        fetch(`/api/assessments/${assessmentId}`, {
          credentials: 'include',
        }),
      ]);

      if (!itemsRes.ok) throw new Error('Failed to fetch items');
      const itemsResult = await itemsRes.json();
      if (itemsResult.success) {
        setItems(itemsResult.data);
      }

      if (assessmentRes.ok) {
        const assessmentData = await assessmentRes.json();
        setAssessmentTitle(assessmentData.title || 'Assessment Items');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assessment items');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-hover-bg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-primary-text">{assessmentTitle}</h1>
          <p className="text-xs text-secondary-text mt-0.5">Assessment Items</p>
        </div>
      </div>
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
    </div>
  );
}
