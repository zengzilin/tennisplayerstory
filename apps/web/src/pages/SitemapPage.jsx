
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Map, Layers, LayoutList, Trophy } from 'lucide-react';

const SitemapPage = () => {
  const { currentLanguage } = useLanguage();
  const langPrefix = `/${currentLanguage}`;

  const mainLinks = [
    { path: langPrefix, label: 'Home Page' },
    { path: `${langPrefix}/live-matches`, label: 'Live Matches & Scores' },
    { path: `${langPrefix}/players`, label: 'Professional Players Database' },
    { path: `${langPrefix}/rankings`, label: 'Global Tennis Rankings' },
    { path: `${langPrefix}/stories`, label: 'Tennis News & Stories' },
    { path: `${langPrefix}/vlogs`, label: 'Tennis Video Vlogs' }
  ];

  const userLinks = [
    { path: `${langPrefix}/login`, label: 'User Login' },
    { path: `${langPrefix}/signup`, label: 'Create Account' },
    { path: `${langPrefix}/profile`, label: 'My Profile (Requires Login)' },
    { path: `${langPrefix}/write-article`, label: 'Write an Article (Requires Login)' },
    { path: `${langPrefix}/my-articles`, label: 'My Articles (Requires Login)' }
  ];

  const legalLinks = [
    { path: `${langPrefix}/privacy-policy`, label: 'Privacy Policy' },
    { path: `${langPrefix}/terms-of-service`, label: 'Terms of Service' }
  ];

  return (
    <>
      <SEOHelmet pageKey="sitemap" url="/sitemap" />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main id="main-content" className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-10 border-b border-border pb-6">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Map className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-serif text-foreground">Site Map</h1>
                <p className="text-muted-foreground mt-2">Complete directory of TennisHub pages and resources.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section aria-labelledby="sitemap-main">
                <Card className="h-full bg-card border-border shadow-sm">
                  <CardContent className="p-6">
                    <h2 id="sitemap-main" className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
                      <Trophy className="h-5 w-5 text-primary" />
                      Main Categories
                    </h2>
                    <ul className="space-y-4">
                      {mainLinks.map((link) => (
                        <li key={link.path}>
                          <Link to={link.path} className="text-muted-foreground hover:text-primary hover:underline transition-colors block">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <section aria-labelledby="sitemap-user">
                <Card className="h-full bg-card border-border shadow-sm">
                  <CardContent className="p-6">
                    <h2 id="sitemap-user" className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
                      <Layers className="h-5 w-5 text-secondary" />
                      User Portal
                    </h2>
                    <ul className="space-y-4">
                      {userLinks.map((link) => (
                        <li key={link.path}>
                          <Link to={link.path} className="text-muted-foreground hover:text-primary hover:underline transition-colors block">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <section aria-labelledby="sitemap-legal" className="md:col-span-2">
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-6">
                    <h2 id="sitemap-legal" className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
                      <LayoutList className="h-5 w-5 text-accent" />
                      Legal Information
                    </h2>
                    <ul className="flex flex-col sm:flex-row sm:gap-8 gap-4">
                      {legalLinks.map((link) => (
                        <li key={link.path}>
                          <Link to={link.path} className="text-muted-foreground hover:text-primary hover:underline transition-colors block">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            </div>
            
            <div className="mt-12 text-center">
              <a href="/sitemap.xml" className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                View XML Sitemap (For Search Engines)
              </a>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default SitemapPage;
