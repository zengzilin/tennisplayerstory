// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import PlayerCard from '@/components/PlayerCard.tsx';
import SearchBar from '@/components/SearchBar.jsx';
import FilterBar from '@/components/FilterBar.jsx';
import { usePlayerData } from '@/hooks/usePlayerData.js';
import { Skeleton } from '@/components/ui/skeleton';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const PlayersPageClient = ({ lang }: { lang: LangCode }) => {
  const { players, loading } = usePlayerData();
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filterOptions = [
    { value: 'all', label: t('players.filters.all') },
    { value: 'atp', label: t('players.filters.atp') },
    { value: 'wta', label: t('players.filters.wta') }
  ];

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.country.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'wta') return matchesSearch && player.source === 'wta';
    if (activeFilter === 'atp') return matchesSearch && player.source === 'atp';

    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>
                {t('players.heading')}
              </h1>
              <p className="text-lg text-primary-foreground/90 max-w-2xl">
                {t('players.desc')}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('players.searchPlaceholder')}
              />
              <FilterBar
                options={filterOptions}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <PlayerCard player={player} lang={lang} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">{t('players.empty')}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlayersPageClient;
