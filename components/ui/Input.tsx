import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-input-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      {...props}
    />
  );
}
