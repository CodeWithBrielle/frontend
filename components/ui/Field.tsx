import React from 'react';
import { cn } from '@/lib/utils';

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, className, children, ...props }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <label className="text-sm font-medium leading-none text-[var(--color-text-primary)]">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[13px] text-[var(--color-red-text)]">{error}</p>
      )}
    </div>
  );
}
