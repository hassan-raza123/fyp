'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, ArrowLeft, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Batch {
  id: number;
  name: string;
  code: string;
  programId: number;
}

export default function BulkImportStudentsPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    setLoadingRefs(true);
    try {
      // Fetch departments
      const deptResponse = await fetch('/api/departments', {
        credentials: 'include',
      });
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        if (deptData.success) {
          setDepartments(deptData.data || []);
        }
      }

      // Fetch programs
      const progResponse = await fetch('/api/programs?limit=1000', {
        credentials: 'include',
      });
      if (progResponse.ok) {
        const progData = await progResponse.json();
        if (progData.success) {
          setPrograms(progData.data || []);
        }
      }

      // Fetch batches
      const batchResponse = await fetch('/api/batches?limit=1000', {
        credentials: 'include',
      });
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        if (batchData.success) {
          setBatches(batchData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    } finally {
      setLoadingRefs(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        !selectedFile.name.endsWith('.csv') &&
        !selectedFile.name.endsWith('.xlsx')
      ) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      // Get actual data from database for template
      let deptName = 'Computer Science';
      let progName = 'BS Computer Science';
      let batchName = 'Batch 2024';
      
      // Use first available department
      if (departments.length > 0) {
        deptName = departments[0].name;
      }
      
      // Use first available program
      if (programs.length > 0) {
        progName = programs[0].name;
      }
      
      // Use first available batch
      if (batches.length > 0) {
        batchName = batches[0].name;
      }
      
      // Create CSV with actual database names
      const csvContent = `firstName,lastName,email,role,rollNumber,departmentName,programName,batchName,status
John,Doe,john.doe@example.com,student,STU001,${deptName},${progName},${batchName},active
Jane,Smith,jane.smith@example.com,student,STU002,${deptName},${progName},${batchName},active`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded with actual database names');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const downloadProgramBatchList = () => {
    try {
      if (programs.length === 0 && batches.length === 0) {
        toast.error('No programs or batches available. Please wait for data to load.');
        return;
      }

      // Create CSV with programName and batchName columns
      // Group batches by program for better organization
      const rows: string[] = ['programName,batchName'];
      
      // Add all program-batch combinations
      programs.forEach((program) => {
        const programBatches = batches.filter(b => b.programId === program.id);
        
        if (programBatches.length > 0) {
          // Add each batch for this program
          programBatches.forEach((batch) => {
            rows.push(`"${program.name}","${batch.name}"`);
          });
        } else {
          // If no batches, still add program (batch will be empty)
          rows.push(`"${program.name}",""`);
        }
      });

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'programs_and_batches_list.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${programs.length} program(s) and ${batches.length} batch(es)`);
    } catch (error) {
      console.error('Error downloading program/batch list:', error);
      toast.error('Failed to download program/batch list');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import students');
      }

      setResult(data);
      if (data.success > 0) {
        toast.success(
          `Successfully imported ${data.success} student(s)`
        );
      }
      if (data.failed > 0) {
        toast.warning(
          `Failed to import ${data.failed} student(s). Check errors below.`
        );
      }
    } catch (error) {
      console.error('Error importing students:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to import students'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
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
          <p className="text-xs text-secondary-text">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/students')}
          className="px-2 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5"
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
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-primary-text">
            Bulk Import Students
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Import multiple students from a CSV or Excel file
          </p>
        </div>
      </div>

      {/* Import Form */}
      <div className="rounded-lg border border-card-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-primary-text">Import Students</h2>
          <p className="text-xs text-secondary-text mt-0.5">
            Upload a CSV or Excel file to import multiple students at once
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file" className="text-xs text-primary-text">Upload File *</Label>
            <div className="flex items-center gap-3">
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="flex-1 h-8 text-xs bg-card border-card-border text-primary-text placeholder:text-secondary-text focus:border-primary dark:focus:border-secondary"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadTemplate()}
                  className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5 border border-card-border bg-transparent"
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
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </button>
                <button
                  type="button"
                  onClick={downloadProgramBatchList}
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
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download Program & Batch List
                </button>
              </div>
            </div>
            <p className="text-xs text-secondary-text">
              Supported formats: CSV, Excel (.xlsx). Use exact names from reference lists below.
              Template automatically includes actual database names.
            </p>
            {departments.length > 0 && programs.length > 0 && (
              <div className="mt-2 p-2 rounded border border-card-border bg-card/50">
                <p className="text-xs text-primary-text font-semibold mb-1">Quick Reference - Use These Exact Names:</p>
                <div className="text-xs text-secondary-text space-y-0.5">
                  <p><span className="font-medium text-primary-text">Department:</span> "{departments[0]?.name}" or "{departments[0]?.code}"</p>
                  <p><span className="font-medium text-primary-text">Program:</span> "{programs[0]?.name}" or "{programs[0]?.code}"</p>
                  {batches.length > 0 && <p><span className="font-medium text-primary-text">Batch:</span> "{batches[0]?.name}" or "{batches[0]?.code || 'N/A'}"</p>}
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-4">
              <div className="rounded-lg border border-card-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle 
                    className="w-4 h-4 mt-0.5" 
                    style={{ color: result.failed > 0 ? 'var(--error)' : primaryColor }}
                  />
                  <div className="space-y-2 flex-1">
                    <div className="text-xs text-primary-text">
                      <span className="font-semibold">Success:</span> {result.success} student(s) imported
                    </div>
                    {result.failed > 0 && (
                      <div className="text-xs text-primary-text">
                        <span className="font-semibold">Failed:</span> {result.failed} student(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-primary-text">Errors:</h3>
                  <div className="max-h-60 overflow-y-auto border border-card-border rounded-lg p-4 bg-card">
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {result.errors.map((error, index) => (
                        <li key={index} style={{ color: 'var(--error)' }}>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/admin/students')}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border border-card-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{
                backgroundColor: loading || !file ? (isDarkMode ? '#6b7280' : '#9ca3af') : primaryColor,
              }}
              onMouseEnter={(e) => {
                if (!loading && file) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && file) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Import Students
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reference Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Departments */}
        <div className="rounded-lg border border-card-border bg-card p-4">
          <h3 className="text-xs font-bold text-primary-text mb-3">Departments Reference</h3>
          {loadingRefs ? (
            <div className="text-xs text-secondary-text">Loading...</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-semibold text-primary-text">ID</TableHead>
                    <TableHead className="text-[10px] font-semibold text-primary-text">Name</TableHead>
                    <TableHead className="text-[10px] font-semibold text-primary-text">Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-xs text-secondary-text text-center py-4">
                        No departments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.id} className="hover:bg-hover-bg transition-colors">
                        <TableCell className="text-xs text-primary-text">{dept.id}</TableCell>
                        <TableCell className="text-xs text-primary-text">{dept.name}</TableCell>
                        <TableCell className="text-xs text-secondary-text">{dept.code}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Programs */}
        <div className="rounded-lg border border-card-border bg-card p-4">
          <h3 className="text-xs font-bold text-primary-text mb-3">Programs Reference</h3>
          {loadingRefs ? (
            <div className="text-xs text-secondary-text">Loading...</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-semibold text-primary-text">ID</TableHead>
                    <TableHead className="text-[10px] font-semibold text-primary-text">Name</TableHead>
                    <TableHead className="text-[10px] font-semibold text-primary-text">Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-xs text-secondary-text text-center py-4">
                        No programs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    programs.map((prog) => (
                      <TableRow key={prog.id} className="hover:bg-hover-bg transition-colors">
                        <TableCell className="text-xs text-primary-text">{prog.id}</TableCell>
                        <TableCell className="text-xs text-primary-text">{prog.name}</TableCell>
                        <TableCell className="text-xs text-secondary-text">{prog.code}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Batches */}
        <div className="rounded-lg border border-card-border bg-card p-4">
          <h3 className="text-xs font-bold text-primary-text mb-3">Batches Reference</h3>
          {loadingRefs ? (
            <div className="text-xs text-secondary-text">Loading...</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-semibold text-primary-text">ID</TableHead>
                    <TableHead className="text-[10px] font-semibold text-primary-text">Name</TableHead>
                    <TableHead className="text-[10px] font-semibold text-primary-text">Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-xs text-secondary-text text-center py-4">
                        No batches found
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.map((batch) => (
                      <TableRow key={batch.id} className="hover:bg-hover-bg transition-colors">
                        <TableCell className="text-xs text-primary-text">{batch.id}</TableCell>
                        <TableCell className="text-xs text-primary-text">{batch.name}</TableCell>
                        <TableCell className="text-xs text-secondary-text">{batch.code || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* CSV Format Requirements */}
      <div className="rounded-lg border border-card-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-primary-text">CSV Format Requirements</h2>
          <p className="text-xs text-secondary-text mt-0.5">
            Your CSV file must include the following columns. Use names instead of IDs for easier import:
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold text-primary-text">Column Name</TableHead>
                <TableHead className="text-xs font-semibold text-primary-text">Required</TableHead>
                <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">firstName</TableCell>
                <TableCell className="text-xs text-primary-text">Yes</TableCell>
                <TableCell className="text-xs text-secondary-text">Student's first name</TableCell>
              </TableRow>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">lastName</TableCell>
                <TableCell className="text-xs text-primary-text">Yes</TableCell>
                <TableCell className="text-xs text-secondary-text">Student's last name</TableCell>
              </TableRow>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">email</TableCell>
                <TableCell className="text-xs text-primary-text">Yes</TableCell>
                <TableCell className="text-xs text-secondary-text">Unique email address</TableCell>
              </TableRow>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">role</TableCell>
                <TableCell className="text-xs text-primary-text">Yes</TableCell>
                <TableCell className="text-xs text-secondary-text">User role (use "student" for students)</TableCell>
              </TableRow>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">rollNumber</TableCell>
                <TableCell className="text-xs text-primary-text">Yes</TableCell>
                <TableCell className="text-xs text-secondary-text">Unique roll number</TableCell>
              </TableRow>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">departmentName</TableCell>
                <TableCell className="text-xs text-primary-text">Yes</TableCell>
                <TableCell className="text-xs text-secondary-text">Department name or code (see reference list above)</TableCell>
              </TableRow>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">programName</TableCell>
                <TableCell className="text-xs text-primary-text">Yes</TableCell>
                <TableCell className="text-xs text-secondary-text">Program name or code (see reference list above)</TableCell>
              </TableRow>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">batchName</TableCell>
                <TableCell className="text-xs text-primary-text">No</TableCell>
                <TableCell className="text-xs text-secondary-text">Batch name or code (optional, see reference list above)</TableCell>
              </TableRow>
              <TableRow className="hover:bg-hover-bg transition-colors">
                <TableCell className="text-xs font-medium text-primary-text">status</TableCell>
                <TableCell className="text-xs text-primary-text">No</TableCell>
                <TableCell className="text-xs text-secondary-text">active or inactive (default: active)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

