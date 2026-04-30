import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

const TagFilter = ({ tags, selectedTag, onTagSelect }) => {
  const { t } = useTranslation();

  return (
    <ScrollArea className="w-full whitespace-nowrap mb-8">
      <div className="flex w-max space-x-2 p-1">
        <Button
          variant={selectedTag === 'All' ? 'default' : 'outline'}
          onClick={() => onTagSelect('All')}
          className="rounded-full transition-all"
        >
          {t('stories.allTags', 'All Tags')}
        </Button>
        {tags.map(tag => (
          <Button
            key={tag}
            variant={selectedTag === tag ? 'default' : 'outline'}
            onClick={() => onTagSelect(tag)}
            className="rounded-full transition-all"
          >
            {tag}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default TagFilter;