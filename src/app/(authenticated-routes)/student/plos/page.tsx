'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plos, setPLOs] = useState<PLO[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPLO, setSelectedPLO] = useState<PLO | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    bloomLevel: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
    programId: '',
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
    fetchPrograms();
    fetchPLOs();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
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
      const response = await fetch('/api/plos');
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
      const response = await fetch(`/api/programs/${formData.programId}/plos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          bloomLevel: formData.bloomLevel,
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
          body: JSON.stringify({
            code: formData.code,
            description: formData.description,
            bloomLevel: formData.bloomLevel,
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
      programId: plo.program.id.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (plo: PLO) => {
    setSelectedPLO(plo);
    setIsDeleteDialogOpen(true);
  };

  const filteredPLOs =
    selectedProgram === 'all'
      ? plos
      : plos.filter((plo) => plo.program.id.toString() === selectedProgram);

  if (loading) {
    return (
      <div className='p-6'>
        <div className='text-center py-4'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Program Learning Outcomes (PLOs)</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className='w-4 h-4 mr-2' />
          Add PLO
        </Button>
      </div>

      {/* Program Filter */}
      <div className='mb-6'>
        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className='w-64'>
            <SelectValue placeholder='Filter by program' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id.toString()}>
                {program.name} ({program.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* PLOs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Bloom Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPLOs.map((plo) => (
              <TableRow key={plo.id}>
                <TableCell className='font-medium'>{plo.code}</TableCell>
                <TableCell>{plo.description}</TableCell>
                <TableCell>{plo.bloomLevel || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      plo.status === 'active'
                        ? 'default'
                        : plo.status === 'inactive'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {plo.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {plo.program.name} ({plo.program.code})
                </TableCell>
                <TableCell>
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEditClick(plo)}
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleDeleteClick(plo)}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create PLO Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New PLO</DialogTitle>
            <DialogDescription>
              Add a new Program Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='program'>Program</Label>
              <Select
                value={formData.programId}
                onValueChange={(value) =>
                  setFormData({ ...formData, programId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select program' />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.name} ({program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='code'>Code</Label>
              <Input
                id='code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., PLO1'
              />
            </div>
            <div>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Describe the learning outcome'
              />
            </div>
            <div>
              <Label htmlFor='bloomLevel'>Bloom Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select bloom level' />
                </SelectTrigger>
                <SelectContent>
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePLO}>Create PLO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PLO Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit PLO</DialogTitle>
            <DialogDescription>
              Update the Program Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='edit-code'>Code</Label>
              <Input
                id='edit-code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor='edit-description'>Description</Label>
              <Textarea
                id='edit-description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor='edit-bloomLevel'>Bloom Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select bloom level' />
                </SelectTrigger>
                <SelectContent>
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='edit-status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePLO}>Update PLO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeletePLO}>
              Delete
            </Button>
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
