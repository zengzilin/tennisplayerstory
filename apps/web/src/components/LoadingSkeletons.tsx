// @ts-nocheck
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const TableSkeleton = ({ rows = 10 }) => {
  return (
    <div className="space-y-4 w-full" aria-busy="true" aria-label="Loading rankings data">
      <div className="flex justify-between items-center bg-muted/50 p-4 rounded-t-xl border-b border-border">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between items-center p-4 border-b border-border/50">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
};

export const CardListSkeleton = ({ count = 5 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 w-full" aria-busy="true" aria-label="Loading ranking cards">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col bg-card border border-border p-4 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-5 w-48" />
          <div className="flex justify-between pt-4 border-t border-border/50">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};