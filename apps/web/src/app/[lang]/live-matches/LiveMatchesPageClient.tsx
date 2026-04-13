'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import MatchCard from '@/components/MatchCard.jsx';
import { useMatchData } from '@/hooks/useMatchData.js';
import { Loader2, Filter } from 'lucide-react';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

interface LiveMatchesPageClientProps {
  lang: LangCode;
}

const LiveMatchesPageClient = ({ lang }: LiveMatchesPageClientProps) => {
  const t = useTranslations();
  const { matches, loading } = useMatchData();
  const [filter, setFilter] = useState<'all' | 'Live' | 'Upcoming' | 'Completed'>('all');

  const filteredMatches = filter === 'all' ? matches : matches.filter(m => m.status === filter);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'Live', label: 'Live' },
    { key: 'Upcoming', label: 'Upcoming' },
    { key: 'Completed', label: 'Completed' },
  ];

  return (
    <div className="flex-1">
      {/* Header */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('nav.liveMatches', { defaultValue: 'Live Matches' })}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {t('home.features.live.desc', { defaultValue: 'Real-time updates from matches around the globe.' })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 bg-background border-b border-border py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground mr-2" />
            {filters.map(f => (
              <Button
                key={f.key}
                variant={filter === f.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f.key as typeof filter)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Matches Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-xl text-muted-foreground">
                {t('common.noData', { defaultValue: 'No data available' })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <MatchCard match={match} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LiveMatchesPageClient;
