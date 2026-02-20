'use client';

import { LLOPLOMappingList } from '@/components/llo-plo-mapping/LLOPLOMappingList';

export default function LLOPLOMappingsPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">LLO-PLO Mappings</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage mappings between Lab Learning Outcomes (LLO) and Program
            Learning Outcomes (PLO)
          </p>
        </div>
      </div>

      <LLOPLOMappingList />
    </div>
  );
}
