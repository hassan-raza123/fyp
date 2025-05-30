import React from 'react';

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='max-w-6xl mx-auto'>{children}</div>;
}
