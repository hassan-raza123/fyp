'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CLO } from '@/types/clo';
import { X } from 'lucide-react';

interface Course {
  id: number;
  name: string;
  code: string;
  programs?: {
    id: number;
    name: string;
    code: string;
  }[];
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

interface PLOMapping {
  id?: number;
  ploId: number;
  ploCode: string;
  ploDescription: string;
  programName: string;
  weight: number;
}

export default function AdminCLOsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';
  
  const router = useRouter();
  const [clos, setCLOs] = useState<CLO[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCLO, setSelectedCLO] = useState<CLO | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    courseId: '',
    bloomLevel: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
  });
  const [availablePLOs, setAvailablePLOs] = useState<PLO[]>([]);
  const [ploMappings, setPloMappings] = useState<PLOMapping[]>([]);
  const [newMapping, setNewMapping] = useState({ ploId: '', weight: '0.5' });
  const [existingMappings, setExistingMappings] = useState<any[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  
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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [closResponse, coursesResponse] = await Promise.all([
        fetch('/api/clos', { credentials: 'include' }),
        fetch('/api/courses', { credentials: 'include' }),
      ]);

      if (!closResponse.ok || !coursesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [closData, coursesData] = await Promise.all([
        closResponse.json(),
        coursesResponse.json(),
      ]);

      if (!closData.success || !coursesData.success) {
        throw new Error(
          closData.error || coursesData.error || 'Failed to fetch data'
        );
      }

      if (!Array.isArray(closData.data) || !Array.isArray(coursesData.data)) {
        throw new Error('Invalid data format received from server');
      }

      setCLOs(closData.data);
      setCourses(coursesData.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch available PLOs when course is selected
  useEffect(() => {
    if (formData.courseId) {
      fetchAvailablePLOs(formData.courseId);
    } else {
      setAvailablePLOs([]);
    }
  }, [formData.courseId]);

  // Fetch existing mappings when viewing/editing a CLO
  useEffect(() => {
    if (selectedCLO) {
      fetchExistingMappings(selectedCLO.id);
    } else {
      setExistingMappings([]);
      setPloMappings([]);
    }
  }, [selectedCLO]);

  const fetchAvailablePLOs = async (courseId: string) => {
    try {
      // First get the course with its programs
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
      });
      const courseData = await courseResponse.json();
      
      if (!courseData.success || !courseData.data?.programs) {
        setAvailablePLOs([]);
        return;
      }

      const programIds = courseData.data.programs.map((p: any) => p.id);
      
      // Fetch PLOs for all programs
      const ploPromises = programIds.map((programId: number) =>
        fetch(`/api/plos?programId=${programId}`, { credentials: 'include' })
      );
      
      const ploResponses = await Promise.all(ploPromises);
      const ploDataArray = await Promise.all(
        ploResponses.map((r) => r.json())
      );
      
      const allPLOs: PLO[] = [];
      ploDataArray.forEach((data) => {
        if (data.success && Array.isArray(data.data)) {
          allPLOs.push(...data.data);
        }
      });
      
      setAvailablePLOs(allPLOs);
    } catch (error) {
      console.error('Error fetching available PLOs:', error);
      setAvailablePLOs([]);
    }
  };

  const fetchExistingMappings = async (cloId: number) => {
    try {
      setIsLoadingMappings(true);
      const response = await fetch(`/api/clo-plo-mappings?cloId=${cloId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setExistingMappings(data.data);
        // Convert to PLOMapping format for display
        const formattedMappings: PLOMapping[] = data.data.map((m: any) => ({
          id: m.id,
          ploId: m.ploId,
          ploCode: m.plo.code,
          ploDescription: m.plo.description,
          programName: m.plo.program.name,
          weight: m.weight,
        }));
        setPloMappings(formattedMappings);
      }
    } catch (error) {
      console.error('Error fetching existing mappings:', error);
    } finally {
      setIsLoadingMappings(false);
    }
  };

  const addPLOMapping = () => {
    if (!newMapping.ploId) {
      toast.error('Please select a PLO');
      return;
    }

    const weight = parseFloat(newMapping.weight);
    if (isNaN(weight) || weight < 0 || weight > 1) {
      toast.error('Weight must be between 0 and 1');
      return;
    }

    const selectedPLO = availablePLOs.find(
      (p) => p.id === parseInt(newMapping.ploId)
    );
    
    if (!selectedPLO) {
      toast.error('Selected PLO not found');
      return;
    }

    // Check if already added
    if (ploMappings.some((m) => m.ploId === selectedPLO.id)) {
      toast.error('This PLO is already mapped');
      return;
    }

    setPloMappings([
      ...ploMappings,
      {
        ploId: selectedPLO.id,
        ploCode: selectedPLO.code,
        ploDescription: selectedPLO.description,
        programName: selectedPLO.program.name,
        weight,
      },
    ]);

    setNewMapping({ ploId: '', weight: '0.5' });
  };

  const removePLOMapping = (index: number) => {
    setPloMappings(ploMappings.filter((_, i) => i !== index));
  };

  const createPLOMappings = async (cloId: number, mappingsToCreate?: PLOMapping[]) => {
    const mappings = mappingsToCreate || ploMappings.filter((m) => !m.id);
    if (mappings.length === 0) return;

    const mappingPromises = mappings.map((mapping) =>
      fetch('/api/clo-plo-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cloId,
          ploId: mapping.ploId,
          weight: mapping.weight,
        }),
      })
    );

    try {
      const responses = await Promise.all(mappingPromises);
      const results = await Promise.all(
        responses.map((r) => r.json())
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        toast.error(
          `Failed to create ${failed.length} mapping(s). ${failed[0].error}`
        );
      } else if (mappings.length > 0) {
        toast.success(`Successfully created ${mappings.length} PLO mapping(s)`);
      }
    } catch (error) {
      toast.error('Failed to create PLO mappings');
    }
  };

  const handleCreateCLO = async () => {
    if (!formData.courseId || !formData.code || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`/api/courses/${formData.courseId}/clos`, {
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
        const newCLOId = data.data.id;
        
        // Create PLO mappings if any
        if (ploMappings.length > 0) {
          await createPLOMappings(newCLOId);
        }
        
        toast.success('CLO created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          code: '',
          description: '',
          courseId: '',
          bloomLevel: '',
          status: 'active',
        });
        setPloMappings([]);
        setNewMapping({ ploId: '', weight: '0.5' });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create CLO');
      }
    } catch (error) {
      toast.error('Failed to create CLO');
    }
  };

  const handleUpdateCLO = async () => {
    if (!selectedCLO) return;

    try {
      const response = await fetch(
        `/api/courses/${selectedCLO.courseId}/clos/${selectedCLO.id}`,
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
        // Handle PLO mappings: delete removed ones and add new ones
        const existingMappingIds = existingMappings.map((m: any) => m.id);
        const currentMappingIds = ploMappings
          .filter((m) => m.id)
          .map((m) => m.id!);
        
        // Delete removed mappings
        const toDelete = existingMappings.filter(
          (m: any) => !currentMappingIds.includes(m.id)
        );
        for (const mapping of toDelete) {
          await fetch(`/api/clo-plo-mappings/${mapping.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
        }

        // Add new mappings (those without id)
        const newMappings = ploMappings.filter((m) => !m.id);
        if (newMappings.length > 0) {
          await createPLOMappings(selectedCLO.id, newMappings);
        }

        toast.success('CLO updated successfully');
        setIsEditDialogOpen(false);
        setSelectedCLO(null);
        setFormData({
          code: '',
          description: '',
          courseId: '',
          bloomLevel: '',
          status: 'active',
        });
        setPloMappings([]);
        setNewMapping({ ploId: '', weight: '0.5' });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update CLO');
      }
    } catch (error) {
      toast.error('Failed to update CLO');
    }
  };

  const handleDeleteCLO = async () => {
    if (!selectedCLO) return;

    try {
      const response = await fetch(
        `/api/courses/${selectedCLO.courseId}/clos/${selectedCLO.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('CLO deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedCLO(null);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete CLO');
      }
    } catch (error) {
      toast.error('Failed to delete CLO');
    }
  };

  const handleViewClick = (clo: CLO) => {
    setSelectedCLO(clo);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = async (clo: CLO) => {
    setSelectedCLO(clo);
    setFormData({
      code: clo.code,
      description: clo.description,
      courseId: clo.courseId.toString(),
      bloomLevel: clo.bloomLevel || '',
      status: clo.status,
    });
    await fetchExistingMappings(clo.id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (clo: CLO) => {
    setSelectedCLO(clo);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const filteredCLOs = clos.filter((clo) => {
    const matchesCourse = selectedCourse === 'all' || clo.courseId.toString() === selectedCourse;
    const matchesSearch = searchQuery === '' || 
      clo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clo.course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clo.course?.code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  if (!mounted || isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-secondary-text">Loading CLOs...</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-primary-text'>Course Learning Outcomes</h1>
          <p className='text-secondary-text'>Manage all course learning outcomes</p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="px-4 py-2 rounded-lg transition-colors text-sm font-medium h-9 flex items-center gap-2"
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
          <Plus className='w-4 h-4' />
          Add CLO
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search CLOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className='w-[200px] h-8 text-xs bg-card border-card-border text-primary-text'>
            <SelectValue placeholder='Filter by course' />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value='all' className="text-primary-text hover:bg-card/50">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id.toString()} className="text-primary-text hover:bg-card/50">
                {course.name} ({course.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* CLOs Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Course</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Bloom's Level</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCLOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No CLOs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCLOs.map((clo) => (
                <TableRow 
                  key={clo.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{clo.id}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    <div>
                      <div className="font-medium">{clo.course?.name || 'N/A'}</div>
                      <div className="text-secondary-text">{clo.course?.code || ''}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{clo.code}</TableCell>
                  <TableCell className="text-xs text-secondary-text max-w-md truncate">{clo.description}</TableCell>
                  <TableCell className="text-xs text-secondary-text">{clo.bloomLevel || '-'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(clo.status)} text-[10px] px-1.5 py-0.5`} variant='secondary'>
                      {clo.status.charAt(0).toUpperCase() + clo.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewClick(clo)}
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
                        onClick={() => handleEditClick(clo)}
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
                        onClick={() => handleDeleteClick(clo)}
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
                        onClick={() => router.push(`/admin/clo-plo-mappings?cloId=${clo.id}`)}
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

      {/* View CLO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>CLO Details</DialogTitle>
            <DialogDescription>
              View Course Learning Outcome information
            </DialogDescription>
          </DialogHeader>
          {selectedCLO && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Course</p>
                  <p className="text-sm font-medium text-primary-text">
                    {selectedCLO.course?.name || 'N/A'} ({selectedCLO.course?.code || 'N/A'})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">CLO Code</p>
                  <p className="text-sm font-medium text-primary-text">{selectedCLO.code}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Bloom's Level</p>
                  <p className="text-sm text-primary-text">{selectedCLO.bloomLevel || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Status</p>
                  <Badge className={getStatusColor(selectedCLO.status)} variant='secondary'>
                    {selectedCLO.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-text mb-1">Description</p>
                <p className="text-sm text-primary-text">{selectedCLO.description}</p>
              </div>
              {isLoadingMappings ? (
                <div className="text-xs text-secondary-text">Loading mappings...</div>
              ) : existingMappings.length > 0 ? (
                <div>
                  <p className="text-[10px] text-muted-text mb-2">PLO Mappings</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {existingMappings.map((mapping: any) => (
                      <div
                        key={mapping.id}
                        className="p-2 rounded border border-card-border bg-card/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-primary-text">
                              {mapping.plo.code} - {mapping.plo.program.name}
                            </p>
                            <p className="text-[10px] text-secondary-text mt-0.5">
                              {mapping.plo.description.substring(0, 60)}...
                            </p>
                          </div>
                          <Badge className="text-[10px] ml-2">
                            {(mapping.weight * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-muted-text mb-1">PLO Mappings</p>
                  <p className="text-xs text-secondary-text">No PLO mappings found</p>
                </div>
              )}
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

      {/* Create CLO Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create CLO</DialogTitle>
            <DialogDescription>
              Add a new Course Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='course' className="text-xs text-primary-text">Course *</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseId: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder='Select course' />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()} className="text-primary-text hover:bg-card/50">
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='code' className="text-xs text-primary-text">CLO Code *</Label>
              <Input
                id='code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., CLO1'
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
                placeholder='Enter CLO description'
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

            {/* PLO Mapping Section */}
            {formData.courseId && (
              <div className="space-y-3 pt-2 border-t border-card-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-primary-text font-semibold">
                    PLO Mappings (Optional)
                  </Label>
                  <span className="text-[10px] text-secondary-text">
                    {ploMappings.length} mapped
                  </span>
                </div>

                {/* Add New Mapping */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <Select
                    value={newMapping.ploId}
                    onValueChange={(value) =>
                      setNewMapping({ ...newMapping, ploId: value })
                    }
                    disabled={availablePLOs.length === 0}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text text-xs h-8">
                      <SelectValue placeholder="Select PLO" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      {availablePLOs
                        .filter(
                          (plo) =>
                            !ploMappings.some((m) => m.ploId === plo.id)
                        )
                        .map((plo) => (
                          <SelectItem
                            key={plo.id}
                            value={plo.id.toString()}
                            className="text-primary-text hover:bg-card/50 text-xs"
                          >
                            {plo.code} - {plo.program.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newMapping.weight}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, weight: e.target.value })
                    }
                    placeholder="Weight"
                    className="w-20 h-8 text-xs bg-card border-card-border text-primary-text"
                  />
                  <button
                    onClick={addPLOMapping}
                    disabled={!newMapping.ploId || availablePLOs.length === 0}
                    className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-8 flex items-center justify-center"
                    style={{
                      backgroundColor: iconBgColor,
                      color: primaryColor,
                      opacity: !newMapping.ploId ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (newMapping.ploId) {
                        e.currentTarget.style.backgroundColor = isDarkMode
                          ? 'rgba(252, 153, 40, 0.2)'
                          : 'rgba(38, 40, 149, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = iconBgColor;
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Mappings List */}
                {ploMappings.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {ploMappings.map((mapping, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border border-card-border bg-card/50 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-primary-text font-medium truncate">
                            {mapping.ploCode} - {mapping.programName}
                          </p>
                          <p className="text-[10px] text-secondary-text truncate">
                            {mapping.ploDescription.substring(0, 40)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge className="text-[10px] px-1.5">
                            {(mapping.weight * 100).toFixed(0)}%
                          </Badge>
                          <button
                            onClick={() => removePLOMapping(index)}
                            className="p-0.5 rounded hover:bg-error/10 transition-colors"
                            style={{ color: 'var(--error)' }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {availablePLOs.length === 0 && formData.courseId && (
                  <p className="text-[10px] text-secondary-text">
                    No PLOs available for this course's programs
                  </p>
                )}
              </div>
            )}
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
              onClick={handleCreateCLO}
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
              Create CLO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit CLO Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit CLO</DialogTitle>
            <DialogDescription>
              Update Course Learning Outcome details
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-code' className="text-xs text-primary-text">CLO Code *</Label>
              <Input
                id='edit-code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., CLO1'
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
                placeholder='Enter CLO description'
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

            {/* PLO Mapping Section in Edit */}
            {formData.courseId && (
              <div className="space-y-3 pt-2 border-t border-card-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-primary-text font-semibold">
                    PLO Mappings
                  </Label>
                  <span className="text-[10px] text-secondary-text">
                    {ploMappings.length} mapped
                  </span>
                </div>

                {/* Add New Mapping */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <Select
                    value={newMapping.ploId}
                    onValueChange={(value) =>
                      setNewMapping({ ...newMapping, ploId: value })
                    }
                    disabled={availablePLOs.length === 0}
                  >
                    <SelectTrigger className="bg-card border-card-border text-primary-text text-xs h-8">
                      <SelectValue placeholder="Select PLO" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      {availablePLOs
                        .filter(
                          (plo) =>
                            !ploMappings.some((m) => m.ploId === plo.id)
                        )
                        .map((plo) => (
                          <SelectItem
                            key={plo.id}
                            value={plo.id.toString()}
                            className="text-primary-text hover:bg-card/50 text-xs"
                          >
                            {plo.code} - {plo.program.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newMapping.weight}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, weight: e.target.value })
                    }
                    placeholder="Weight"
                    className="w-20 h-8 text-xs bg-card border-card-border text-primary-text"
                  />
                  <button
                    onClick={addPLOMapping}
                    disabled={!newMapping.ploId || availablePLOs.length === 0}
                    className="px-2 py-1 rounded-md transition-colors text-xs font-medium h-8 flex items-center justify-center"
                    style={{
                      backgroundColor: iconBgColor,
                      color: primaryColor,
                      opacity: !newMapping.ploId ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (newMapping.ploId) {
                        e.currentTarget.style.backgroundColor = isDarkMode
                          ? 'rgba(252, 153, 40, 0.2)'
                          : 'rgba(38, 40, 149, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = iconBgColor;
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Mappings List */}
                {ploMappings.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {ploMappings.map((mapping, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border border-card-border bg-card/50 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-primary-text font-medium truncate">
                            {mapping.ploCode} - {mapping.programName}
                          </p>
                          <p className="text-[10px] text-secondary-text truncate">
                            {mapping.ploDescription.substring(0, 40)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={mapping.weight}
                            onChange={(e) => {
                              const updated = [...ploMappings];
                              updated[index].weight = parseFloat(e.target.value) || 0;
                              setPloMappings(updated);
                            }}
                            className="w-16 h-6 text-xs bg-card border-card-border text-primary-text"
                          />
                          <button
                            onClick={() => removePLOMapping(index)}
                            className="p-0.5 rounded hover:bg-error/10 transition-colors"
                            style={{ color: 'var(--error)' }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {availablePLOs.length === 0 && formData.courseId && (
                  <p className="text-[10px] text-secondary-text">
                    No PLOs available for this course's programs
                  </p>
                )}
              </div>
            )}
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
              onClick={handleUpdateCLO}
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
              Update CLO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete CLO Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete CLO</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this CLO? This action cannot be
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
              onClick={handleDeleteCLO}
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
