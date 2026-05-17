import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-[var(--color-text-secondary)]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)] mb-4" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
