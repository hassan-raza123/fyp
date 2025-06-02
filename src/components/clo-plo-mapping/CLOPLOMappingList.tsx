'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface CLO {
  id: number;
  code: string;
  description: string;
  courseId: number;
  course: {
    id: number;
    name: string;
    code: string;
    programs: {
      id: number;
      name: string;
      code: string;
    }[];
  };
}

interface PLO {
  id: number;
  code: string;
  description: string;
  programId: number;
  program: {
    id: number;
    name: string;
    code: string;
  };
}

interface Mapping {
  id: number;
  cloId: number;
  ploId: number;
  weight: number;
  clo: CLO;
  plo: PLO;
}

export function CLOPLOMappingList() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCLO, setSelectedCLO] = useState<string>('');
  const [selectedPLO, setSelectedPLO] = useState<string>('');
  const [weight, setWeight] = useState('0');
  const [clos, setCLOs] = useState<CLO[]>([]);
  const [plos, setPLOs] = useState<PLO[]>([]);
  const [availablePLOs, setAvailablePLOs] = useState<PLO[]>([]);

  useEffect(() => {
    fetchMappings();
    fetchCLOs();
    fetchPLOs();
  }, []);

  useEffect(() => {
    if (selectedCLO) {
      const selectedCLOData = clos.find((c) => c.id === Number(selectedCLO));
      if (selectedCLOData?.course?.programs) {
        const courseProgramIds = selectedCLOData.course.programs.map(
          (p) => p.id
        );
        const filteredPLOs = plos.filter((p) =>
          courseProgramIds.includes(p.programId)
        );
        setAvailablePLOs(filteredPLOs);
        if (
          selectedPLO &&
          !filteredPLOs.some((p) => p.id === Number(selectedPLO))
        ) {
          setSelectedPLO('');
        }
      } else {
        setAvailablePLOs([]);
        setSelectedPLO('');
      }
    } else {
      setAvailablePLOs([]);
      setSelectedPLO('');
    }
  }, [selectedCLO, clos, plos]);

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/clo-plo-mappings');
      const data = await response.json();
      if (data.success) {
        setMappings(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch mappings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCLOs = async () => {
    try {
      const response = await fetch('/api/clos');
      const data = await response.json();
      if (data.success) {
        setCLOs(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch CLOs');
    }
  };

  const fetchPLOs = async () => {
    try {
      const response = await fetch('/api/plos');
      const data = await response.json();
      if (data.success) {
        setPLOs(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch PLOs');
    }
  };

  const handleCreate = async () => {
    if (!selectedCLO || !selectedPLO || !weight) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/clo-plo-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloId: Number(selectedCLO),
          ploId: Number(selectedPLO),
          weight: Number(weight),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Mapping created successfully');
        setIsDialogOpen(false);
        setSelectedCLO('');
        setSelectedPLO('');
        setWeight('0');
        fetchMappings();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to create mapping');
    }
  };

  const handleUpdate = async (id: number, newWeight: number) => {
    try {
      const response = await fetch(`/api/clo-plo-mappings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: newWeight }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Mapping updated successfully');
        fetchMappings();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to update mapping');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;

    try {
      const response = await fetch(`/api/clo-plo-mappings/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Mapping deleted successfully');
        fetchMappings();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to delete mapping');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className='flex justify-end mb-4'>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='w-4 h-4 mr-2' />
              Create Mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create CLO-PLO Mapping</DialogTitle>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <label>CLO</label>
                <Select value={selectedCLO} onValueChange={setSelectedCLO}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select CLO' />
                  </SelectTrigger>
                  <SelectContent>
                    {clos.map((clo) => (
                      <SelectItem key={clo.id} value={clo.id.toString()}>
                        {clo.code} - {clo.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <label>PLO</label>
                <Select value={selectedPLO} onValueChange={setSelectedPLO}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select PLO' />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePLOs.map((plo) => (
                      <SelectItem key={plo.id} value={plo.id.toString()}>
                        {plo.code} - {plo.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <label>Weight (0-1)</label>
                <Input
                  type='number'
                  min='0'
                  max='1'
                  step='0.1'
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CLO</TableHead>
            <TableHead>PLO</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((mapping) => (
            <TableRow key={mapping.id}>
              <TableCell>
                {mapping.clo.code} - {mapping.clo.description}
              </TableCell>
              <TableCell>
                {mapping.plo.code} - {mapping.plo.description}
              </TableCell>
              <TableCell>
                <Input
                  type='number'
                  min='0'
                  max='1'
                  step='0.1'
                  value={mapping.weight}
                  onChange={(e) =>
                    handleUpdate(mapping.id, Number(e.target.value))
                  }
                  className='w-20'
                />
              </TableCell>
              <TableCell>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleDelete(mapping.id)}
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
