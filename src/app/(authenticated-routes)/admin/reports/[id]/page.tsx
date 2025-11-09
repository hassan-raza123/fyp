'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { obe_report_type, report_status } from '@prisma/client';

interface OBEReport {
  id: number;
  reportType: obe_report_type;
  title: string;
  description: string | null;
  status: report_status;
  generatedAt: string;
  filePath: string | null;
  program: {
    id: number;
    name: string;
    code: string;
  } | null;
  semester: {
    id: number;
    name: string;
  } | null;
  generator: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function ReportViewPage() {
  const router = useRouter();
  const params = useParams();
  const [report, setReport] = useState<OBEReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/obe-reports/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      const data = await response.json();
      if (data.success) {
        setReport(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
      router.push('/admin/reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/obe-reports/${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete report');
      }

      toast.success('Report deleted successfully');
      router.push('/admin/reports');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete report'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: report_status) => {
    switch (status) {
      case 'generated':
        return <Badge variant="default">Generated</Badge>;
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getReportTypeLabel = (type: obe_report_type) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground">Report not found</p>
          <Button onClick={() => router.push('/admin/reports')} className="mt-4">
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/reports')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{report.title}</h1>
            <p className="text-muted-foreground">OBE Report Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {report.filePath && (
            <Button
              variant="outline"
              onClick={() => window.open(report.filePath || '', '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Title</p>
              <p className="text-lg font-medium">{report.title}</p>
            </div>
            {report.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-lg">{report.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Report Type</p>
                <p className="text-lg font-medium">
                  {getReportTypeLabel(report.reportType)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(report.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Context Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.program && (
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="text-lg font-medium">
                  {report.program.code} - {report.program.name}
                </p>
              </div>
            )}
            {report.semester && (
              <div>
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="text-lg font-medium">{report.semester.name}</p>
              </div>
            )}
            {!report.program && !report.semester && (
              <p className="text-muted-foreground">No specific context</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Generated By</p>
              <p className="text-lg font-medium">
                {report.generator.first_name} {report.generator.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {report.generator.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Generated At</p>
              <p className="text-lg">
                {format(new Date(report.generatedAt), 'PPP p')}
              </p>
            </div>
            {report.filePath && (
              <div>
                <p className="text-sm text-muted-foreground">File Path</p>
                <p className="text-lg font-mono text-sm break-all">
                  {report.filePath}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{report.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

