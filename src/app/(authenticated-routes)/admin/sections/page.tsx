import { Metadata } from 'next';
import { SectionsTable } from '@/components/sections/sections-table';
import { CreateSectionDialog } from '@/components/sections/create-section-dialog';

export const metadata: Metadata = {
  title: 'Sections Management',
  description: 'Manage course sections',
};

export default async function SectionsPage() {
  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold'>Sections Management</h1>
        <CreateSectionDialog />
      </div>
      <SectionsTable />
    </div>
  );
}
