'use client';

import { CLOPLOMappingList } from '@/components/clo-plo-mapping/CLOPLOMappingList';

export default function CLOPLOMappingsPage() {
  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-bold text-primary-text'>CLO-PLO Mappings</h1>
          <p className='text-xs text-secondary-text mt-0.5'>
            Manage mappings between Course Learning Outcomes (CLO) and Program
            Learning Outcomes (PLO)
          </p>
        </div>
      </div>

      <CLOPLOMappingList />
    </div>
  );
}
