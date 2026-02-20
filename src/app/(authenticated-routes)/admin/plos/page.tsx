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

interface PLO {
  id: number;
  program: {
    id: number;
    name: string;
    code: string;
  };
  code: string;
  description: string;
  bloomLevel: string | null;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

function PLOsPageContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plos, setPLOs] = useState<PLO[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPLO, setSelectedPLO] = useState<PLO | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    bloomLevel: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
    programId: '',
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const bloomLevels = [
    'Remember',
    'Understand',
    'Apply',
    'Analyze',
    'Evaluate',
    'Create',
  ];

  useEffect(() => {
    fetchPrograms();
    fetchPLOs();
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

  const fetchPLOs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plos', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setPLOs(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch PLOs');
      }
    } catch (error) {
      toast.error('Failed to fetch PLOs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePLO = async () => {
    if (!formData.programId || !formData.code || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`/api/programs/${formData.programId}/plos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          bloomLevel: formData.bloomLevel || undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('PLO created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          code: '',
          description: '',
          bloomLevel: '',
          status: 'active',
          programId: '',
        });
        fetchPLOs();
      } else {
        toast.error(data.error || 'Failed to create PLO');
      }
    } catch (error) {
      toast.error('Failed to create PLO');
    }
  };

  const handleUpdatePLO = async () => {
    if (!selectedPLO) return;

    try {
      const response = await fetch(
        `/api/programs/${selectedPLO.program.id}/plos/${selectedPLO.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            code: formData.code,
            description: formData.description,
            bloomLevel: formData.bloomLevel || undefined,
            status: formData.status,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('PLO updated successfully');
        setIsEditDialogOpen(false);
        setSelectedPLO(null);
        setFormData({
          code: '',
          description: '',
          bloomLevel: '',
          status: 'active',
          programId: '',
        });
        fetchPLOs();
      } else {
        toast.error(data.error || 'Failed to update PLO');
      }
    } catch (error) {
      toast.error('Failed to update PLO');
    }
  };

  const handleDeletePLO = async () => {
    if (!selectedPLO) return;

    try {
      const response = await fetch(
        `/api/programs/${selectedPLO.program.id}/plos/${selectedPLO.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('PLO deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedPLO(null);
        fetchPLOs();
      } else {
        toast.error(data.error || 'Failed to delete PLO');
      }
    } catch (error) {
      toast.error('Failed to delete PLO');
    }
  };

  const handleViewClick = (plo: PLO) => {
    setSelectedPLO(plo);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (plo: PLO) => {
    setSelectedPLO(plo);
    setFormData({
      code: plo.code,
      description: plo.description,
      bloomLevel: plo.bloomLevel || '',
      status: plo.status,
      programId: plo.program.id.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (plo: PLO) => {
    setSelectedPLO(plo);
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

  const filteredPLOs = plos.filter((plo) => {
    const matchesProgram = selectedProgram === 'all' || plo.program.id.toString() === selectedProgram;
    const matchesSearch = searchQuery === '' || 
      plo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plo.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plo.program.code.toLowerCase().includes(searchQuery.toLowerCase());
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
          <p className="text-xs text-secondary-text">Loading PLOs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-bold text-primary-text'>Program Learning Outcomes</h1>
          <p className='text-xs text-secondary-text mt-0.5'>Manage all program learning outcomes</p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
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
          <Plus className='w-3.5 h-3.5' />
          Add PLO
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search PLOs..."
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
            <SelectItem value='all' className="text-primary-text hover:bg-card/50">All Programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id.toString()} className="text-primary-text hover:bg-card/50">
                {program.name} ({program.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* PLOs Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Program</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Bloom's Level</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPLOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No PLOs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPLOs.map((plo) => (
                <TableRow 
                  key={plo.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{plo.id}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    <div>
                      <div className="font-medium">{plo.program.name}</div>
                      <div className="text-secondary-text">{plo.program.code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{plo.code}</TableCell>
                  <TableCell className="text-xs text-secondary-text max-w-md truncate">{plo.description}</TableCell>
                  <TableCell className="text-xs text-secondary-text">{plo.bloomLevel || '-'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(plo.status)} text-[10px] px-1.5 py-0.5`} variant='secondary'>
                      {plo.status.charAt(0).toUpperCase() + plo.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewClick(plo)}
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
                        onClick={() => handleEditClick(plo)}
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
                        onClick={() => handleDeleteClick(plo)}
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
                      <button
                        onClick={() => router.push(`/admin/clo-plo-mappings?ploId=${plo.id}`)}
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
                        title="View Mappings"
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

      {/* View PLO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PLO Details</DialogTitle>
            <DialogDescription>
              View Program Learning Outcome information
            </DialogDescription>
          </DialogHeader>
          {selectedPLO && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Program</p>
                  <p className="text-sm font-medium text-primary-text">
                    {selectedPLO.program.name} ({selectedPLO.program.code})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">PLO Code</p>
                  <p className="text-sm font-medium text-primary-text">{selectedPLO.code}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Bloom's Level</p>
                  <p className="text-sm text-primary-text">{selectedPLO.bloomLevel || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Status</p>
                  <Badge className={getStatusColor(selectedPLO.status)} variant='secondary'>
                    {selectedPLO.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-text mb-1">Description</p>
                <p className="text-sm text-primary-text">{selectedPLO.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setIsViewDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PLO Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create PLO</DialogTitle>
            <DialogDescription>
              Add a new Program Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='program' className="text-xs text-primary-text">Program *</Label>
              <Select
                value={formData.programId}
                onValueChange={(value) =>
                  setFormData({ ...formData, programId: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder='Select program' />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()} className="text-primary-text hover:bg-card/50">
                      {program.name} ({program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='code' className="text-xs text-primary-text">PLO Code *</Label>
              <Input
                id='code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., PLO1'
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description' className="text-xs text-primary-text">Description *</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter PLO description'
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                rows={4}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='bloomLevel' className="text-xs text-primary-text">Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select Bloom's level (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="" className="text-primary-text hover:bg-card/50">None</SelectItem>
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level} className="text-primary-text hover:bg-card/50">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePLO}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Create PLO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PLO Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit PLO</DialogTitle>
            <DialogDescription>
              Update Program Learning Outcome details
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-code' className="text-xs text-primary-text">PLO Code *</Label>
              <Input
                id='edit-code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., PLO1'
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-description' className="text-xs text-primary-text">Description *</Label>
              <Textarea
                id='edit-description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter PLO description'
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                rows={4}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-bloomLevel' className="text-xs text-primary-text">Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select Bloom's level (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="" className="text-primary-text hover:bg-card/50">None</SelectItem>
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level} className="text-primary-text hover:bg-card/50">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePLO}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Update PLO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete PLO Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete PLO</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this PLO? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePLO}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{
                backgroundColor: 'var(--error)',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PLOsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PLOsPageContent />
    </Suspense>
  );
}
