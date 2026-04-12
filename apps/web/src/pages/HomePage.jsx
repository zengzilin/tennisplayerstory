
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMatchData } from '@/hooks/useMatchData.js';
import { useStoryData } from '@/hooks/useStoryData.js';
import MatchCard from '@/components/MatchCard.jsx';
import ArticlePreview from '@/components/ArticlePreview.jsx';
import ImageWithAlt from '@/components/ImageWithAlt.jsx';
import { ArrowRight, Trophy, Users, TrendingUp } from 'lucide-react';
import { useLanguage, buildLocalizedPath } from '@/contexts/LanguageContext.jsx';
import { generateWebSiteSchema, generateOrganizationSchema } from '@/lib/structuredData.js';

const HomePage = () => {
  const { matches } = useMatchData();
  const { stories } = useStoryData();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const pageUrl = buildLocalizedPath(currentLanguage, 'home');

  useEffect(() => {
    console.log('[HomePage] t function test:', t('home.title'));
  }, [t]);

  const liveMatches = matches.filter(m => m.status === 'Live').slice(0, 2);
  const featuredStories = stories.slice(0, 3);

  const features = [
    {
      icon: Trophy,
      title: t('home.features.live.title'),
      description: t('home.features.live.desc')
    },
    {
      icon: Users,
      title: t('home.features.players.title'),
      description: t('home.features.players.desc')
    },
    {
      icon: TrendingUp,
      title: t('home.features.rankings.title'),
      description: t('home.features.rankings.desc')
    }
  ];

  const structuredData = [generateWebSiteSchema(), generateOrganizationSchema()];

  return (
    <>
      <SEOHelmet
        title={t('home.title')}
        description={t('home.metaDesc')}
        url={pageUrl}
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <ImageWithAlt
                src="https://images.unsplash.com/photo-1480180566821-a7d525cdfc5e"
                alt={t('home.heroImageAlt')}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl"
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
                  {t('home.heroTitle')}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                  {t('home.heroDesc')}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg" className="text-lg">
                    <Link to="live-matches">
                      {t('home.viewLive')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg">
                    <Link to="rankings">{t('home.browseRankings')}</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-muted">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.whyChoose')}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('home.whyChooseDesc')}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={index % 2 === 0 ? 'md:order-1' : 'md:order-2'}
                  >
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-8">
                        <feature.icon className="h-12 w-12 text-primary mb-4" />
                        <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {liveMatches.length > 0 && (
            <section className="py-20">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold">{t('home.liveMatches')}</h2>
                  <Button asChild variant="outline">
                    <Link to="live-matches">{t('home.viewAll')}</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {liveMatches.map((match) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <MatchCard match={match} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="py-20 bg-secondary text-secondary-foreground">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-bold">{t('home.trendingStories')}</h2>
                <Button asChild variant="outline">
                  <Link to="stories">{t('home.readMore')}</Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredStories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full"
                  >
                    <ArticlePreview article={story} onTagClick={() => {}} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;
