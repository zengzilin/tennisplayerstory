
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RankingRow from '@/components/RankingRow.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import { useRankingData } from '@/hooks/useRankingData.js';
import { useLanguage, buildLocalizedPath } from '@/contexts/LanguageContext.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const RankingsPage = () => {
  const { rankings, loading } = useRankingData();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('atp');
  const pageUrl = buildLocalizedPath(currentLanguage, 'rankings');

  return (
    <>
      <SEOHelmet
        title={t('rankings.title')}
        description={t('rankings.desc')}
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
                  {t('rankings.heading')}
                </h1>
                <p className="text-lg text-primary-foreground/90 max-w-2xl">
                  {t('rankings.desc')}
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                  <TabsTrigger value="atp" className="text-lg">{t('rankings.tabs.atp')}</TabsTrigger>
                  <TabsTrigger value="wta" className="text-lg">{t('rankings.tabs.wta')}</TabsTrigger>
                </TabsList>

                <TabsContent value="atp">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="rounded-xl border border-border overflow-hidden"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="font-bold">{t('rankings.table.rank')}</TableHead>
                            <TableHead className="font-bold">{t('rankings.table.player')}</TableHead>
                            <TableHead className="font-bold">{t('rankings.table.points')}</TableHead>
                            <TableHead className="font-bold">{t('rankings.table.tournaments')}</TableHead>
                            <TableHead className="font-bold text-center">{t('rankings.table.trend')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rankings.atp.map((ranking) => (
                            <RankingRow key={ranking.position} ranking={ranking} />
                          ))}
                        </TableBody>
                      </Table>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="wta">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="rounded-xl border border-border overflow-hidden"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="font-bold">{t('rankings.table.rank')}</TableHead>
                            <TableHead className="font-bold">{t('rankings.table.player')}</TableHead>
                            <TableHead className="font-bold">{t('rankings.table.points')}</TableHead>
                            <TableHead className="font-bold">{t('rankings.table.tournaments')}</TableHead>
                            <TableHead className="font-bold text-center">{t('rankings.table.trend')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rankings.wta.map((ranking) => (
                            <RankingRow key={ranking.position} ranking={ranking} />
                          ))}
                        </TableBody>
                      </Table>
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default RankingsPage;
