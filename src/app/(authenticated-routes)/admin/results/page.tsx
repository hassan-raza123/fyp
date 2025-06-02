import React from 'react';
import Link from 'next/link';
import { FileCheck, BarChart3, ClipboardCheck, Target } from 'lucide-react';

const ResultsPage = () => {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Student Results Management</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Marks Entry Card */}
        <Link
          href='/admin/results/marks-entry'
          className='p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'
        >
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-blue-100 rounded-full'>
              <FileCheck className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold mb-2'>Marks Entry</h2>
              <p className='text-gray-600'>
                Enter and manage student assessment marks
              </p>
            </div>
          </div>
        </Link>

        {/* Result Evaluation Card */}
        <Link
          href='/admin/results/result-evaluation'
          className='p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'
        >
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-green-100 rounded-full'>
              <ClipboardCheck className='h-6 w-6 text-green-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold mb-2'>Result Evaluation</h2>
              <p className='text-gray-600'>
                Review and evaluate student results
              </p>
            </div>
          </div>
        </Link>

        {/* Analytics Card */}
        <Link
          href='/admin/results/analytics'
          className='p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'
        >
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-purple-100 rounded-full'>
              <BarChart3 className='h-6 w-6 text-purple-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold mb-2'>Analytics</h2>
              <p className='text-gray-600'>
                View performance metrics and grade distribution
              </p>
            </div>
          </div>
        </Link>

        {/* CLO Attainments Card */}
        <Link
          href='/admin/results/clo-attainments'
          className='p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'
        >
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-orange-100 rounded-full'>
              <Target className='h-6 w-6 text-orange-600' />
            </div>
            <div>
              <h2 className='text-xl font-semibold mb-2'>CLO Attainments</h2>
              <p className='text-gray-600'>
                Calculate and analyze CLO achievement percentages
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className='mt-8 bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          <Link
            href='/admin/results/marks-entry'
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center'
          >
            Bulk Marks Entry
          </Link>
          <Link
            href='/admin/results/result-evaluation'
            className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center'
          >
            Result Moderation
          </Link>
          <Link
            href='/admin/results/clo-attainments'
            className='px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-center'
          >
            CLO Attainments
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
