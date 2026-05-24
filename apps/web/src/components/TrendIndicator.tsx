// @ts-nocheck
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const TrendIndicator = ({ trend }) => {
  if (trend === 'up') {
    return (
      <div className="flex items-center justify-center text-green-500 bg-green-500/10 rounded-full h-8 w-8" aria-label="Trending up">
        <ArrowUp className="h-4 w-4" />
      </div>
    );
  }
  
  if (trend === 'down') {
    return (
      <div className="flex items-center justify-center text-destructive bg-destructive/10 rounded-full h-8 w-8" aria-label="Trending down">
        <ArrowDown className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center text-muted-foreground bg-muted rounded-full h-8 w-8" aria-label="Stable">
      <Minus className="h-4 w-4" />
    </div>
  );
};

export default TrendIndicator;