
import React from 'react';
import { Button } from '@/components/ui/button';

const FilterBar = ({ options, activeFilter, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={activeFilter === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(option.value)}
          className="transition-all duration-200"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

export default FilterBar;
