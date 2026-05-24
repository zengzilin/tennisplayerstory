// @ts-nocheck

import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import BreadcrumbNav from '@/components/BreadcrumbNav.tsx';
import { useRankingData } from '@/hooks/useRankingData.js';
import { useRankingFilters } from '@/hooks/useRankingFilters.js';
import TrendIndicator from '@/components/TrendIndicator.tsx';
import CountryFlag from '@/components/CountryFlag.tsx';
import RankBadge from '@/components/RankBadge.tsx';
import { TableSkeleton, CardListSkeleton } from '@/components/LoadingSkeletons.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Trophy, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/structuredData.js';

const RankingsPage = () => {
  const { rankings, loading } = useRankingData();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const langPrefix = `/${currentLanguage}`;

  const { search, setSearch, source, setSource, sortBy, setSortBy, page, setPage, totalPages, filteredData, totalResults } = useRankingFilters(rankings.atp, rankings.wta);

  const breadcrumbItems = [
    { name: 'Home', path: langPrefix },
    { name: 'Rankings', path: `${langPrefix}/rankings` }
  ];
  const structuredData = [generateBreadcrumbSchema(breadcrumbItems)];

  return (
    <>
      <SEOHelmet 
        pageKey="rankings"
        url="/rankings"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main id="main-content" className="flex-1 pb-20">
          <section className="bg-primary pt-10 pb-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-overlay" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <BreadcrumbNav items={breadcrumbItems} />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-primary-foreground mb-6">
                  {t('rankings.title', 'Global Tennis Rankings')}
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
                  {t('rankings.desc', 'Up-to-date ATP and WTA tour rankings. Track the world\'s best professional tennis players.')}
                </p>
              </motion.div>
            </div>
          </section>

          <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
            <div className="bg-card rounded-2xl shadow-lg border border-border p-4 md:p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <Input 
                    type="search"
                    placeholder={t('rankings.search', 'Search players by name...')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10 h-12 bg-background border-input text-foreground"
                    aria-label="Search tennis players"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Select value={source} onValueChange={(v) => { setSource(v); setPage(1); }}>
                    <SelectTrigger className="w-32 h-12 bg-background" aria-label="Filter by Tour">
                      <SelectValue placeholder="Tour" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('rankings.all', 'All Tours')}</SelectItem>
                      <SelectItem value="atp">ATP (Men)</SelectItem>
                      <SelectItem value="wta">WTA (Women)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
                    <SelectTrigger className="w-40 h-12 bg-background" aria-label="Sort options">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rank">{t('rankings.sortOptions.rank', 'By Rank')}</SelectItem>
                      <SelectItem value="points">{t('rankings.sortOptions.points', 'By Points')}</SelectItem>
                      <SelectItem value="name">{t('rankings.sortOptions.name', 'By Name')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-8">
                <div className="hidden md:block"><TableSkeleton rows={10} /></div>
                <div className="block md:hidden"><CardListSkeleton count={10} /></div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Results</h3>
                <p className="text-muted-foreground">{t('rankings.empty', 'No players found matching your criteria.')}</p>
                <Button variant="outline" className="mt-6" onClick={() => { setSearch(''); setSource('all'); setSortBy('rank'); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-20 text-center font-bold text-foreground">Rank</TableHead>
                        <TableHead className="font-bold text-foreground">Player Name</TableHead>
                        <TableHead className="font-bold text-foreground">Country</TableHead>
                        <TableHead className="font-bold text-foreground text-right">Points</TableHead>
                        <TableHead className="font-bold text-foreground text-center">Trend</TableHead>
                        <TableHead className="font-bold text-foreground text-right">Tour</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredData.map((player, index) => (
                          <motion.tr 
                            key={`${player.source}-${player.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            className="group hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                          >
                            <TableCell className="text-center font-medium">
                              <RankBadge rank={player.position} />
                            </TableCell>
                            <TableCell>
                              <Link to={`${langPrefix}/players`} className="font-semibold text-foreground group-hover:text-primary transition-colors" aria-label={`View ${player.name} profile`}>
                                {player.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <CountryFlag country={player.country} />
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium text-foreground">
                              {player.points?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center"><TrendIndicator trend={player.trend || 'same'} /></div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary uppercase tracking-wider">
                                {player.source}
                              </span>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                <div className="grid md:hidden gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((player, index) => (
                      <motion.div
                        key={`mob-${player.source}-${player.id}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col gap-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RankBadge rank={player.position} />
                            <div>
                              <Link to={`${langPrefix}/players`} className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                                {player.name}
                              </Link>
                              <div className="mt-1">
                                <CountryFlag country={player.country} />
                              </div>
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary uppercase">
                            {player.source}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
                            <span className="font-mono font-bold text-foreground">{player.points?.toLocaleString() || '-'} pts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Trend</span>
                            <TrendIndicator trend={player.trend || 'same'} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-8">
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalResults)} of {totalResults} players
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <span className="text-sm font-medium mx-4 sm:mx-2 text-foreground" aria-live="polite">
                        Page {page} of {totalPages}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="py-16 bg-muted/20 border-t border-border mt-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <article className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
                <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Understanding Professional Tennis Rankings</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The world of professional tennis is driven by the rigorous global <strong>tennis rankings</strong> maintained by the ATP (Association of Tennis Professionals) and the WTA (Women's Tennis Association). These rankings are vital for determining tournament seedings, direct entry qualifications, and player legacies. Our platform aggregates these live standings, offering fans a transparent view of how their favorite <strong>professional tennis players</strong> are performing throughout the season.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Points are accumulated over a rolling 52-week period. Grand Slams, Masters 1000s, and Premier events offer the highest point bounties, creating fierce competition at the top of the leaderboard. Keeping a close eye on the rankings helps you predict potential upsets, recognize surging young talents, and track the historical dominance of established veterans.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Use our interactive search and filtering tools above to isolate the men's and women's tours, search for specific athletes, or sort by current points. Want deeper insights? Head over to our <Link to={`${langPrefix}/players`} className="text-primary hover:underline">Player Profiles</Link> to explore detailed match statistics and biographies.
                </p>
              </article>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default RankingsPage;
