import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  children,
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-all duration-200 ease-in-out transform focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50 disabled:pointer-events-none active:scale-95",
        {
          "bg-[var(--color-green-default)] text-white hover:bg-green-700 hover:scale-[1.02]": variant === 'primary',
          "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-hover)] hover:scale-[1.02]": variant === 'secondary',
          "bg-[var(--color-red-default)] text-white hover:bg-red-700 hover:scale-[1.02]": variant === 'danger',
          "hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] hover:scale-[1.02]": variant === 'ghost',
          "h-8 px-3 text-xs": size === 'sm',
          "h-10 px-4 py-2 text-sm": size === 'md',
          "h-12 px-6 py-3 text-base": size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

