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

interface LLO {
  id: number;
  code: string;
  description: string;
  courseId: number;
  bloomLevel: string | null;
  status: 'active' | 'inactive' | 'archived';
  course: {
    id: number;
    code: string;
    name: string;
  };
}

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function AdminLLOsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';
  
  const router = useRouter();
  const [llos, setLLOs] = useState<LLO[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLLO, setSelectedLLO] = useState<LLO | null>(null);
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
      const [llosResponse, coursesResponse] = await Promise.all([
        fetch('/api/llos', { credentials: 'include' }),
        fetch('/api/courses', { credentials: 'include' }),
      ]);

      if (!llosResponse.ok || !coursesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [llosData, coursesData] = await Promise.all([
        llosResponse.json(),
        coursesResponse.json(),
      ]);

      if (!llosData.success || !coursesData.success) {
        throw new Error(
          llosData.error || coursesData.error || 'Failed to fetch data'
        );
      }

      if (!Array.isArray(llosData.data) || !Array.isArray(coursesData.data)) {
        throw new Error('Invalid data format received from server');
      }

      setLLOs(llosData.data);
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

  const handleCreateLLO = async () => {
    if (!formData.courseId || !formData.code || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/llos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          courseId: parseInt(formData.courseId),
          bloomLevel: formData.bloomLevel || undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('LLO created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          code: '',
          description: '',
          courseId: '',
          bloomLevel: '',
          status: 'active',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create LLO');
      }
    } catch (error) {
      toast.error('Failed to create LLO');
      console.error(error);
    }
  };

  const handleUpdateLLO = async () => {
    if (!selectedLLO) return;

    try {
      const response = await fetch(`/api/llos/${selectedLLO.id}`, {
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
      });

      const data = await response.json();
      if (data.success) {
        toast.success('LLO updated successfully');
        setIsEditDialogOpen(false);
        setSelectedLLO(null);
        setFormData({
          code: '',
          description: '',
          courseId: '',
          bloomLevel: '',
          status: 'active',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update LLO');
      }
    } catch (error) {
      toast.error('Failed to update LLO');
      console.error(error);
    }
  };

  const handleDeleteLLO = async () => {
    if (!selectedLLO) return;

    try {
      const response = await fetch(`/api/llos/${selectedLLO.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('LLO deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedLLO(null);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete LLO');
      }
    } catch (error) {
      toast.error('Failed to delete LLO');
      console.error(error);
    }
  };

  const handleViewClick = (llo: LLO) => {
    setSelectedLLO(llo);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (llo: LLO) => {
    setSelectedLLO(llo);
    setFormData({
      code: llo.code,
      description: llo.description,
      courseId: llo.courseId.toString(),
      bloomLevel: llo.bloomLevel || '',
      status: llo.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (llo: LLO) => {
    setSelectedLLO(llo);
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

  const filteredLLOs = llos.filter((llo) => {
    const matchesCourse = selectedCourse === 'all' || llo.courseId.toString() === selectedCourse;
    const matchesSearch = searchQuery === '' || 
      llo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      llo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      llo.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      llo.course.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
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
          ></div>
          <p className="text-xs text-secondary-text">Loading LLOs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Lab Learning Outcomes (LLOs)</h1>
          <p className="text-xs text-secondary-text mt-0.5">Manage all lab learning outcomes</p>
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
          <Plus className="w-3.5 h-3.5" />
          Add LLO
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-text" />
            <Input
              placeholder="Search LLOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
            />
          </div>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-card-border text-primary-text">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent className="bg-card border-card-border">
            <SelectItem value="all" className="text-primary-text hover:bg-card/50">All Courses</SelectItem>
            {courses.filter(c => c.id != null && c.id.toString() !== '').map((course) => (
              <SelectItem key={course.id} value={course.id.toString()} className="text-primary-text hover:bg-card/50">
                {course.name} ({course.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LLOs Table */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-primary-text">ID</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Course</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">LLO Code</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Bloom's Level</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLLOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="w-8 h-8 text-muted-text" />
                    <p className="text-xs text-secondary-text">No LLOs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLLOs.map((llo) => (
                <TableRow 
                  key={llo.id}
                  className="hover:bg-hover-bg transition-colors"
                >
                  <TableCell className="text-xs text-primary-text">{llo.id}</TableCell>
                  <TableCell className="text-xs text-primary-text">
                    <div>
                      <div className="font-medium">{llo.course.name}</div>
                      <div className="text-secondary-text">{llo.course.code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-primary-text">{llo.code}</TableCell>
                  <TableCell className="text-xs text-secondary-text max-w-md truncate">
                    {llo.description}
                  </TableCell>
                  <TableCell className="text-xs text-secondary-text">{llo.bloomLevel || '-'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(llo.status)} text-[10px] px-1.5 py-0.5`} variant='secondary'>
                      {llo.status.charAt(0).toUpperCase() + llo.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleViewClick(llo)}
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
                        onClick={() => handleEditClick(llo)}
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
                        onClick={() => handleDeleteClick(llo)}
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
                        onClick={() => router.push(`/admin/llo-plo-mappings?lloId=${llo.id}`)}
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

      {/* View LLO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">LLO Details</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              View Lab Learning Outcome information
            </DialogDescription>
          </DialogHeader>
          {selectedLLO && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Course</p>
                  <p className="text-sm font-medium text-primary-text">
                    {selectedLLO.course.name} ({selectedLLO.course.code})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">LLO Code</p>
                  <p className="text-sm font-medium text-primary-text">{selectedLLO.code}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Bloom's Level</p>
                  <p className="text-sm text-primary-text">{selectedLLO.bloomLevel || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-text mb-1">Status</p>
                  <Badge className={getStatusColor(selectedLLO.status)} variant='secondary'>
                    {selectedLLO.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-text mb-1">Description</p>
                <p className="text-sm text-primary-text">{selectedLLO.description}</p>
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
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
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

      {/* Create LLO Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Create LLO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Add a new Lab Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course" className="text-xs text-primary-text">Course *</Label>
              <Select
                value={formData.courseId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseId: value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {courses.filter(c => c.id != null && c.id.toString() !== '').map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()} className="text-primary-text hover:bg-card/50">
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code" className="text-xs text-primary-text">LLO Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., LLO1, LLO2"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-xs text-primary-text">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter LLO description"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bloomLevel" className="text-xs text-primary-text">Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value === "none" ? "" : value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select Bloom's level (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="none" className="text-primary-text hover:bg-card/50">None</SelectItem>
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
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
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
              onClick={() => setIsCreateDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateLLO}
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
              Create LLO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit LLO Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-2xl max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Edit LLO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Update Lab Learning Outcome details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code" className="text-xs text-primary-text">LLO Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., LLO1, LLO2"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-xs text-primary-text">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter LLO description"
                className="bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-bloomLevel" className="text-xs text-primary-text">Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value === "none" ? "" : value })
                }
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select Bloom's level (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="none" className="text-primary-text hover:bg-card/50">None</SelectItem>
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
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
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
              onClick={() => setIsEditDialogOpen(false)}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateLLO}
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
              Update LLO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete LLO Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">Delete LLO</DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              Are you sure you want to delete this LLO? This action cannot be
              undone.
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
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteLLO}
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
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
