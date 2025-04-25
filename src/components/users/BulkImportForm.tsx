'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, X } from 'lucide-react';

export default function BulkImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // TODO: Parse and validate the file
      // For now, we'll just show a sample preview
      setPreviewData([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'TEACHER',
          employeeId: 'EMP001',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          role: 'STUDENT',
          rollNumber: 'STU001',
        },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // TODO: Implement file upload and processing
    console.log('File submitted:', file);
    router.push('/dashboard/users');
  };

  const downloadTemplate = () => {
    // TODO: Implement template download
    console.log('Downloading template...');
  };

  return (
    <Card className='p-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='file'>Upload File</Label>
          <div className='flex items-center gap-4'>
            <Input
              id='file'
              type='file'
              accept='.csv,.xlsx'
              onChange={handleFileChange}
              className='flex-1'
            />
            <Button
              type='button'
              variant='outline'
              onClick={downloadTemplate}
              className='flex items-center gap-2'
            >
              <Download className='h-4 w-4' />
              Download Template
            </Button>
          </div>
          <p className='text-sm text-gray-500'>
            Supported formats: CSV, Excel (.xlsx)
          </p>
        </div>

        {previewData.length > 0 && (
          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>Preview</h3>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      First Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Last Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Email
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Role
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Additional Info
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {row.firstName}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {row.lastName}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {row.email}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {row.role}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {row.employeeId || row.rollNumber}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className='rounded-md bg-red-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <X className='h-5 w-5 text-red-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  There were {errors.length} errors with your submission
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  <ul className='list-disc pl-5 space-y-1'>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/dashboard/users')}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={!file || errors.length > 0}
            className='flex items-center gap-2'
          >
            <Upload className='h-4 w-4' />
            Import Users
          </Button>
        </div>
      </form>
    </Card>
  );
}
