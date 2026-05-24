// @ts-nocheck

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';

const AIArticleGenerator = ({ selectedTopics, onGenerate, isGenerating }) => {
  return (
    <Card className="border-border shadow-sm dark:bg-slate-800 dark:border-slate-700 bg-gradient-to-br from-background to-secondary/5 dark:from-slate-800 dark:to-slate-800/80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          Single Generation
        </CardTitle>
        <CardDescription>Generate a comprehensive article from a selected topic.</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedTopics.length === 0 ? (
          <div className="text-center p-6 border border-dashed rounded-lg bg-background/50">
            <p className="text-sm text-muted-foreground">Select a topic from the search results above to generate an article.</p>
          </div>
        ) : selectedTopics.length > 1 ? (
          <div className="text-center p-6 border border-dashed rounded-lg bg-background/50">
            <p className="text-sm text-muted-foreground">Multiple topics selected. Please use the Batch Generation tab instead.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-lg border shadow-sm">
              <h4 className="text-sm font-semibold mb-1">Selected Topic:</h4>
              <p className="text-sm text-muted-foreground">{selectedTopics[0]}</p>
            </div>
            <Button 
              onClick={() => onGenerate(selectedTopics[0])} 
              disabled={isGenerating}
              className="w-full shadow-md"
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isGenerating ? 'Writing Article...' : 'Generate Article'}
              {!isGenerating && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIArticleGenerator;
