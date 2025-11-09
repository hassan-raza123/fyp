'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BulkImportStudentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

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

  const downloadTemplate = () => {
    const csvContent = `firstName,lastName,email,rollNumber,departmentId,programId,batchId,status
John,Doe,john.doe@example.com,STU001,1,1,1,active
Jane,Smith,jane.smith@example.com,STU002,1,1,1,active`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded');
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

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/students')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Bulk Import Students</h1>
          <p className="text-muted-foreground">
            Import multiple students from a CSV or Excel file
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Students</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Upload File *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Supported formats: CSV, Excel (.xlsx). File must include:
                firstName, lastName, email, rollNumber, departmentId,
                programId, batchId, status
              </p>
            </div>

            {result && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        <strong>Success:</strong> {result.success} student(s)
                        imported
                      </p>
                      {result.failed > 0 && (
                        <p>
                          <strong>Failed:</strong> {result.failed} student(s)
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Errors:</h3>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {result.errors.map((error, index) => (
                          <li key={index} className="text-red-600">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/students')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!file || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Students
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your CSV file must include the following columns:
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">firstName</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Student's first name</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">lastName</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Student's last name</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">email</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Unique email address</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">rollNumber</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Unique roll number</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">departmentId</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Department ID (number)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">programId</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Program ID (number)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">batchId</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Batch ID (number)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">status</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>active or inactive (default: active)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

