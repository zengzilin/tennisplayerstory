
import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Twitter, Instagram, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  const footerLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/live-matches', label: t('nav.liveMatches') },
    { path: '/players', label: t('nav.players') },
    { path: '/rankings', label: t('nav.rankings') },
    { path: '/stories', label: t('nav.stories') }
  ];

  const legalLinks = [
    { path: '/privacy-policy', label: t('footer.privacy') },
    { path: '/terms-of-service', label: t('footer.terms') }
  ];

  const socialLinks = [
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Youtube, label: 'YouTube', href: '#' }
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
              {t('footer.desc')}
            </p>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.quickLinks')}</span>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.legal')}</span>
            <nav className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <span className="font-semibold text-sm uppercase tracking-wider">{t('footer.followUs')}</span>
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
              <p className="text-sm text-secondary-foreground/80">{t('footer.contact')}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/80">
            © {currentYear} {t('footer.rights')}
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy-policy" className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms-of-service" className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
