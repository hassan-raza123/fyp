import * as React from 'react';
import { cn } from '@/lib/utils';

interface FilterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Filter = React.forwardRef<HTMLDivElement, FilterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2 rounded-md border p-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Filter.displayName = 'Filter';

export { Filter };
