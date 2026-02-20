'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        return <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5" variant="secondary">Generated</Badge>;
      case 'published':
        return <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5" variant="secondary">Published</Badge>;
      case 'archived':
        return <Badge className="bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5" variant="secondary">Archived</Badge>;
      default:
        return <Badge className="text-[10px] px-1.5 py-0.5" variant="secondary">{status}</Badge>;
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
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">OBE Reports</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Generate and manage OBE reports
          </p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text"
            />
          </div>
        </div>
        <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Types</SelectItem>
            <SelectItem value="clo_attainment" className="text-primary-text hover:bg-card/50">CLO Attainment</SelectItem>
            <SelectItem value="plo_attainment" className="text-primary-text hover:bg-card/50">PLO Attainment</SelectItem>
            <SelectItem value="program_assessment" className="text-primary-text hover:bg-card/50">Program Assessment</SelectItem>
            <SelectItem value="semester_summary" className="text-primary-text hover:bg-card/50">Semester Summary</SelectItem>
            <SelectItem value="course_wise" className="text-primary-text hover:bg-card/50">Course Wise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="generated" className="text-primary-text hover:bg-card/50">Generated</SelectItem>
            <SelectItem value="published" className="text-primary-text hover:bg-card/50">Published</SelectItem>
            <SelectItem value="archived" className="text-primary-text hover:bg-card/50">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Title</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Type</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Program</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Generated By</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Generated At</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-xs text-secondary-text">Loading...</p>
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-xs text-secondary-text">No reports found</p>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-hover-bg transition-colors">
                  <TableCell className="text-xs font-medium text-primary-text">{report.title}</TableCell>
                  <TableCell className="text-xs text-secondary-text">{getReportTypeLabel(report.reportType)}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {report.program
                      ? `${report.program.code} - ${report.program.name}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">{report.semester?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {report.generator.first_name} {report.generator.last_name}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {format(new Date(report.generatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {report.filePath && (
                        <button
                          onClick={() => window.open(report.filePath || '', '_blank')}
                          className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                          style={{ backgroundColor: iconBgColor, color: primaryColor }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = iconBgColor; }}
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/reports/${report.id}`)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{ backgroundColor: iconBgColor, color: primaryColor }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = iconBgColor; }}
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(report)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{ backgroundColor: 'var(--error-opacity-10)', color: 'var(--error)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-20)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-opacity-10)'; }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              <Label htmlFor="reportType" className="text-xs text-primary-text">Report Type *</Label>
              <Select
                value={formData.reportType}
                onValueChange={(value: obe_report_type) =>
                  setFormData({ ...formData, reportType: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="clo_attainment" className="text-primary-text hover:bg-card/50">CLO Attainment Report</SelectItem>
                  <SelectItem value="plo_attainment" className="text-primary-text hover:bg-card/50">PLO Attainment Report</SelectItem>
                  <SelectItem value="program_assessment" className="text-primary-text hover:bg-card/50">
                    Program Assessment Report
                  </SelectItem>
                  <SelectItem value="semester_summary" className="text-primary-text hover:bg-card/50">Semester Summary Report</SelectItem>
                  <SelectItem value="course_wise" className="text-primary-text hover:bg-card/50">Course Wise Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="programId" className="text-xs text-primary-text">Program</Label>
                <Select
                  value={formData.programId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, programId: value })
                  }
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select program (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="" className="text-primary-text hover:bg-card/50">None</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()} className="text-primary-text hover:bg-card/50">
                        {program.code} - {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semesterId" className="text-xs text-primary-text">Semester</Label>
                <Select
                  value={formData.semesterId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semesterId: value })
                  }
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select semester (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="" className="text-primary-text hover:bg-card/50">None</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()} className="text-primary-text hover:bg-card/50">
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-xs text-primary-text">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter report title"
                required
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-xs text-primary-text">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter report description (optional)"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
              style={{ backgroundColor: iconBgColor, color: primaryColor }}
              onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = iconBgColor; }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </button>
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
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

