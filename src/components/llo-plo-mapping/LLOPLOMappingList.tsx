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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface LLO {
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
  lloId: number;
  ploId: number;
  weight: number;
  llo: LLO;
  plo: PLO;
}

export function LLOPLOMappingList() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLLO, setSelectedLLO] = useState<string>('');
  const [selectedPLO, setSelectedPLO] = useState<string>('');
  const [weight, setWeight] = useState('1.0');
  const [llos, setLLOs] = useState<LLO[]>([]);
  const [plos, setPLOs] = useState<PLO[]>([]);
  const [availablePLOs, setAvailablePLOs] = useState<PLO[]>([]);

  useEffect(() => {
    fetchMappings();
    fetchLLOs();
    fetchPLOs();
  }, []);

  useEffect(() => {
    if (selectedLLO) {
      const selectedLLOData = llos.find((l) => l.id === Number(selectedLLO));
      if (selectedLLOData?.course?.programs) {
        const courseProgramIds = selectedLLOData.course.programs.map(
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
  }, [selectedLLO, llos, plos]);

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/llo-plo-mappings', {
        credentials: 'include',
      });
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

  const fetchLLOs = async () => {
    try {
      const response = await fetch('/api/llos', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        // Need to fetch courses with programs for LLOs
        const llosWithPrograms = await Promise.all(
          data.data.map(async (llo: any) => {
            try {
              const courseResponse = await fetch(
                `/api/courses/${llo.courseId}`,
                { credentials: 'include' }
              );
              const courseData = await courseResponse.json();
              if (courseData.success && courseData.data) {
                return {
                  ...llo,
                  course: {
                    ...courseData.data,
                    programs: courseData.data.programs || [],
                  },
                };
              }
              return {
                ...llo,
                course: {
                  ...llo.course,
                  programs: [],
                },
              };
            } catch (err) {
              console.error('Error fetching course for LLO:', err);
              return {
                ...llo,
                course: {
                  ...llo.course,
                  programs: [],
                },
              };
            }
          })
        );
        setLLOs(llosWithPrograms);
      }
    } catch (error) {
      toast.error('Failed to fetch LLOs');
      console.error(error);
    }
  };

  const fetchPLOs = async () => {
    try {
      const response = await fetch('/api/plos', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setPLOs(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch PLOs');
    }
  };

  const handleCreate = async () => {
    if (!selectedLLO || !selectedPLO || !weight) {
      toast.error('Please fill in all fields');
      return;
    }

    const weightNum = parseFloat(weight);
    if (weightNum < 0 || weightNum > 1) {
      toast.error('Weight must be between 0 and 1');
      return;
    }

    try {
      const response = await fetch('/api/llo-plo-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lloId: Number(selectedLLO),
          ploId: Number(selectedPLO),
          weight: weightNum,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Mapping created successfully');
        setIsDialogOpen(false);
        setSelectedLLO('');
        setSelectedPLO('');
        setWeight('1.0');
        fetchMappings();
      } else {
        toast.error(data.error || 'Failed to create mapping');
      }
    } catch (error) {
      toast.error('Failed to create mapping');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;

    try {
      const response = await fetch(`/api/llo-plo-mappings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Mapping deleted successfully');
        fetchMappings();
      } else {
        toast.error(data.error || 'Failed to delete mapping');
      }
    } catch (error) {
      toast.error('Failed to delete mapping');
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading mappings...</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Mapping
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create LLO-PLO Mapping</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>LLO *</Label>
                <Select value={selectedLLO} onValueChange={setSelectedLLO}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select LLO" />
                  </SelectTrigger>
                  <SelectContent>
                    {llos.map((llo) => (
                      <SelectItem key={llo.id} value={llo.id.toString()}>
                        {llo.code} - {llo.description.substring(0, 50)}
                        {llo.description.length > 50 ? '...' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>PLO *</Label>
                <Select
                  value={selectedPLO}
                  onValueChange={setSelectedPLO}
                  disabled={!selectedLLO || availablePLOs.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedLLO
                          ? 'Select LLO first'
                          : availablePLOs.length === 0
                          ? 'No PLOs available'
                          : 'Select PLO'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePLOs.map((plo) => (
                      <SelectItem key={plo.id} value={plo.id.toString()}>
                        {plo.code} - {plo.description.substring(0, 50)}
                        {plo.description.length > 50 ? '...' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Weight (0-1) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 1.0, 0.7, 0.4"
                />
                <p className="text-xs text-muted-foreground">
                  High = 1.0, Medium = 0.7, Low = 0.4
                </p>
              </div>
              <Button onClick={handleCreate}>Create Mapping</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {mappings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No LLO-PLO mappings found. Create your first mapping to get started.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LLO</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>PLO</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{mapping.llo.code}</div>
                      <div className="text-sm text-muted-foreground max-w-md truncate">
                        {mapping.llo.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {mapping.llo.course.code}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {mapping.llo.course.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{mapping.plo.code}</div>
                      <div className="text-sm text-muted-foreground max-w-md truncate">
                        {mapping.plo.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {mapping.plo.program.code}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {mapping.plo.program.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{mapping.weight}</span>
                    {mapping.weight >= 0.8 && (
                      <span className="ml-2 text-xs text-green-600">(High)</span>
                    )}
                    {mapping.weight >= 0.5 && mapping.weight < 0.8 && (
                      <span className="ml-2 text-xs text-yellow-600">
                        (Medium)
                      </span>
                    )}
                    {mapping.weight < 0.5 && (
                      <span className="ml-2 text-xs text-orange-600">(Low)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(mapping.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

