'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, Search, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PEO {
  id: number;
  code: string;
  description: string;
  programId: number;
  status: 'active' | 'inactive' | 'archived';
  program: { id: number; name: string; code: string };
  ploMappings: Array<{ id: number; plo: { id: number; code: string; description: string } }>;
  createdAt: string;
  updatedAt: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

function PEOsPageContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const router = useRouter();
  const searchParams = useSearchParams();
  const [peos, setPEOs] = useState<PEO[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPEO, setSelectedPEO] = useState<PEO | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
    programId: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetchPEOs();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch programs');
      }
    } catch (error) {
      toast.error('Failed to fetch programs');
    }
  };

  const fetchPEOs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/peos', { credentials: 'include' });
      const data = await response.json();
      if (Array.isArray(data)) {
        setPEOs(data);
      } else {
        toast.error(data.error || 'Failed to fetch PEOs');
      }
    } catch (error) {
      toast.error('Failed to fetch PEOs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePEO = async () => {
    if (!formData.programId || !formData.code || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/peos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          programId: Number(formData.programId),
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (response.ok && data.id) {
        toast.success('PEO created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          code: '',
          description: '',
          status: 'active',
          programId: '',
        });
        fetchPEOs();
      } else {
        toast.error(data.error || 'Failed to create PEO');
      }
    } catch (error) {
      toast.error('Failed to create PEO');
    }
  };

  const handleUpdatePEO = async () => {
    if (!selectedPEO) return;

    try {
      const response = await fetch(`/api/peos/${selectedPEO.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (response.ok && data.id) {
        toast.success('PEO updated successfully');
        setIsEditDialogOpen(false);
        setSelectedPEO(null);
        setFormData({
          code: '',
          description: '',
          status: 'active',
          programId: '',
        });
        fetchPEOs();
      } else {
        toast.error(data.error || 'Failed to update PEO');
      }
    } catch (error) {
      toast.error('Failed to update PEO');
    }
  };

  const handleDeletePEO = async () => {
    if (!selectedPEO) return;

    try {
      const response = await fetch(`/api/peos/${selectedPEO.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('PEO archived successfully');
        setIsDeleteDialogOpen(false);
        setSelectedPEO(null);
        fetchPEOs();
      } else {
        toast.error(data.error || 'Failed to delete PEO');
      }
    } catch (error) {
      toast.error('Failed to delete PEO');
    }
  };

  const handleViewClick = (peo: PEO) => {
    setSelectedPEO(peo);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (peo: PEO) => {
    setSelectedPEO(peo);
    setFormData({
      code: peo.code,
      description: peo.description,
      status: peo.status,
      programId: peo.program.id.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (peo: PEO) => {
    setSelectedPEO(peo);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[var(--success-green)] text-white';
      case 'inactive':
        return 'bg-[var(--gray-500)] text-white';
      case 'archived':
        return 'bg-[var(--gray-500)] text-white';
      default:
        return 'bg-[var(--gray-500)] text-white';
    }
  };

  const filteredPEOs = peos.filter((peo) => {
    const matchesProgram =
      selectedProgram === 'all' || peo.program.id.toString() === selectedProgram;
    const matchesSearch =
      searchQuery === '' ||
      peo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peo.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peo.program.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProgram && matchesSearch;
  });

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
          <p className="text-xs text-secondary-text">Loading PEOs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-bold text-primary-text'>Program Educational Objectives</h1>
          <p className='text-xs text-secondary-text mt-0.5'>Manage all program educational objectives</p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{
            backgroundColor: iconBgColor,
            color: primaryColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode
              ? 'rgba(252, 153, 40, 0.2)'
              : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Plus className='w-3.5 h-3.5' />
          Add PEO
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search PEOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className='w-[200px] h-8 text-xs bg-card border-card-border text-primary-text'>
            <SelectValue placeholder='Filter by program' />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value='all' className="text-primary-text hover:bg-card/50">
              All Programs
            </SelectItem>
            {programs.map((program) => (
              <SelectItem
                key={program.id}
                value={program.id.toString()}
                className="text-primary-text hover:bg-card/50"
              >
                {program.name} ({program.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* PEOs Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Program</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Mapped PLOs</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPEOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No PEOs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPEOs.map((peo) => (
                <TableRow
                  key={peo.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{peo.id}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    <div>
                      <div className="font-medium">{peo.program.name}</div>
                      <div className="text-secondary-text">{peo.program.code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{peo.code}</TableCell>
                  <TableCell className="text-xs text-secondary-text max-w-md truncate">
                    {peo.description}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {peo.ploMappings.length > 0 ? (
                      <span
                        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                      >
                        {peo.ploMappings.length} PLO{peo.ploMappings.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-muted-text">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(peo.status)} text-[10px] px-1.5 py-0.5`}
                      variant='secondary'
                    >
                      {peo.status.charAt(0).toUpperCase() + peo.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewClick(peo)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? 'rgba(252, 153, 40, 0.2)'
                            : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                        title="View Details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleEditClick(peo)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? 'rgba(252, 153, 40, 0.2)'
                            : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                        title="Edit PEO"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(peo)}
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
                        title="Archive PEO"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/peo-plo-mappings?peoId=${peo.id}`)}
                        className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-7"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? 'rgba(252, 153, 40, 0.2)'
                            : 'rgba(38, 40, 149, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = iconBgColor;
                        }}
                        title="Map PLOs"
                      >
                        <BookOpen className="w-3 h-3" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View PEO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">PEO Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View Program Educational Objective information
            </DialogDescription>
          </DialogHeader>
          {selectedPEO && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Program</p>
                  <p className="text-sm font-medium text-primary-text">
                    {selectedPEO.program.name} ({selectedPEO.program.code})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">PEO Code</p>
                  <p className="text-sm font-medium text-primary-text">{selectedPEO.code}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Status</p>
                  <Badge className={getStatusColor(selectedPEO.status)} variant='secondary'>
                    {selectedPEO.status.charAt(0).toUpperCase() + selectedPEO.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Mapped PLOs</p>
                  <p className="text-sm text-primary-text">
                    {selectedPEO.ploMappings.length} PLO{selectedPEO.ploMappings.length !== 1 ? 's' : ''} mapped
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-text mb-1">Description</p>
                <p className="text-sm text-primary-text">{selectedPEO.description}</p>
              </div>
              {selectedPEO.ploMappings.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-text mb-2">Mapped PLOs</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPEO.ploMappings.map((mapping) => (
                      <div
                        key={mapping.id}
                        className="group relative inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium cursor-default"
                        style={{
                          backgroundColor: iconBgColor,
                          color: primaryColor,
                        }}
                        title={mapping.plo.description}
                      >
                        {mapping.plo.code}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    router.push(`/admin/peo-plo-mappings?peoId=${selectedPEO.id}`);
                  }}
                  className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
                  style={{
                    backgroundColor: iconBgColor,
                    color: primaryColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? 'rgba(252, 153, 40, 0.2)'
                      : 'rgba(38, 40, 149, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = iconBgColor;
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Map PLOs
                </button>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsViewDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PEO Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create PEO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new Program Educational Objective
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='program' className="text-xs text-primary-text">Program *</Label>
              <Select
                value={formData.programId}
                onValueChange={(value) => setFormData({ ...formData, programId: value })}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder='Select program' />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {programs.map((program) => (
                    <SelectItem
                      key={program.id}
                      value={program.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {program.name} ({program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='code' className="text-xs text-primary-text">PEO Code *</Label>
              <Input
                id='code'
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder='e.g., PEO1'
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description' className="text-xs text-primary-text">Description *</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='Enter PEO description'
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                rows={4}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='status' className="text-xs text-primary-text">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value='active' className="text-primary-text hover:bg-card/50">Active</SelectItem>
                  <SelectItem value='inactive' className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  <SelectItem value='archived' className="text-primary-text hover:bg-card/50">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsCreateDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePEO}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primaryColorDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
              }}
            >
              Create PEO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PEO Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit PEO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update Program Educational Objective details
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-code' className="text-xs text-primary-text">PEO Code *</Label>
              <Input
                id='edit-code'
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder='e.g., PEO1'
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-description' className="text-xs text-primary-text">Description *</Label>
              <Textarea
                id='edit-description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='Enter PEO description'
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                rows={4}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-status' className="text-xs text-primary-text">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value='active' className="text-primary-text hover:bg-card/50">Active</SelectItem>
                  <SelectItem value='inactive' className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  <SelectItem value='archived' className="text-primary-text hover:bg-card/50">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsEditDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePEO}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primaryColorDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
              }}
            >
              Update PEO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete PEO Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Archive PEO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to archive this PEO? It will be hidden from active listings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePEO}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              Archive
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PEOsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PEOsPageContent />
    </Suspense>
  );
}
