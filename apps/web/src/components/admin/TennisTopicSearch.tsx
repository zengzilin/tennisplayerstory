// @ts-nocheck

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, TrendingUp, Loader2, CheckSquare } from 'lucide-react';

const TennisTopicSearch = ({ onSearch, isSearching, topics, selectedTopics, onToggleTopic, onSelectAll }) => {
  const allSelected = topics.length > 0 && selectedTopics.length === topics.length;

  return (
    <Card className="border-border shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Discover Topics
        </CardTitle>
        <CardDescription>Use AI to find trending tennis topics with high SEO potential</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={onSearch} 
          disabled={isSearching} 
          className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
        >
          {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
          {isSearching ? 'Analyzing Trends...' : 'Scan Trending Topics'}
        </Button>

        {topics.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-sm font-semibold">Results ({topics.length})</h3>
              <Button variant="ghost" size="sm" onClick={() => onSelectAll(!allSelected)} className="h-8 text-xs">
                <CheckSquare className="h-3 w-3 mr-1" />
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto admin-scroll pr-2">
              {topics.map((topic, idx) => {
                const isSelected = selectedTopics.includes(topic.topic);
                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isSelected ? 'border-primary/50 bg-primary/5' : 'border-border bg-card dark:bg-slate-900/50'}`}
                  >
                    <Checkbox 
                      id={`topic-${idx}`} 
                      checked={isSelected}
                      onCheckedChange={() => onToggleTopic(topic.topic)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1 cursor-pointer" onClick={() => onToggleTopic(topic.topic)}>
                      <div className="flex justify-between items-start">
                        <label htmlFor={`topic-${idx}`} className="font-semibold text-sm cursor-pointer">{topic.topic}</label>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${topic.relevance_score >= 8 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {topic.relevance_score}/10
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                      <p className="text-[10px] text-muted-foreground/70 font-medium tracking-wide">
                        Vol: {topic.result_count?.toLocaleString() || '10k+'} searches
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TennisTopicSearch;
