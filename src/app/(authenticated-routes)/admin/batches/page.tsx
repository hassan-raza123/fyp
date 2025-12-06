'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Search, Layers, AlertCircle, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { batches_status } from '@prisma/client';
import { format } from 'date-fns';

interface Batch {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: batches_status;
  program: {
    name: string;
    code: string;
    department: {
      name: string;
      code: string;
    };
  };
  _count: {
    students: number;
    sections: number;
  };
}

interface Program {
  id: number;
  name: string;
  code: string;
  department: {
    name: string;
    code: string;
  };
}

export default function BatchesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<any>(null);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [newBatch, setNewBatch] = useState({
    name: '',
    code: '',
    programId: '',
    startDate: '',
    endDate: '',
    maxStudents: '',
    description: '',
    status: 'upcoming' as batches_status,
  });
  const [editBatch, setEditBatch] = useState({
    name: '',
    code: '',
    programId: '',
    startDate: '',
    endDate: '',
    maxStudents: '',
    description: '',
    status: 'upcoming' as batches_status,
  });
  
  useEffect(() => {
    setMounted(true);
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [search, status]);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/batches?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const data = await response.json();
      if (data.success) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch batches');
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBatch = async (batch: Batch) => {
    setSelectedBatch(batch);
    setIsLoadingBatch(true);
    setShowViewModal(true);
    try {
      const response = await fetch(`/api/batches/${batch.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch batch');
      const data = await response.json();
      setViewingBatch(data.data);
    } catch (error) {
      console.error('Error fetching batch:', error);
      toast.error('Failed to load batch details');
      setShowViewModal(false);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const handleEditBatch = async (batch: Batch) => {
    setSelectedBatch(batch);
    setIsLoadingBatch(true);
    setShowEditModal(true);
    try {
      // Ensure programs are loaded first
      if (programs.length === 0) {
        await fetchPrograms();
      }
      
      const response = await fetch(`/api/batches/${batch.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch batch');
      const data = await response.json();
      const b = data.data;
      
      // Get program ID - prefer from API response, fallback to finding by name/code
      let programIdValue = '';
      if (b.program?.id) {
        programIdValue = b.program.id.toString();
      } else {
        // Try to find program by name/code from the batch data
        const matchingProgram = programs.find(
          p => p.name === batch.program.name || p.code === batch.program.code
        );
        if (matchingProgram) {
          programIdValue = matchingProgram.id.toString();
        }
      }
      
      // Set all form fields with proper defaults
      setEditBatch({
        name: b.name || batch.name || '',
        code: b.code || batch.code || '',
        programId: programIdValue,
        startDate: b.startDate ? format(new Date(b.startDate), 'yyyy-MM-dd') : (batch.startDate ? format(new Date(batch.startDate), 'yyyy-MM-dd') : ''),
        endDate: b.endDate ? format(new Date(b.endDate), 'yyyy-MM-dd') : (batch.endDate ? format(new Date(batch.endDate), 'yyyy-MM-dd') : ''),
        maxStudents: b.maxStudents?.toString() || '',
        description: b.description || '',
        status: (b.status || batch.status || 'upcoming') as batches_status,
      });
    } catch (error) {
      console.error('Error fetching batch:', error);
      toast.error('Failed to load batch details');
      setShowEditModal(false);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatch.name.trim() || !newBatch.code.trim() || !newBatch.programId || !newBatch.startDate || !newBatch.endDate || !newBatch.maxStudents) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(newBatch.startDate) >= new Date(newBatch.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newBatch.name,
          code: newBatch.code,
          programId: parseInt(newBatch.programId),
          startDate: newBatch.startDate,
          endDate: newBatch.endDate,
          maxStudents: parseInt(newBatch.maxStudents),
          description: newBatch.description,
          status: newBatch.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create batch');
      }

      toast.success('Batch created successfully');
      setShowCreateModal(false);
      setNewBatch({
        name: '',
        code: '',
        programId: '',
        startDate: '',
        endDate: '',
        maxStudents: '',
        description: '',
        status: 'upcoming',
      });
      fetchBatches();
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create batch');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateBatch = async () => {
    if (!selectedBatch || !editBatch.name.trim() || !editBatch.code.trim() || !editBatch.programId || !editBatch.startDate || !editBatch.endDate || !editBatch.maxStudents) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(editBatch.startDate) >= new Date(editBatch.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/batches/${selectedBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editBatch.name,
          code: editBatch.code,
          programId: parseInt(editBatch.programId),
          startDate: editBatch.startDate,
          endDate: editBatch.endDate,
          maxStudents: parseInt(editBatch.maxStudents),
          description: editBatch.description,
          status: editBatch.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update batch');
      }

      toast.success('Batch updated successfully');
      setShowEditModal(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update batch');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/batches/${selectedBatch.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete batch');
      }

      toast.success('Batch deleted successfully');
      setShowDeleteDialog(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete batch');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant='success'>Active</Badge>;
      case 'completed':
        return <Badge variant='secondary'>Completed</Badge>;
      case 'upcoming':
        return <Badge variant='default'>Upcoming</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: primaryColor,
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          ></div>
          <p className="text-xs text-secondary-text">
            Loading batches...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="text-center">
          <AlertCircle 
            className="w-16 h-16 mx-auto mb-4" 
            style={{ color: 'var(--error)' }}
          />
          <div 
            className="text-sm font-semibold mb-2"
            style={{ color: 'var(--error)' }}
          >
            Error
          </div>
          <div className="text-xs text-secondary-text mb-4">{error}</div>
          <button
            onClick={() => fetchBatches()}
            className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
            style={{
              backgroundColor: primaryColor,
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryColorDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor;
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">
            Batches
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage student batches and their details
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{
            backgroundColor: iconBgColor,
            color: primaryColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Batch
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Status</SelectItem>
            <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
            <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
            <SelectItem value="upcoming" className="text-primary-text hover:bg-card/50">Upcoming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batches Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Name</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Program</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Start Date</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">End Date</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Students</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Sections</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Layers className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No batches found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => (
                <TableRow 
                  key={batch.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs font-medium text-primary-text">{batch.name}</TableCell>
                  <TableCell className="text-xs text-secondary-text">{batch.code}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {batch.program.name} ({batch.program.code})
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {format(new Date(batch.startDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-xs text-primary-text">
                    {format(new Date(batch.endDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(batch.status)}</TableCell>
                  <TableCell className="text-xs text-primary-text">{batch._count.students}</TableCell>
                  <TableCell className="text-xs text-primary-text">{batch._count.sections}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewBatch(batch)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleEditBatch(batch)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBatch(batch);
                          setShowDeleteDialog(true);
                        }}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: 'var(--error-opacity-10)',
                          color: 'var(--error)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--error-opacity-20)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--error-opacity-10)';
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Batch Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create New Batch</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new student batch to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_name" className="text-xs text-primary-text">Batch Name *</Label>
                <Input
                  id="create_name"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  placeholder="Enter batch name"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_code" className="text-xs text-primary-text">Batch Code *</Label>
                <Input
                  id="create_code"
                  value={newBatch.code}
                  onChange={(e) => setNewBatch({ ...newBatch, code: e.target.value })}
                  placeholder="Enter batch code"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_programId" className="text-xs text-primary-text">Program *</Label>
              <Select
                value={newBatch.programId}
                onValueChange={(value) => setNewBatch({ ...newBatch, programId: value })}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()} className="text-primary-text hover:bg-card/50">
                      {program.name} ({program.code}) - {program.department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_startDate" className="text-xs text-primary-text">Start Date *</Label>
                <Input
                  id="create_startDate"
                  type="date"
                  value={newBatch.startDate}
                  onChange={(e) => setNewBatch({ ...newBatch, startDate: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_endDate" className="text-xs text-primary-text">End Date *</Label>
                <Input
                  id="create_endDate"
                  type="date"
                  value={newBatch.endDate}
                  onChange={(e) => setNewBatch({ ...newBatch, endDate: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_maxStudents" className="text-xs text-primary-text">Max Students *</Label>
                <Input
                  id="create_maxStudents"
                  type="number"
                  min="1"
                  value={newBatch.maxStudents}
                  onChange={(e) => setNewBatch({ ...newBatch, maxStudents: e.target.value })}
                  placeholder="Enter maximum students"
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_status" className="text-xs text-primary-text">Status *</Label>
                <Select
                  value={newBatch.status}
                  onValueChange={(value: batches_status) => setNewBatch({ ...newBatch, status: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                    <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
                    <SelectItem value="upcoming" className="text-primary-text hover:bg-card/50">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_description" className="text-xs text-primary-text">Description</Label>
              <Input
                id="create_description"
                value={newBatch.description}
                onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                placeholder="Enter batch description (optional)"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isCreating && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowCreateModal(false);
                setNewBatch({
                  name: '',
                  code: '',
                  programId: '',
                  startDate: '',
                  endDate: '',
                  maxStudents: '',
                  description: '',
                  status: 'upcoming',
                });
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: isCreating ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
              onClick={handleCreateBatch}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Batch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Batch Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Batch Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View complete information about this batch
            </DialogDescription>
          </DialogHeader>
          {isLoadingBatch ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : viewingBatch ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-secondary-text mb-3">Batch Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Batch Name</p>
                    <p className="text-xs text-primary-text">{viewingBatch.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Batch Code</p>
                    <p className="text-xs text-primary-text">{viewingBatch.code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Program</p>
                    <p className="text-xs text-primary-text">
                      {viewingBatch.program ? `${viewingBatch.program.name} (${viewingBatch.program.code})` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Department</p>
                    <p className="text-xs text-primary-text">
                      {viewingBatch.program?.department ? `${viewingBatch.program.department.name} (${viewingBatch.program.department.code})` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Start Date</p>
                    <p className="text-xs text-primary-text">
                      {viewingBatch.startDate ? format(new Date(viewingBatch.startDate), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">End Date</p>
                    <p className="text-xs text-primary-text">
                      {viewingBatch.endDate ? format(new Date(viewingBatch.endDate), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Max Students</p>
                    <p className="text-xs text-primary-text">{viewingBatch.maxStudents || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-text mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingBatch.status)}</div>
                  </div>
                  {viewingBatch.description && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-text mb-1">Description</p>
                      <p className="text-xs text-primary-text">{viewingBatch.description}</p>
                    </div>
                  )}
                </div>
              </div>
              {viewingBatch.stats && (
                <div>
                  <h3 className="text-xs font-semibold text-secondary-text mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Total Students</p>
                      <p className="text-xs text-primary-text">{viewingBatch.stats.students || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text mb-1">Total Sections</p>
                      <p className="text-xs text-primary-text">{viewingBatch.stats.sections || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-secondary-text">
              <p>No data available</p>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowViewModal(false);
                setViewingBatch(null);
              }}
            >
              Close
            </Button>
            {viewingBatch && (
              <Button
                size="sm"
                className="h-8 text-xs text-white"
                style={{
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }}
                onClick={() => {
                  const batch = batches.find(b => b.id === viewingBatch.id);
                  if (batch) {
                    setShowViewModal(false);
                    handleEditBatch(batch);
                  }
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Batch
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Batch Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit Batch</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update batch information
            </DialogDescription>
          </DialogHeader>
          {isLoadingBatch ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor }}
                />
                <p className="text-xs text-secondary-text">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_name" className="text-xs text-primary-text">Batch Name *</Label>
                  <Input
                    id="edit_name"
                    value={editBatch.name}
                    onChange={(e) => setEditBatch({ ...editBatch, name: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_code" className="text-xs text-primary-text">Batch Code *</Label>
                  <Input
                    id="edit_code"
                    value={editBatch.code}
                    onChange={(e) => setEditBatch({ ...editBatch, code: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_programId" className="text-xs text-primary-text">Program *</Label>
                <Select
                  value={editBatch.programId}
                  onValueChange={(value) => setEditBatch({ ...editBatch, programId: value })}
                >
                  <SelectTrigger className="bg-card border-card-border text-primary-text">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-card-border">
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()} className="text-primary-text hover:bg-card/50">
                        {program.name} ({program.code}) - {program.department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_startDate" className="text-xs text-primary-text">Start Date *</Label>
                  <Input
                    id="edit_startDate"
                    type="date"
                    value={editBatch.startDate}
                    onChange={(e) => setEditBatch({ ...editBatch, startDate: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_endDate" className="text-xs text-primary-text">End Date *</Label>
                  <Input
                    id="edit_endDate"
                    type="date"
                    value={editBatch.endDate}
                    onChange={(e) => setEditBatch({ ...editBatch, endDate: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_maxStudents" className="text-xs text-primary-text">Max Students *</Label>
                  <Input
                    id="edit_maxStudents"
                    type="number"
                    min="1"
                    value={editBatch.maxStudents}
                    onChange={(e) => setEditBatch({ ...editBatch, maxStudents: e.target.value })}
                    className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status" className="text-xs text-primary-text">Status *</Label>
                  <Select
                    value={editBatch.status}
                    onValueChange={(value: batches_status) => setEditBatch({ ...editBatch, status: value })}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                      <SelectItem value="completed" className="text-primary-text hover:bg-card/50">Completed</SelectItem>
                      <SelectItem value="upcoming" className="text-primary-text hover:bg-card/50">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description" className="text-xs text-primary-text">Description</Label>
                <Input
                  id="edit_description"
                  value={editBatch.description}
                  onChange={(e) => setEditBatch({ ...editBatch, description: e.target.value })}
                  className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isUpdating ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#ffffff' : '#111827'),
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!isUpdating && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowEditModal(false);
                setSelectedBatch(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: isUpdating ? (isDarkMode ? '#9a3412' : '#1e40af') : primaryColor,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
              onClick={handleUpdateBatch}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Batch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Batch Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete Batch</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete{' '}
              {selectedBatch ? `${selectedBatch.name} (${selectedBatch.code})` : 'this batch'}
              ? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedBatch(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs text-white"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                borderColor: '#dc2626',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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
