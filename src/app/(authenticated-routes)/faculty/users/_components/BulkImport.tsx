'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Download, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ImportedUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: 'valid' | 'invalid';
  errors?: string[];
}

const BulkImport = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // TODO: Parse CSV/Excel file and validate data
      // This is a mock implementation
      setPreviewData([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'teacher',
          department: 'Computer Science',
          status: 'valid',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'student',
          department: 'Mathematics',
          status: 'valid',
        },
        {
          firstName: 'Invalid',
          lastName: 'User',
          email: 'invalid',
          role: 'invalid_role',
          department: '',
          status: 'invalid',
          errors: ['Invalid email', 'Invalid role'],
        },
      ]);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to import users
      console.log('Importing users:', previewData);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error importing users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // TODO: Implement template download
    console.log('Downloading template...');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <Upload className='w-4 h-4 mr-2' />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
          <DialogDescription>
            Import multiple users at once using a CSV or Excel file. Download
            the template below to get started.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Import File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-4'>
                <Button
                  variant='outline'
                  onClick={() => document.getElementById('importFile')?.click()}
                >
                  <Upload className='w-4 h-4 mr-2' />
                  Select File
                </Button>
                <input
                  id='importFile'
                  type='file'
                  accept='.csv,.xlsx,.xls'
                  className='hidden'
                  onChange={handleFileChange}
                />
                <Button variant='outline' onClick={downloadTemplate}>
                  <Download className='w-4 h-4 mr-2' />
                  Download Template
                </Button>
              </div>
              {file && (
                <div className='mt-4'>
                  <p className='text-sm text-muted-foreground'>
                    Selected file: {file.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          {user.status === 'valid' ? (
                            <Badge variant='success'>
                              <Check className='w-3 h-3 mr-1' />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant='destructive'>
                              <X className='w-3 h-3 mr-1' />
                              Invalid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || previewData.length === 0}
          >
            {isLoading ? 'Importing...' : 'Import Users'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImport;
