// @ts-nocheck
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import Header from '@/components/Header.tsx';
import RankingDataStatus from '@/components/RankingDataStatus.tsx';
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
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/structuredData.js';
import { tennisCountryCode } from '../../../../shared/tennis-countries.mjs';

const RankingsPage = () => {
  const { rankings, loading, error, retry } = useRankingData();
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  const langPrefix = `/${currentLanguage}`;
  const listTop = useRef(null);
  const countryName = country => {
    const code = tennisCountryCode(country);
    return /^[A-Z]{2}$/.test(code) ? new Intl.DisplayNames([i18n.language], { type: 'region' }).of(code) : code;
  };
  const filters = useRankingFilters(rankings.atp, rankings.wta, countryName);
  const { search, source, sortBy, country, range, limit, page, totalPages, filteredData, totalResults } = filters;
  const text = key => t(`rankingFilters.${key}`);
  const breadcrumbItems = [{ name: t('nav.home', 'Home'), path: langPrefix }, { name: text('title'), path: `${langPrefix}/rankings` }];
  const changePage = value => {
    filters.setPage(value);
    listTop.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const selectClass = 'h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground';
  const pagination = () => (
    <nav aria-label={text('pagination')} className="flex flex-wrap items-center justify-between gap-3 py-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t('rankingFilters.results', { from: totalResults ? (page - 1) * limit + 1 : 0, to: Math.min(page * limit, totalResults), total: totalResults })}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => changePage(page - 1)} disabled={page === 1} aria-label={text('previous')}><ChevronLeft className="h-4 w-4" /></Button>
        <label className="flex items-center gap-2 text-sm">{text('page')}
          <select className="h-9 rounded-md border border-input bg-background px-2" aria-label={text('page')} value={page} onChange={event => changePage(Number(event.target.value))}>
            {Array.from({ length: totalPages }, (_, index) => <option key={index} value={index + 1}>{index + 1} / {totalPages}</option>)}
          </select>
        </label>
        <Button variant="outline" size="sm" onClick={() => changePage(page + 1)} disabled={page === totalPages} aria-label={text('next')}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </nav>
  );
  const trend = player => player.trend ? <TrendIndicator trend={player.trend} /> : <span className="text-muted-foreground">—</span>;
  return (
    <>
      <SEOHelmet pageKey="rankings" url="/rankings" structuredData={[generateBreadcrumbSchema(breadcrumbItems)]} />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main id="main-content" className="flex-1 pb-20">
          <section className="border-b border-border py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <BreadcrumbNav items={breadcrumbItems} />
              <h1 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-4">{text('title')}</h1>
              <p className="text-muted-foreground">{text('desc')}</p>
              <RankingDataStatus source={source} />
            </div>
          </section>
          <section ref={listTop} className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6 scroll-mt-24">
            <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
              <div role="tablist" aria-label={text('tour')} className="flex gap-2 mb-4">
                {['atp', 'wta'].map(tour => <Button key={tour} role="tab" aria-selected={source === tour} aria-controls="ranking-list" variant={source === tour ? 'default' : 'outline'} className="flex-1 sm:flex-none" onClick={() => filters.setSource(tour)}>{text(tour)}</Button>)}
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input type="search" placeholder={text('search')} aria-label={text('search')} value={search} onChange={event => filters.setSearch(event.target.value)} className="pl-10 h-11" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="space-y-1 text-sm">{text('range')}<select aria-label={text('range')} className={selectClass} value={range} onChange={event => filters.setRange(event.target.value)}>
                  <option value="all">{text('allRanks')}</option>{[10, 50, 100].map(value => <option key={value} value={value}>{text('top')} {value}</option>)}
                </select></label>
                <label className="space-y-1 text-sm">{text('country')}<select aria-label={text('country')} className={selectClass} value={country} onChange={event => filters.setCountry(event.target.value)}>
                  <option value="">{text('allCountries')}</option>{filters.countries.map(value => <option key={value} value={value}>{countryName(value)}</option>)}
                </select></label>
                <label className="space-y-1 text-sm">{text('sort')}<select aria-label={text('sort')} className={selectClass} value={sortBy} onChange={event => filters.setSortBy(event.target.value)}>
                  <option value="rank">{text('sortRank')}</option><option value="points">{text('sortPoints')}</option><option value="name">{text('sortName')}</option>
                </select></label>
                <label className="space-y-1 text-sm">{text('size')}<select aria-label={text('size')} className={selectClass} value={limit} onChange={event => filters.setLimit(Number(event.target.value))}>
                  {[25, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}
                </select></label>
              </div>
              {(search || country || range !== 'all' || sortBy !== 'rank') && <Button className="mt-3" variant="ghost" size="sm" onClick={filters.resetFilters}>{text('reset')}</Button>}
            </div>
            <div id="ranking-list" role="tabpanel" aria-label={text(source)}>
              {loading ? <><div className="hidden md:block mt-4"><TableSkeleton rows={10} /></div><div className="md:hidden mt-4"><CardListSkeleton count={5} /></div></> : error ?
                <div className="p-8 text-center" role="alert"><p>{text('error')}</p><Button onClick={retry} className="mt-4">{text('retry')}</Button></div> : <>
                  {pagination()}
                  {!totalResults ? <div className="rounded-xl border border-dashed p-8 text-center"><p>{text('empty')}</p><Button variant="outline" className="mt-4" onClick={filters.resetFilters}>{text('reset')}</Button></div> : <>
                    <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden"><Table>
                      <TableHeader><TableRow><TableHead className="w-20 text-center">{text('rank')}</TableHead><TableHead>{text('player')}</TableHead><TableHead>{text('country')}</TableHead><TableHead className="text-right">{text('points')}</TableHead><TableHead className="text-center">{text('trend')}</TableHead></TableRow></TableHeader>
                      <TableBody>{filteredData.map(player => <TableRow key={player.id}>
                        <TableCell className="text-center"><RankBadge rank={player.position} /></TableCell>
                        <TableCell><Link className="font-semibold hover:text-primary" to={`${langPrefix}/players`}>{player.name}</Link></TableCell>
                        <TableCell><CountryFlag country={player.country} /></TableCell><TableCell className="text-right font-mono">{player.points?.toLocaleString(i18n.language)}</TableCell><TableCell><div className="flex justify-center">{trend(player)}</div></TableCell>
                      </TableRow>)}</TableBody>
                    </Table></div>
                    <div className="grid md:hidden gap-3">{filteredData.map(player => <div key={player.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center gap-3"><RankBadge rank={player.position} /><div className="min-w-0"><Link to={`${langPrefix}/players`} className="font-semibold break-words">{player.name}</Link><CountryFlag country={player.country} /></div></div>
                      <div className="mt-3 pt-3 border-t flex justify-between text-sm"><span>{text('points')} <strong>{player.points?.toLocaleString(i18n.language)}</strong></span><span className="flex items-center gap-2">{text('trend')}{trend(player)}</span></div>
                    </div>)}</div>
                    {totalPages > 1 && pagination()}
                  </>}
                </>}
            </div>
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
