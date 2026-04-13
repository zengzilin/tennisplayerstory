'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, Trophy, User, LogOut, PenSquare, ShieldAlert, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';

const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'にほんご', flag: '🇯🇵' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

const localizedRouteSegments = {
  players: { en: 'players', zh: '球员', ja: 'プレイヤー', es: 'jugadores', fr: 'joueurs' },
  rankings: { en: 'rankings', zh: '排名', ja: 'ランキング', es: 'clasificaciones', fr: 'classements' },
  stories: { en: 'stories', zh: '故事', ja: 'ストーリー', es: 'historias', fr: 'histoires' },
  liveMatches: { en: 'live-matches', zh: 'live-matches', ja: 'live-matches', es: 'live-matches', fr: 'live-matches' },
};

const getLocalizedRouteSegment = (language, routeKey) => {
  return localizedRouteSegments[routeKey]?.[language] || routeKey;
};

const Header = ({ lang }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = lang || 'en';

  const isAdmin = currentUser?.role === 'admin';

  const getLocalizedPath = (enPath) => {
    return localizedRouteSegments[enPath]?.[currentLanguage] || enPath;
  };

  const getLanguageName = (langCode) => {
    switch (langCode) {
      case 'en': return t('language.english', { defaultValue: 'English' });
      case 'zh': return t('language.chinese', { defaultValue: '中文' });
      case 'ja': return t('language.japanese', { defaultValue: '日本語' });
      case 'es': return t('language.spanish', { defaultValue: 'Español' });
      case 'fr': return t('language.french', { defaultValue: 'Français' });
      default: return langCode.toUpperCase();
    }
  };

  const changeLanguage = (newLang) => {
    // Replace current language segment in pathname with new language
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && availableLanguages.some(l => l.code === segments[0])) {
      segments[0] = newLang;
    }
    router.push(`/${segments.join('/')}`);
  };

  const navLinks = [
    { path: `/${currentLanguage}`, label: t('nav.home', { defaultValue: 'Home' }) },
    { path: `/${currentLanguage}/${getLocalizedPath('liveMatches')}`, label: t('nav.liveMatches', { defaultValue: 'Live' }) },
    { path: `/${currentLanguage}/${getLocalizedPath('players')}`, label: t('nav.players', { defaultValue: 'Players' }) },
    { path: `/${currentLanguage}/${getLocalizedPath('rankings')}`, label: t('nav.rankings', { defaultValue: 'Rankings' }) },
    { path: `/${currentLanguage}/${getLocalizedPath('stories')}`, label: t('nav.stories', { defaultValue: 'Stories' }) },
  ];

  const isActive = (path) => {
    if (path === `/${currentLanguage}`) {
      return pathname === `/${currentLanguage}` || pathname === `/${currentLanguage}/`;
    }
    return pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    router.push(`/${currentLanguage}`);
    setIsOpen(false);
  };

  const currentLanguageName = getLanguageName(currentLanguage);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={`/${currentLanguage}`} className="flex items-center gap-2 font-bold text-xl">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TennisHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path)
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">{currentLanguageName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={currentLanguage === lang.code ? "bg-muted font-medium" : ""}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {getLanguageName(lang.code)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Button variant="outline" size="sm" asChild className="border-primary/20 text-primary hover:bg-primary/10">
                    <Link href={`/${currentLanguage}/admin`}>
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      {t('nav.admin', { defaultValue: 'Admin' })}
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${currentLanguage}/write-article`}>
                    <PenSquare className="h-4 w-4 mr-2" />
                    {t('nav.write', { defaultValue: 'Write' })}
                  </Link>
                </Button>
                <Link href={`/${currentLanguage}/profile`} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors ml-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                    <User className="h-4 w-4" />
                  </div>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">{t('nav.logout', { defaultValue: 'Logout' })}</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href={`/${currentLanguage}/login`}>{t('nav.login', { defaultValue: 'Login' })}</Link>
                </Button>
                <Button asChild>
                  <Link href={`/${currentLanguage}/signup`}>{t('nav.signup', { defaultValue: 'Sign up' })}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
                <nav className="flex flex-col gap-4 mt-8 flex-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-primary py-2 ${
                        isActive(link.path) ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                    {availableLanguages.map((langItem) => (
                      <Button
                        key={langItem.code}
                        variant={currentLanguage === langItem.code ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => { changeLanguage(langItem.code); setIsOpen(false); }}
                        className="w-full justify-start"
                      >
                        <span className="mr-2">{langItem.flag}</span>
                        {getLanguageName(langItem.code)}
                      </Button>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
