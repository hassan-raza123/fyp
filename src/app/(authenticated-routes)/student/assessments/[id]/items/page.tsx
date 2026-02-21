'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const assessmentId = params?.id;
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentTitle, setAssessmentTitle] = useState('');

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
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
          <p className="text-xs text-secondary-text">Loading items...</p>
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
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-primary-text">Assessment Items</h2>
        </div>
        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-xs text-secondary-text text-center py-4">No items available</p>
          ) : (
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
                    <TableCell className="text-xs font-medium text-primary-text">Q{item.questionNo}</TableCell>
                    <TableCell className="text-xs text-secondary-text max-w-md">{item.description}</TableCell>
                    <TableCell className="text-xs text-primary-text">{item.marks}</TableCell>
                    <TableCell>
                      {item.clo ? (
                        <Badge className="border border-card-border text-[10px] px-1.5 py-0.5 text-primary-text">{item.clo.code}</Badge>
                      ) : (
                        <span className="text-xs text-muted-text">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-primary-text">
                      {item.obtainedMarks !== null ? (
                        <span className="font-medium">{item.obtainedMarks} / {item.marks}</span>
                      ) : (
                        <span className="text-muted-text">Not evaluated</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-secondary-text max-w-xs">{item.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
