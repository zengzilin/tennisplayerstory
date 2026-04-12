
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import MatchCard from '@/components/MatchCard.jsx';
import FilterBar from '@/components/FilterBar.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import { useMatchData } from '@/hooks/useMatchData.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Skeleton } from '@/components/ui/skeleton';

const LiveMatchesPage = () => {
  const { matches, loading } = useMatchData();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const pageUrl = `/${currentLanguage}/live-matches`;

  const filterOptions = [
    { value: 'all', label: t('liveMatches.filters.all') },
    { value: 'live', label: t('liveMatches.filters.live') },
    { value: 'upcoming', label: t('liveMatches.filters.upcoming') },
    { value: 'completed', label: t('liveMatches.filters.completed') }
  ];

  const filteredMatches = matches.filter(match => {
    if (activeFilter === 'all') return true;
    return match.status.toLowerCase() === activeFilter;
  });

  return (
    <>
      <SEOHelmet
        title={t('liveMatches.title')}
        description={t('liveMatches.desc')}
        url={pageUrl}
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <section className="py-12 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>
                  {t('liveMatches.heading')}
                </h1>
                <p className="text-lg text-primary-foreground/90 max-w-2xl">
                  {t('liveMatches.desc')}
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <FilterBar
                  options={filterOptions}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-[200px] w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : filteredMatches.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <MatchCard match={match} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">{t('liveMatches.empty')}</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LiveMatchesPage;
