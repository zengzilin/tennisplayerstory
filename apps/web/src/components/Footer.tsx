// @ts-nocheck

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORT_EMAIL } from '../../../../shared/site-info.mjs';
import { useLanguage } from '@/contexts/LanguageContext.tsx';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const langPrefix = `/${currentLanguage}`;

  const footerLinks = [
    { path: langPrefix, label: t('nav.home', 'Home') },
    { path: `${langPrefix}/live-matches`, label: t('nav.liveMatches', 'Live Matches') },
    { path: `${langPrefix}/players`, label: t('nav.players', 'Players') },
    { path: `${langPrefix}/rankings`, label: t('nav.rankings', 'Rankings') },
    { path: `${langPrefix}/news`, label: t('nav.news', 'News') },
    { path: `${langPrefix}/stories`, label: t('nav.stories', 'Stories') },
    { path: `${langPrefix}/vlogs`, label: 'Vlogs' }
  ];

  const legalLinks = [
    { path: `${langPrefix}/about`, label: t('siteInfo.about.title') },
    { path: `${langPrefix}/contact`, label: t('siteInfo.contact.title') },
    { path: `${langPrefix}/privacy-policy`, label: t('footer.privacy', 'Privacy Policy') },
    { path: `${langPrefix}/terms-of-service`, label: t('footer.terms', 'Terms of Service') }
  ];

  return (
    <footer className="bg-background text-foreground border-t border-border mt-12 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-6 w-6 rounded-full bg-accent p-1 text-accent-foreground" />
              <span className="font-bold text-xl">TennisHub</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('footer.desc', 'Your ultimate destination for everything professional tennis.')}
            </p>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.quickLinks', 'Quick Links')}</span>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.legal', 'Legal')}</span>
            <nav className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('siteInfo.contact.title')}</span>
            <p className="text-sm text-muted-foreground">{t('siteInfo.contact.description')}</p>
            <a className="block text-sm text-primary underline break-all" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {t('footer.rights', 'All rights reserved.')}
          </p>
          <div className="flex gap-6 text-sm">
            <Link to={`${langPrefix}/privacy-policy`} className="text-muted-foreground hover:text-foreground transition-colors">
              {t('footer.privacy', 'Privacy Policy')}
            </Link>
            <Link to={`${langPrefix}/terms-of-service`} className="text-muted-foreground hover:text-foreground transition-colors">
              {t('footer.terms', 'Terms of Service')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
