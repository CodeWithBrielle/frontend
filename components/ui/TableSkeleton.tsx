import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface TableSkeletonProps {
  headers: string[];
  rows?: number;
}

export function TableSkeleton({ headers, rows = 5 }: TableSkeletonProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                {headers.map((header, i) => (
                  <th key={i} className="py-3 px-4 font-medium">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-[var(--color-border-subtle)]">
                  {headers.map((_, colIdx) => (
                    <td key={colIdx} className="py-3 px-4">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
