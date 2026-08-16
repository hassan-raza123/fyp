'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Loader2 } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/ui/page-header';
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

interface ReportSection {
  heading: string;
  note?: string;
  columns: string[];
  rows: (string | number | null)[][];
}

interface ReportPayload {
  reportType: obe_report_type;
  generatedAt: string;
  summary: Record<string, string | number | null>;
  sections: ReportSection[];
  warnings: string[];
}

interface OBEReport {
  id: number;
  reportType: obe_report_type;
  title: string;
  description: string | null;
  status: report_status;
  generatedAt: string;
  filePath: string | null;
  data: ReportPayload | null;
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
    return <PageLoading message="Loading report..." />;
  }

  const handleExportCsv = () => {
    if (!report?.data) return;
    const lines: string[] = [report.title];
    for (const [key, value] of Object.entries(report.data.summary)) {
      lines.push(`${key},${value ?? ''}`);
    }
    for (const section of report.data.sections) {
      lines.push('', section.heading, section.columns.join(','));
      for (const row of section.rows) {
        lines.push(
          row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
        );
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${report.title.replace(/\s+/g, '_')}.csv`;
    link.click();
    toast.success('Report exported as CSV');
  };

  const handleExportPdf = async () => {
    if (!report?.data) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(report.title, 14, 16);
    doc.setFontSize(10);
    doc.text(
      [
        report.program ? `Program: ${report.program.code} - ${report.program.name}` : '',
        report.semester ? `Semester: ${report.semester.name}` : '',
        `Generated: ${format(new Date(report.generatedAt), 'PPP')}`,
      ]
        .filter(Boolean)
        .join('   |   '),
      14,
      23
    );

    let cursorY = 30;
    const summaryEntries = Object.entries(report.data.summary);
    if (summaryEntries.length > 0) {
      autoTable(doc, {
        startY: cursorY,
        head: [['Summary', 'Value']],
        body: summaryEntries.map(([k, v]) => [k, String(v ?? '')]),
        styles: { fontSize: 8 },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 8;
    }

    for (const section of report.data.sections) {
      if (section.rows.length === 0) continue;
      autoTable(doc, {
        startY: cursorY,
        head: [section.columns],
        body: section.rows.map((r) => r.map((c) => String(c ?? ''))),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [124, 58, 237] },
        didDrawPage: () => undefined,
      });
      cursorY = (doc as any).lastAutoTable.finalY + 8;
    }

    doc.save(`${report.title.replace(/\s+/g, '_')}.pdf`);
    toast.success('Report exported as PDF');
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="text-center">
          <p className="text-sm text-secondary-text mb-3">Report not found</p>
          <Button onClick={() => router.push('/admin/reports')} className="text-xs h-8">
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={report.title}
        subtitle="OBE Report Details"
        action={
          <div className="flex gap-2">
            {report.data && report.data.sections.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </>
            )}
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-4">
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

      {/* The report itself. Without this the page showed only metadata and the
          "generated" report had no content anywhere. */}
      {report.data && (
        <div className="space-y-6 mt-6">
          {report.data.warnings.length > 0 && (
            <Card className="border-warn dark:border-warn">
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  {report.data.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {Object.keys(report.data.summary).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(report.data.summary).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground">{key}</p>
                      <p className="text-lg font-semibold">{value ?? 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {report.data.sections.map((section) => (
            <Card key={section.heading}>
              <CardHeader>
                <CardTitle>{section.heading}</CardTitle>
                {section.note && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {section.note}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {section.rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No data available for this section.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          {section.columns.map((col) => (
                            <th
                              key={col}
                              className="text-left py-2 px-3 font-medium whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row, i) => (
                          <tr key={i} className="border-b last:border-0">
                            {row.map((cell, j) => (
                              <td key={j} className="py-2 px-3 align-top">
                                {cell ?? '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

