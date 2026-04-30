
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Layers, Play, Pause, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const BatchArticleGenerator = ({ selectedTopics, onStartBatch, isBatching, queue, completedCount }) => {
  const totalItems = queue.length + completedCount;
  const progress = totalItems === 0 ? 0 : (completedCount / totalItems) * 100;

  return (
    <Card className="border-border shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          Batch Generation
        </CardTitle>
        <CardDescription>Automatically generate and save multiple articles sequentially.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!isBatching && queue.length === 0 && completedCount === 0 ? (
          <div className="space-y-4">
            <div className="p-4 border border-dashed rounded-lg bg-muted/30">
              <p className="text-sm text-center text-muted-foreground mb-4">
                Select multiple topics from the Search tab, then click start.
              </p>
              <div className="flex justify-between items-center bg-background p-3 rounded-md border shadow-sm">
                <span className="text-sm font-medium">Selected Topics:</span>
                <span className="text-lg font-bold text-primary">{selectedTopics.length}</span>
              </div>
            </div>
            <Button 
              onClick={() => onStartBatch(selectedTopics)} 
              disabled={selectedTopics.length < 2}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Batch Process ({selectedTopics.length} items)
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span>{completedCount} / {totalItems} Completed</span>
              </div>
              <Progress value={progress} className="h-2 bg-muted dark:bg-slate-700" indicatorClassName="bg-accent" />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto admin-scroll pr-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Processing Queue</h4>
              {/* Completed items mockup for visual feedback */}
              {Array.from({ length: Math.min(completedCount, 3) }).map((_, i) => (
                <div key={`done-${i}`} className="flex items-center gap-3 p-2 rounded-md bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm truncate">Article generated & saved</span>
                </div>
              ))}
              
              {/* Current processing item */}
              {queue.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-md bg-accent/10 border border-accent/20 text-accent-foreground dark:text-accent">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Generating: {queue[0]}</p>
                    <p className="text-xs opacity-80">Calling AI agent...</p>
                  </div>
                </div>
              )}
              
              {/* Pending items */}
              {queue.slice(1).map((topic, i) => (
                <div key={`pending-${i}`} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 border border-border/50 text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2 border-current shrink-0 opacity-50" />
                  <span className="text-sm truncate">Pending: {topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {(isBatching || completedCount > 0) && (
        <CardFooter className="bg-muted/20 border-t pt-4">
          {isBatching ? (
            <p className="text-sm text-muted-foreground w-full text-center flex items-center justify-center gap-2">
               <Loader2 className="h-3 w-3 animate-spin" /> Do not close this window during batch processing.
            </p>
          ) : (
            <div className="w-full text-center">
              <p className="text-sm font-semibold text-green-600 dark:text-green-500 mb-2">Batch processing complete!</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh Dashboard</Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default BatchArticleGenerator;
