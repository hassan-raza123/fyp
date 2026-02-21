'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Plus, Edit, Trash2, GraduationCap, ArrowLeft } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface PLO {
  id: number;
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

export default function PLOsPage() {
  const router = useRouter();
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const programId = params.id as string;
  const [plos, setPLOs] = useState<PLO[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPLO, setSelectedPLO] = useState<PLO | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    bloomLevel: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
  });

  const bloomLevels = [
    'Remember',
    'Understand',
    'Apply',
    'Analyze',
    'Evaluate',
    'Create',
  ];

  useEffect(() => {
    fetchProgram();
    fetchPLOs();
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}`);
      const data = await response.json();
      if (data.success) {
        setProgram(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch program');
      }
    } catch (error) {
      toast.error('Failed to fetch program');
    }
  };

  const fetchPLOs = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}/plos`);
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
    try {
      const response = await fetch(`/api/programs/${programId}/plos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
        `/api/programs/${programId}/plos/${selectedPLO.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
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
        `/api/programs/${programId}/plos/${selectedPLO.id}`,
        {
          method: 'DELETE',
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

  const handleEditClick = (plo: PLO) => {
    setSelectedPLO(plo);
    setFormData({
      code: plo.code,
      description: plo.description,
      bloomLevel: plo.bloomLevel || '',
      status: plo.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (plo: PLO) => {
    setSelectedPLO(plo);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - CLO style with icon box */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/programs')}
            className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">
              Program Learning Outcomes - {program?.name}
            </h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Manage PLOs for {program?.code}
            </p>
          </div>
        </div>
        <button
          type="button"
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
          Add PLO
        </button>
      </div>

      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Bloom&apos;s Level</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plos.map((plo) => (
              <TableRow key={plo.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">{plo.code}</TableCell>
                <TableCell className="text-xs text-secondary-text max-w-md truncate">{plo.description}</TableCell>
                <TableCell className="text-xs text-secondary-text">{plo.bloomLevel || '-'}</TableCell>
                <TableCell>
                  <Badge
                    className={`text-[10px] ${plo.status === 'active' ? 'bg-[var(--success-green)]' : plo.status === 'inactive' ? 'bg-[var(--gray-500)]' : ''}`}
                    variant={plo.status === 'archived' ? 'destructive' : 'secondary'}
                  >
                    {plo.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(plo)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: iconBgColor, color: primaryColor }}
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
                      type="button"
                      onClick={() => handleDeleteClick(plo)}
                      className="p-2 rounded-lg transition-colors text-[var(--error)] hover:bg-[var(--error)]/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create PLO Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create PLO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new Program Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code" className="text-xs text-primary-text">PLO Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., PLO1"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-xs text-primary-text">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter PLO description"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bloomLevel" className="text-xs text-primary-text">Bloom&apos;s Taxonomy Level</Label>
              <Select value={formData.bloomLevel} onValueChange={(value) => setFormData({ ...formData, bloomLevel: value })}>
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select Bloom's level" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level} className="text-primary-text hover:bg-card/50">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-xs text-primary-text">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'archived') => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                  <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  <SelectItem value="archived" className="text-primary-text hover:bg-card/50">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreatePLO}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Create PLO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PLO Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit PLO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update Program Learning Outcome details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code" className="text-xs text-primary-text">PLO Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., PLO1"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-xs text-primary-text">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter PLO description"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-bloomLevel" className="text-xs text-primary-text">Bloom&apos;s Taxonomy Level</Label>
              <Select value={formData.bloomLevel} onValueChange={(value) => setFormData({ ...formData, bloomLevel: value })}>
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select Bloom's level" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level} className="text-primary-text hover:bg-card/50">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status" className="text-xs text-primary-text">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'archived') => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="active" className="text-primary-text hover:bg-card/50">Active</SelectItem>
                  <SelectItem value="inactive" className="text-primary-text hover:bg-card/50">Inactive</SelectItem>
                  <SelectItem value="archived" className="text-primary-text hover:bg-card/50">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setIsEditDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdatePLO}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Update PLO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete PLO Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete PLO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete this PLO? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{ color: isDarkMode ? '#ffffff' : '#111827', borderColor: isDarkMode ? '#404040' : '#e5e7eb' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeletePLO}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 text-white bg-[var(--error)] hover:opacity-90"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
