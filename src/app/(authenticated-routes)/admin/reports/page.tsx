'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
  };
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
}

export default function ReportsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const [reports, setReports] = useState<OBEReport[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<OBEReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    reportType: '' as obe_report_type | '',
    programId: '',
    semesterId: '',
    title: '',
    description: '',
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchReports();
    fetchPrograms();
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [reportTypeFilter, statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (reportTypeFilter !== 'all') {
        params.append('reportType', reportTypeFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/obe-reports?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      if (data.success) {
        let reportsData = data.data;
        
        // Filter by search
        if (search) {
          const searchLower = search.toLowerCase();
          reportsData = reportsData.filter(
            (r: OBEReport) =>
              r.title.toLowerCase().includes(searchLower) ||
              r.description?.toLowerCase().includes(searchLower) ||
              r.program?.name.toLowerCase().includes(searchLower) ||
              r.semester?.name.toLowerCase().includes(searchLower)
          );
        }
        
        setReports(reportsData);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters');
      if (!response.ok) throw new Error('Failed to fetch semesters');
      const data = await response.json();
      if (data.success) {
        setSemesters(data.data);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.reportType || !formData.title) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await fetch('/api/obe-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: formData.reportType,
          programId: formData.programId ? parseInt(formData.programId) : undefined,
          semesterId: formData.semesterId ? parseInt(formData.semesterId) : undefined,
          title: formData.title,
          description: formData.description || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      toast.success('Report generated successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        reportType: '',
        programId: '',
        semesterId: '',
        title: '',
        description: '',
      });
      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate report'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteClick = (report: OBEReport) => {
    setSelectedReport(report);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch(`/api/obe-reports/${selectedReport.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete report');
      }

      toast.success('Report deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete report'
      );
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

  if (!mounted) {
    return null;
  }

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-primary-text">
            <FileText className="h-8 w-8" style={{ color: primaryColor }} />
            OBE Reports
          </h1>
          <p className="text-secondary-text">
            Generate and manage OBE reports
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-text" />
              <Input
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="clo_attainment">CLO Attainment</SelectItem>
              <SelectItem value="plo_attainment">PLO Attainment</SelectItem>
              <SelectItem value="program_assessment">Program Assessment</SelectItem>
              <SelectItem value="semester_summary">Semester Summary</SelectItem>
              <SelectItem value="course_wise">Course Wise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated By</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{getReportTypeLabel(report.reportType)}</TableCell>
                  <TableCell>
                    {report.program
                      ? `${report.program.code} - ${report.program.name}`
                      : '-'}
                  </TableCell>
                  <TableCell>{report.semester?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    {report.generator.first_name} {report.generator.last_name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.generatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {report.filePath && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(report.filePath || '', '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/reports/${report.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(report)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate OBE Report</DialogTitle>
            <DialogDescription>
              Create a new OBE report with specified parameters
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reportType">Report Type *</Label>
              <Select
                value={formData.reportType}
                onValueChange={(value: obe_report_type) =>
                  setFormData({ ...formData, reportType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clo_attainment">CLO Attainment Report</SelectItem>
                  <SelectItem value="plo_attainment">PLO Attainment Report</SelectItem>
                  <SelectItem value="program_assessment">
                    Program Assessment Report
                  </SelectItem>
                  <SelectItem value="semester_summary">Semester Summary Report</SelectItem>
                  <SelectItem value="course_wise">Course Wise Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="programId">Program</Label>
                <Select
                  value={formData.programId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, programId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.code} - {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semesterId">Semester</Label>
                <Select
                  value={formData.semesterId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semesterId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter report title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter report description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Report Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedReport?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

