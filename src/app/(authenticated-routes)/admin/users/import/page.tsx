'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function BulkImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import users');
      }

      const data = await response.json();
      toast.success(`Successfully imported ${data.success} users`);
      router.push('/admin/users');
    } catch (error) {
      console.error('Error importing users:', error);
      toast.error('Failed to import users');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const template = [
      [
        'firstName',
        'lastName',
        'email',
        'role',
        'departmentId',
        'programId',
        'employeeId',
        'rollNumber',
      ],
      ['John', 'Doe', 'john@example.com', 'teacher', '1', '', 'EMP001', ''],
      ['Jane', 'Smith', 'jane@example.com', 'student', '1', '1', '', 'STU001'],
    ];

    const csvContent = template.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className='container mx-auto py-10'>
      <Card>
        <CardHeader>
          <CardTitle>Bulk Import Users</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Please ensure your CSV file follows the template format. Download
              the template below for reference.
            </AlertDescription>
          </Alert>

          <div className='space-y-4'>
            <div className='flex items-center gap-4'>
              <Button variant='outline' onClick={downloadTemplate}>
                <Download className='w-4 h-4 mr-2' />
                Download Template
              </Button>
            </div>

            <div className='flex items-center gap-4'>
              <input
                type='file'
                accept='.csv'
                onChange={handleFileChange}
                className='hidden'
                id='file-upload'
              />
              <label htmlFor='file-upload'>
                <Button variant='outline' asChild>
                  <span>
                    <FileUp className='w-4 h-4 mr-2' />
                    Select File
                  </span>
                </Button>
              </label>
              {file && (
                <span className='text-sm text-muted-foreground'>
                  {file.name}
                </span>
              )}
            </div>

            <div className='flex justify-end gap-4'>
              <Button
                variant='outline'
                onClick={() => router.push('/admin/users')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || isLoading}>
                {isLoading ? 'Importing...' : 'Import Users'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
