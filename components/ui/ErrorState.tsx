import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--color-text-secondary)]">
      <AlertTriangle className="h-10 w-10 text-[var(--color-red-text)] mb-4" />
      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Error</p>
      <p className="text-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>Try Again</Button>
      )}
    </div>
  );
}
