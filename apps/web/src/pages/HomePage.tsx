// @ts-nocheck

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient.js';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Trophy, Users, PlaySquare, Target, Sparkles, TrendingUp } from 'lucide-react';
import { generateWebSiteSchema, generateOrganizationSchema, generateBreadcrumbSchema } from '@/lib/structuredData.js';

import AnimatedCounter from '@/components/AnimatedCounter.tsx';
import FeaturedPlayerCard from '@/components/FeaturedPlayerCard.tsx';
import FeaturedVlogCard from '@/components/FeaturedVlogCard.tsx';
import RankingsPreviewTable from '@/components/RankingsPreviewTable.tsx';
import CTASection from '@/components/CTASection.tsx';
import { CardListSkeleton } from '@/components/LoadingSkeletons.tsx';

const HomePage = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const langPrefix = `/${currentLanguage}`;
  
  const [players, setPlayers] = useState([]);
  const [vlogs, setVlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, vlogsRes] = await Promise.all([
          pb.collection('players').getList(1, 4, {
            sort: 'ranking', // Ascending rank gives top players
            $autoCancel: false
          }),
          pb.collection('vlogs').getList(1, 4, {
            sort: '-createdAt',
            filter: "status='published'",
            $autoCancel: false
          })
        ]);
        setPlayers(playersRes.items);
        setVlogs(vlogsRes.items);
      } catch (err) {
        console.error("Failed to fetch homepage data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const breadcrumbs = generateBreadcrumbSchema([{ name: 'Home', path: langPrefix }]);
  const structuredData = [generateWebSiteSchema(), generateOrganizationSchema(), breadcrumbs];

  return (
    <>
      <SEOHelmet 
        pageKey="home"
        url="/"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col bg-background dark:bg-slate-950 transition-colors duration-300 selection:bg-primary/30">
        <Header />

        <main id="main-content" className="flex-1 overflow-x-hidden">
          <section className="border-b border-border bg-background py-16 lg:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <p className="mb-6 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">The court, in context</p>
                <h1 className="mb-6 text-5xl font-extrabold leading-[1.04] tracking-tight text-foreground md:text-7xl lg:text-[80px]">
                  Tennis Player<br />Stories<span className="text-lime-600 dark:text-accent">.</span>
                </h1>
                <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  Discover elite athletes, follow the tour, and read the stories shaping professional tennis.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button asChild size="lg" className="h-12 px-6">
                    <Link to={`${langPrefix}/players`}>Explore Players <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-12 px-6">
                    <Link to={`${langPrefix}/news`}>Read Tennis Brief <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="h-12 px-6">
                    <Link to={`${langPrefix}/vlogs`}><PlaySquare className="mr-2 h-4 w-4" /> Watch Vlogs</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURED PLAYERS SECTION */}
          <section className="py-14 bg-muted/30 dark:bg-slate-900/40 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                <div className="max-w-2xl">
                  <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6 text-foreground dark:text-slate-50 flex items-center gap-3">
                    <Trophy className="h-10 w-10 text-lime-700 dark:text-accent" />
                    Elite Athletes
                  </h2>
                  <p className="text-lg text-muted-foreground dark:text-slate-400 leading-relaxed text-balance">
                    The professional tennis circuit demands extraordinary dedication, resilience, and tactical brilliance. Our database tracks the top performers across the ATP and WTA tours. Dive into detailed profiles, uncover their inspiring journeys, and review comprehensive match statistics that define their legacy on the court.
                  </p>
                </div>
                <Button asChild variant="outline" className="shrink-0 group dark:border-slate-700 dark:text-slate-200">
                  <Link to={`${langPrefix}/players`}>
                    View All Players
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <CardListSkeleton count={4} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {players.map((player, index) => (
                    <div key={player.id} className="h-full">
                      <FeaturedPlayerCard player={player} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* LATEST VLOGS SECTION */}
          <section className="py-14 dark:bg-slate-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-muted/50 to-transparent dark:from-slate-900/50 pointer-events-none" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col lg:flex-row justify-between gap-12 mb-10">
                <div className="max-w-2xl">
                  <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6 text-foreground dark:text-slate-50 flex items-center gap-3">
                    <PlaySquare className="h-10 w-10 text-primary" />
                    Inspiring Vlogs
                  </h2>
                  <p className="text-lg text-muted-foreground dark:text-slate-400 leading-relaxed text-balance">
                    Step off the court and behind the scenes with our curated collection of professional tennis vlogs. From in-depth tactical breakdowns of Grand Slam finals to exclusive community stories, our video platform connects fans directly with the pulse of the sport. Watch, learn, and engage with content created by passionate tennis experts.
                  </p>
                </div>
                <div className="flex items-end">
                  <Button asChild variant="default" className="group shadow-md dark:bg-primary dark:text-primary-foreground">
                    <Link to={`${langPrefix}/vlogs`}>
                      Watch All Videos
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <CardListSkeleton count={4} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {vlogs.map((vlog) => (
                    <FeaturedVlogCard key={vlog.id} vlog={vlog} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RANKINGS & STATS SECTION */}
          <section className="py-14 bg-secondary/5 dark:bg-slate-900/30 border-y border-border/50 dark:border-slate-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                
                {/* Left Col: Rankings Preview */}
                <div className="lg:col-span-7 space-y-8">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-foreground dark:text-slate-50 flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-secondary" />
                      Live Tour Rankings
                    </h2>
                    <p className="text-lg text-muted-foreground dark:text-slate-400 leading-relaxed text-balance max-w-xl">
                      Tracking points across a grueling 52-week calendar, our live rankings offer a transparent view into the fierce battle for world No. 1. Stay updated as players accumulate points from Grand Slams and Masters events.
                    </p>
                  </div>
                  
                  <RankingsPreviewTable />
                  
                  <Button asChild variant="outline" className="w-full sm:w-auto dark:border-slate-700 dark:text-slate-200">
                    <Link to={`${langPrefix}/rankings`}>View Full ATP/WTA Rankings</Link>
                  </Button>
                </div>

                {/* Right Col: Stats */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-6 content-center">
                  <div className="bg-card dark:bg-slate-800 rounded-3xl shadow-sm border border-border/50 dark:border-slate-700">
                    <AnimatedCounter finalValue={584} label="Professional Players" icon={Users} />
                  </div>
                  <div className="bg-card dark:bg-slate-800 rounded-3xl shadow-sm border border-border/50 dark:border-slate-700 mt-8">
                    <AnimatedCounter finalValue={1240} label="Analysis Vlogs" icon={PlaySquare} />
                  </div>
                  <div className="bg-card dark:bg-slate-800 rounded-3xl shadow-sm border border-border/50 dark:border-slate-700 -mt-8">
                    <AnimatedCounter finalValue={89000} label="Monthly Views" icon={Target} suffix="+" />
                  </div>
                  <div className="bg-card dark:bg-slate-800 rounded-3xl shadow-sm border border-border/50 dark:border-slate-700">
                    <AnimatedCounter finalValue={12} label="Active Communities" icon={Sparkles} />
                  </div>
                </div>
                
              </div>
            </div>
          </section>

          {/* CTA SECTIONS */}
          <section className="py-14 dark:bg-slate-950">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              
              <CTASection 
                title="Join the TennisHub Community"
                description="Sign up today to create your personalized dashboard, save your favorite professional players, and never miss an update on the global tennis tour."
                bgColor="bg-primary"
                textColor="text-primary-foreground"
                icon={Users}
                primaryCTA={{ text: "Create Free Account", link: `${langPrefix}/signup` }}
                secondaryCTA={{ text: "Log In", link: `${langPrefix}/login` }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CTASection 
                  title="Share Your Perspective"
                  description="Have a deep understanding of tactical match play? Upload your own video analysis vlogs and engage with fellow enthusiasts."
                  bgColor="bg-secondary"
                  textColor="text-secondary-foreground"
                  primaryCTA={{ text: "Submit a Vlog", link: `${langPrefix}/vlogs` }}
                />
                
                <CTASection 
                  title="Track Live Matches"
                  description="Follow real-time point-by-point updates from professional tournaments happening right now around the globe."
                  bgColor="bg-accent"
                  textColor="text-accent-foreground"
                  primaryCTA={{ text: "View Live Scores", link: `${langPrefix}/live-matches` }}
                />
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
