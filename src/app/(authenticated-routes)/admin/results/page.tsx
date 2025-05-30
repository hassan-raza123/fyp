import React from 'react';
import Link from 'next/link';

const ResultsPage = () => {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>Student Results Management</h1>
      {/* TODO: List course offerings, sections, and provide navigation to marks entry and result evaluation */}
      <p>Select a course offering and section to manage student results.</p>
      <div className='flex gap-4 mt-6'>
        <Link
          href='/admin/results/marks-entry'
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          Marks Entry
        </Link>
        <Link
          href='/admin/results/result-evaluation'
          className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
        >
          Result Evaluation
        </Link>
      </div>
    </div>
  );
};

export default ResultsPage;
