'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy, Twitter, Instagram, Youtube } from 'lucide-react';

const localizedRouteSegments = {
  players: { en: 'players', zh: '球员', ja: 'プレイヤー', es: 'jugadores', fr: 'joueurs' },
  rankings: { en: 'rankings', zh: '排名', ja: 'ランキング', es: 'clasificaciones', fr: 'classements' },
  stories: { en: 'stories', zh: '故事', ja: 'ストーリー', es: 'historias', fr: 'histoires' },
  liveMatches: { en: 'live-matches', zh: 'live-matches', ja: 'live-matches', es: 'live-matches', fr: 'live-matches' },
};

const Footer = ({ lang }) => {
  const currentYear = new Date().getFullYear();
  const currentLanguage = lang || 'en';
  const t = useTranslations();

  const getLocalizedPath = (enPath) => {
    return localizedRouteSegments[enPath]?.[currentLanguage] || enPath;
  };

  const footerLinks = [
    { path: `/${currentLanguage}`, label: t('nav.home', { defaultValue: 'Home' }) },
    { path: `/${currentLanguage}/${getLocalizedPath('liveMatches')}`, label: t('nav.liveMatches', { defaultValue: 'Live' }) },
    { path: `/${currentLanguage}/${getLocalizedPath('players')}`, label: t('nav.players', { defaultValue: 'Players' }) },
    { path: `/${currentLanguage}/${getLocalizedPath('rankings')}`, label: t('nav.rankings', { defaultValue: 'Rankings' }) },
    { path: `/${currentLanguage}/${getLocalizedPath('stories')}`, label: t('nav.stories', { defaultValue: 'Stories' }) },
  ];

  const legalLinks = [
    { path: `/${currentLanguage}/privacy-policy`, label: t('footer.privacy', { defaultValue: 'Privacy Policy' }) },
    { path: `/${currentLanguage}/terms-of-service`, label: t('footer.terms', { defaultValue: 'Terms of Service' }) },
  ];

  const socialLinks = [
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Youtube, label: 'YouTube', href: '#' },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">TennisHub</span>
            </div>
            <p className="text-sm text-secondary-foreground/80 max-w-xs">
              {t('footer.desc', { defaultValue: 'Your source for tennis rankings, live scores, and player stories.' })}
            </p>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.quickLinks', { defaultValue: 'Quick Links' })}</span>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.legal', { defaultValue: 'Legal' })}</span>
            <nav className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.followUs', { defaultValue: 'Follow Us' })}</span>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-sm text-secondary-foreground/80">{t('footer.contact', { defaultValue: 'Contact us at hello@tennishub.com' })}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/80">
            © {currentYear} {t('footer.rights', { defaultValue: 'All rights reserved.' })}
          </p>
          <div className="flex gap-6 text-sm">
            {legalLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
