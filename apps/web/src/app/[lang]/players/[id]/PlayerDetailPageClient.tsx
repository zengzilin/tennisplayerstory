"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowLeft, CalendarDays, Trophy, UserRound, BarChart3 } from 'lucide-react';
import { usePlayerDetail } from '@/hooks/usePlayerData';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const localizedRouteNames: Record<string, Record<LangCode, string>> = {
  players: { en: 'players', zh: '球员', ja: 'プレイヤー', es: 'jugadores', fr: 'joueurs' },
};

interface PlayerDetailPageClientProps {
  lang: LangCode;
  playerId: string;
}

const PlayerDetailPageClient = ({ lang, playerId }: PlayerDetailPageClientProps) => {
  const t = useTranslations('playerDetail');
  const { player, loading, error } = usePlayerDetail(playerId);

  const playersPath = `/${lang}/${localizedRouteNames.players[lang]}`;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href={playersPath}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToPlayers')}
            </Link>

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
                  {t('heroDesc', { country: player.country, source: player.sourceLabel })}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold">{t('notFoundTitle')}</h1>
                <p className="text-lg text-primary-foreground/90">{t('notFoundDesc')}</p>
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
                    <CardTitle>{t('overview')}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Trophy className="h-4 w-4" />
                        <span>{t('currentRanking')}</span>
                      </div>
                      <p className="text-3xl font-bold">{player.rankingDisplay}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <BarChart3 className="h-4 w-4" />
                        <span>{t('points')}</span>
                      </div>
                      <p className="text-3xl font-bold">{player.pointsDisplay}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <UserRound className="h-4 w-4" />
                        <span>{t('country')}</span>
                      </div>
                      <p className="text-lg font-semibold">{player.country}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <UserRound className="h-4 w-4" />
                        <span>{t('age')}</span>
                      </div>
                      <p className="text-lg font-semibold">{player.ageDisplay}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Trophy className="h-4 w-4" />
                        <span>{t('tour')}</span>
                      </div>
                      <p className="text-lg font-semibold">{player.sourceLabel}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <CalendarDays className="h-4 w-4" />
                        <span>{t('lastUpdated')}</span>
                      </div>
                      <p className="text-lg font-semibold">{player.lastUpdatedDisplay}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('resources')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {player.profileUrl ? (
                        <Button asChild className="w-full">
                          <a href={player.profileUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('openProfile')}
                          </a>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('noProfile')}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('recentResults')}</CardTitle>
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
                        <p className="text-sm text-muted-foreground">{t('noRecentResults')}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold mb-3">{t('notFoundTitle')}</h2>
                <p className="text-muted-foreground mb-6">{error ? t('loadError') : t('notFoundDesc')}</p>
                <Button asChild>
                  <Link href={playersPath}>{t('backToPlayers')}</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlayerDetailPageClient;
