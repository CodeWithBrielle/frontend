import React from 'react';
import { PackageX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ 
  title = "No results found", 
  description = "There are no items matching your criteria." 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-subtle)]">
      <PackageX className="h-10 w-10 text-[var(--color-text-disabled)] mb-4" />
      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  );
}
