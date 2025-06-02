import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className='flex flex-col items-center justify-center py-8 space-y-4'>
      <Loader2 className='h-8 w-8 animate-spin text-primary' />
      <p className='text-muted-foreground'>{message}</p>
    </div>
  );
};
