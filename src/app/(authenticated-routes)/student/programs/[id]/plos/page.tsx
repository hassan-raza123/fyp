'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Plus, Edit, Trash2 } from 'lucide-react';
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
  const programId = params.id as string;
  const [plos, setPLOs] = useState<PLO[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
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
    return <div>Loading...</div>;
  }

  return (
    <div className='container mx-auto py-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>
            Program Learning Outcomes - {program?.name}
          </h1>
          <p className='text-gray-500'>Manage PLOs for {program?.code}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className='w-4 h-4 mr-2' />
          Add PLO
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Bloom's Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plos.map((plo) => (
              <TableRow key={plo.id}>
                <TableCell>{plo.code}</TableCell>
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
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEditClick(plo)}
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='destructive'
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
            <DialogTitle>Create PLO</DialogTitle>
            <DialogDescription>
              Add a new Program Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='code'>PLO Code</Label>
              <Input
                id='code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., PLO1'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter PLO description'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='bloomLevel'>Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's level" />
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
            <div className='grid gap-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
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
              Update Program Learning Outcome details
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-code'>PLO Code</Label>
              <Input
                id='edit-code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., PLO1'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-description'>Description</Label>
              <Textarea
                id='edit-description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter PLO description'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-bloomLevel'>Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's level" />
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
            <div className='grid gap-2'>
              <Label htmlFor='edit-status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
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
