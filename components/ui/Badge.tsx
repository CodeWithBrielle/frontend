import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-[var(--color-subtle)] text-[var(--color-text-secondary)]": variant === 'default',
          "bg-[var(--color-green-soft)] text-[var(--color-green-text)]": variant === 'success',
          "bg-[var(--color-amber-soft)] text-[var(--color-amber-text)]": variant === 'warning',
          "bg-[var(--color-red-soft)] text-[var(--color-red-text)]": variant === 'danger',
        },
        className
      )}
      {...props}
    />
  );
}
