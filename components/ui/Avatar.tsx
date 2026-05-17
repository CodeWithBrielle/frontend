import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  fallback: string;
}

export function Avatar({ fallback, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-text)] font-medium",
        className
      )}
      {...props}
    >
      {fallback}
    </div>
  );
}
