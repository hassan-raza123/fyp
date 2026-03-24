'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Plus, Trash2, Search } from 'lucide-react';

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<number | null>(null);
  const [selectedLLO, setSelectedLLO] = useState<string>('');
  const [selectedPLO, setSelectedPLO] = useState<string>('');
  const [weight, setWeight] = useState('0');
  const [llos, setLLOs] = useState<LLO[]>([]);
  const [plos, setPLOs] = useState<PLO[]>([]);
  const [availablePLOs, setAvailablePLOs] = useState<PLO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWeights, setEditingWeights] = useState<Record<number, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchMappings();
    fetchLLOs();
    fetchPLOs();
  }, []);

  useEffect(() => {
    if (selectedLLO) {
      const selectedLLOData = llos.find((l) => l.id === Number(selectedLLO));
      const programs = selectedLLOData?.course?.programs ?? [];
      let newAvailable: PLO[];
      if (programs.length > 0) {
        const courseProgramIds = programs.map((p) => p.id);
        newAvailable = plos.filter((p) => courseProgramIds.includes(p.programId));
      } else {
        newAvailable = plos;
      }
      setAvailablePLOs(newAvailable);
      if (selectedPLO && !newAvailable.some((p) => p.id === Number(selectedPLO))) {
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
                course: { ...llo.course, programs: [] },
              };
            } catch (err) {
              return {
                ...llo,
                course: { ...llo.course, programs: [] },
              };
            }
          })
        );
        setLLOs(llosWithPrograms);
      }
    } catch (error) {
      toast.error('Failed to fetch LLOs');
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
        setWeight('0');
        fetchMappings();
      } else {
        toast.error(data.error || 'Failed to create mapping');
      }
    } catch (error) {
      toast.error('Failed to create mapping');
    }
  };

  const handleUpdate = async (id: number, newWeight: number) => {
    try {
      const response = await fetch(`/api/llo-plo-mappings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  const handleDeleteClick = (id: number) => {
    setMappingToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!mappingToDelete) return;

    try {
      const response = await fetch(`/api/llo-plo-mappings/${mappingToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Mapping deleted successfully');
        setIsDeleteDialogOpen(false);
        setMappingToDelete(null);
        fetchMappings();
      } else {
        toast.error(data.error || 'Failed to delete mapping');
      }
    } catch (error) {
      toast.error('Failed to delete mapping');
    }
  };

  const filteredMappings = mappings.filter((mapping) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      mapping.llo.code.toLowerCase().includes(q) ||
      mapping.llo.course.name.toLowerCase().includes(q) ||
      mapping.llo.course.code.toLowerCase().includes(q) ||
      mapping.plo.code.toLowerCase().includes(q) ||
      mapping.plo.program.name.toLowerCase().includes(q)
    );
  });

  if (!mounted || isLoading) {
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
          />
          <p className="text-xs text-secondary-text">Loading mappings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">LLO-PLO Mappings</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage mappings between Lab Learning Outcomes (LLO) and Program Learning Outcomes (PLO)
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode
              ? 'rgba(252, 153, 40, 0.2)'
              : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Mapping
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search mappings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">LLO</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Course</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">PLO</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Program</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Weight</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No mappings found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMappings.map((mapping) => (
                <TableRow
                  key={mapping.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs">
                    <div className="font-medium text-primary-text">{mapping.llo.code}</div>
                    <div className="text-secondary-text max-w-xs truncate">
                      {mapping.llo.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-primary-text">
                      {mapping.llo.course.code}
                    </div>
                    <div className="text-secondary-text">
                      {mapping.llo.course.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-primary-text">{mapping.plo.code}</div>
                    <div className="text-secondary-text max-w-xs truncate">
                      {mapping.plo.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-primary-text">
                      {mapping.plo.program.code}
                    </div>
                    <div className="text-secondary-text">
                      {mapping.plo.program.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={editingWeights[mapping.id] ?? mapping.weight}
                        onChange={(e) =>
                          setEditingWeights((prev) => ({ ...prev, [mapping.id]: e.target.value }))
                        }
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          setEditingWeights((prev) => {
                            const next = { ...prev };
                            delete next[mapping.id];
                            return next;
                          });
                          if (!isNaN(val) && val > 0) handleUpdate(mapping.id, val);
                        }}
                        className="w-20 h-7 text-xs bg-card border-card-border text-primary-text"
                      />
                      <span className="text-[10px] text-secondary-text">
                        {mapping.weight >= 0.8
                          ? 'High'
                          : mapping.weight >= 0.5
                          ? 'Med'
                          : 'Low'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDeleteClick(mapping.id)}
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Mapping Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">
              Create LLO-PLO Mapping
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Map a Lab Learning Outcome to a Program Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs text-primary-text">LLO *</Label>
              <Select value={selectedLLO} onValueChange={setSelectedLLO}>
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select LLO" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {llos.map((llo) => (
                    <SelectItem
                      key={llo.id}
                      value={llo.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {llo.code} -{' '}
                      {llo.description.substring(0, 50)}
                      {llo.description.length > 50 ? '...' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-primary-text">PLO *</Label>
              <Select
                value={selectedPLO}
                onValueChange={setSelectedPLO}
                disabled={!selectedLLO || availablePLOs.length === 0}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
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
                <SelectContent className="bg-card border-card-border">
                  {availablePLOs.map((plo) => (
                    <SelectItem
                      key={plo.id}
                      value={plo.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {plo.code} -{' '}
                      {plo.description.substring(0, 50)}
                      {plo.description.length > 50 ? '...' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-primary-text">Weight (0-1) *</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 1.0, 0.7, 0.4"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
              <p className="text-[10px] text-secondary-text">
                High = 1.0, Medium = 0.7, Low = 0.4
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border bg-transparent"
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
              onClick={handleCreate}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{ backgroundColor: primaryColor, color: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primaryColorDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
              }}
            >
              Create Mapping
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">
              Delete Mapping
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete this mapping? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border bg-transparent"
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
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
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
