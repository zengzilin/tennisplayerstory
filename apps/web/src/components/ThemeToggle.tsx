// @ts-nocheck

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={cycleTheme} 
            aria-label="Toggle theme"
            className="relative h-9 w-9 rounded-full bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === 'light' ? 'Light' : 'Dark'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ThemeToggle;
