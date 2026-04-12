import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowLeft, CalendarDays, Trophy, UserRound, BarChart3 } from 'lucide-react';
import { useLanguage, buildLocalizedPath } from '@/contexts/LanguageContext.jsx';
import { usePlayerDetail } from '@/hooks/usePlayerData.js';
import { generatePersonSchema } from '@/lib/structuredData.js';

const PlayerDetailPage = () => {
  const { playerId } = useParams();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { player, loading, error } = usePlayerDetail(playerId);

  const playersPath = buildLocalizedPath(currentLanguage, 'players');
  const pageUrl = player ? buildLocalizedPath(currentLanguage, 'players', player.id) : playersPath;
  const structuredData = player ? generatePersonSchema(player, pageUrl) : null;

  return (
    <>
      <SEOHelmet
        title={player ? player.name : t('playerDetail.notFoundTitle')}
        description={player ? t('playerDetail.metaDesc', { name: player.name, source: player.sourceLabel, country: player.country }) : t('playerDetail.notFoundDesc')}
        url={pageUrl}
        type="profile"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <section className="py-12 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <Button asChild variant="secondary" className="mb-6">
                <Link to={playersPath}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('playerDetail.backToPlayers')}
                </Link>
              </Button>

              {loading ? (
                <div className="space-y-4 max-w-3xl">
                  <Skeleton className="h-12 w-72 bg-primary-foreground/20" />
                  <Skeleton className="h-6 w-96 bg-primary-foreground/20" />
                </div>
              ) : player ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="text-base font-semibold">{player.rankingDisplay}</Badge>
                    <Badge variant="secondary" className="text-base font-semibold">{player.sourceLabel}</Badge>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold" style={{ letterSpacing: '-0.02em' }}>
                    {player.name}
                  </h1>
                  <p className="text-lg text-primary-foreground/90 max-w-2xl">
                    {t('playerDetail.heroDesc', { country: player.country, source: player.sourceLabel })}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4 max-w-3xl">
                  <h1 className="text-4xl md:text-5xl font-bold">{t('playerDetail.notFoundTitle')}</h1>
                  <p className="text-lg text-primary-foreground/90">{t('playerDetail.notFoundDesc')}</p>
                </div>
              )}
            </div>
          </section>

          <section className="py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
                  <Skeleton className="h-64 w-full rounded-xl" />
                </div>
              ) : player ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>{t('playerDetail.overview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Trophy className="h-4 w-4" />
                          <span>{t('playerDetail.currentRanking')}</span>
                        </div>
                        <p className="text-3xl font-bold">{player.rankingDisplay}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <BarChart3 className="h-4 w-4" />
                          <span>{t('playerDetail.points')}</span>
                        </div>
                        <p className="text-3xl font-bold">{player.pointsDisplay}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <UserRound className="h-4 w-4" />
                          <span>{t('playerDetail.country')}</span>
                        </div>
                        <p className="text-lg font-semibold">{player.country}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <UserRound className="h-4 w-4" />
                          <span>{t('playerDetail.age')}</span>
                        </div>
                        <p className="text-lg font-semibold">{player.ageDisplay}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Trophy className="h-4 w-4" />
                          <span>{t('playerDetail.tour')}</span>
                        </div>
                        <p className="text-lg font-semibold">{player.sourceLabel}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <CalendarDays className="h-4 w-4" />
                          <span>{t('playerDetail.lastUpdated')}</span>
                        </div>
                        <p className="text-lg font-semibold">{player.lastUpdatedDisplay}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('playerDetail.resources')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {player.profileUrl ? (
                          <Button asChild className="w-full">
                            <a href={player.profileUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {t('playerDetail.openProfile')}
                            </a>
                          </Button>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t('playerDetail.noProfile')}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>{t('playerDetail.recentResults')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {player.recentResults.length > 0 ? (
                          <ul className="space-y-2">
                            {player.recentResults.map((result, index) => (
                              <li key={`${player.id}-${index}`} className="rounded-lg border border-border px-3 py-2 text-sm">
                                {result}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t('playerDetail.noRecentResults')}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <h2 className="text-2xl font-semibold mb-3">{t('playerDetail.notFoundTitle')}</h2>
                  <p className="text-muted-foreground mb-6">{error ? t('playerDetail.loadError') : t('playerDetail.notFoundDesc')}</p>
                  <Button asChild>
                    <Link to={playersPath}>{t('playerDetail.backToPlayers')}</Link>
                  </Button>
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

export default PlayerDetailPage;
