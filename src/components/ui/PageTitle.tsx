import React from 'react';

interface PageTitleProps {
  heading: string;
  text?: string;
  className?: string;
}

export default function PageTitle({
  heading,
  text,
  className = '',
}: PageTitleProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className='text-3xl font-bold tracking-tight'>{heading}</h1>
      {text && <p className='mt-2 text-muted-foreground'>{text}</p>}
    </div>
  );
}
