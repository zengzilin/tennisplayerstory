// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import PlayerCard from '@/components/PlayerCard.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { usePlayerData } from '@/hooks/usePlayerData.js';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, RefreshCw, Users, Search, X } from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/structuredData.js';

const PlayersPage = () => {
  const { players, loading, error, refetch } = usePlayerData();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filterOptions = [
    { value: 'all', label: t('players.filters.all', 'All Players') },
    { value: 'atp', label: t('players.filters.atp', 'ATP') },
    { value: 'wta', label: t('players.filters.wta', 'WTA') }
  ];

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                         (player.country && player.country.toLowerCase().includes(debouncedSearch.toLowerCase()));

    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && player.source === activeFilter;
  });

  const structuredData = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Players', path: '/players' }
  ]);

  return (
    <>
      <SEOHelmet 
        pageKey="players"
        url="/players"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1">
          <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-20 pointer-events-none"></div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-4xl mx-auto text-center"
              >
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 text-balance font-serif">
                  World-Class Tennis Players
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 leading-relaxed max-w-2xl mx-auto">
                  {t('players.desc', 'Discover the legends of the court. Browse rankings, stats, and biographies of top athletes across ATP and WTA tours.')}
                </p>
                
                <div className="max-w-2xl mx-auto bg-background/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/50" />
                    <Input 
                      type="text"
                      placeholder="Search by name or country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-10 h-12 bg-background/20 border-transparent text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-white/30 rounded-xl text-lg"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="flex flex-wrap justify-center gap-2 mb-12">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setActiveFilter(option.value)}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                      activeFilter === option.value 
                        ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {error ? (
                <div className="text-center py-20 px-4 border border-dashed border-destructive/30 rounded-2xl bg-destructive/5 max-w-2xl mx-auto">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4 opacity-80" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Failed to load players</h3>
                  <p className="text-muted-foreground mb-6">
                    {error}
                  </p>
                  <Button onClick={refetch} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="space-y-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                      <Skeleton className="aspect-video w-full rounded-xl bg-muted/50" />
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-6 w-1/2 bg-muted/50" />
                          <Skeleton className="h-6 w-12 bg-muted/50" />
                        </div>
                        <Skeleton className="h-4 w-1/3 bg-muted/50" />
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                          <Skeleton className="h-10 w-full bg-muted/50" />
                          <Skeleton className="h-10 w-full bg-muted/50" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPlayers.length > 0 ? (
                <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredPlayers.map((player, index) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
                      >
                        <PlayerCard player={player} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24 px-4 border border-dashed border-border rounded-3xl bg-muted/20 max-w-3xl mx-auto"
                >
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-2xl font-semibold mb-3 text-foreground font-serif">No players found</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                    {t('players.empty', "We couldn't find any players matching your current search and filter criteria.")}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                    }}
                    className="rounded-full px-8"
                  >
                    Clear all filters
                  </Button>
                </motion.div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PlayersPage;
