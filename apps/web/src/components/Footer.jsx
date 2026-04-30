
import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Twitter, Instagram, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

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
    { path: `${langPrefix}/stories`, label: t('nav.stories', 'Stories') },
    { path: `${langPrefix}/vlogs`, label: 'Vlogs' }
  ];

  const legalLinks = [
    { path: `${langPrefix}/privacy-policy`, label: t('footer.privacy', 'Privacy Policy') },
    { path: `${langPrefix}/terms-of-service`, label: t('footer.terms', 'Terms of Service') }
  ];

  const socialLinks = [
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Youtube, label: 'YouTube', href: '#' }
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground dark:bg-slate-900 dark:text-slate-50 border-t border-border dark:border-slate-800 mt-20 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">TennisHub</span>
            </div>
            <p className="text-sm text-secondary-foreground/80 dark:text-slate-400 max-w-xs">
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
                  className="text-sm text-secondary-foreground/80 dark:text-slate-400 hover:text-secondary-foreground dark:hover:text-blue-300 transition-colors"
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
                  className="text-sm text-secondary-foreground/80 dark:text-slate-400 hover:text-secondary-foreground dark:hover:text-blue-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.followUs', 'Follow Us')}</span>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="text-secondary-foreground/80 dark:text-slate-400 hover:text-secondary-foreground dark:hover:text-blue-300 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-sm text-secondary-foreground/80 dark:text-slate-400">{t('footer.contact', 'Contact: info@tennishub.com')}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/80 dark:text-slate-400">
            © {currentYear} {t('footer.rights', 'All rights reserved.')}
          </p>
          <div className="flex gap-6 text-sm">
            <Link to={`${langPrefix}/privacy-policy`} className="text-secondary-foreground/80 dark:text-slate-400 hover:text-secondary-foreground dark:hover:text-blue-300 transition-colors">
              {t('footer.privacy', 'Privacy Policy')}
            </Link>
            <Link to={`${langPrefix}/terms-of-service`} className="text-secondary-foreground/80 dark:text-slate-400 hover:text-secondary-foreground dark:hover:text-blue-300 transition-colors">
              {t('footer.terms', 'Terms of Service')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
