
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, Trophy, User, LogOut, PenSquare, ShieldAlert, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage, availableLanguages } from '@/contexts/LanguageContext.jsx';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const langPrefix = `/${currentLanguage}`;

  const getLocalizedPath = (enPath) => {
    return t(`routes.${enPath}`, { defaultValue: enPath });
  };

  const getLanguageName = (langCode) => {
    switch (langCode) {
      case 'en':
        return t('language.english');
      case 'zh':
        return t('language.chinese');
      case 'ja':
        return t('language.japanese');
      case 'es':
        return t('language.spanish');
      case 'fr':
        return t('language.french');
      default:
        return langCode.toUpperCase();
    }
  };

  const navLinks = [
    { path: `${langPrefix}`, label: t('nav.home') },
    { path: `${langPrefix}/live-matches`, label: t('nav.liveMatches') },
    { path: `${langPrefix}/${getLocalizedPath('players')}`, label: t('nav.players') },
    { path: `${langPrefix}/${getLocalizedPath('rankings')}`, label: t('nav.rankings') },
    { path: `${langPrefix}/${getLocalizedPath('stories')}`, label: t('nav.stories') }
  ];

  const isActive = (path) => {
    if (path === langPrefix) return location.pathname === langPrefix || location.pathname === `${langPrefix}/`;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate(`${langPrefix}`);
    setIsOpen(false);
  };

  const currentLanguageName = getLanguageName(currentLanguage);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to={langPrefix} className="flex items-center gap-2 font-bold text-xl">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TennisHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
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
                    onClick={() => changeLanguage(lang.code, true)}
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
                    <Link to={`${langPrefix}/admin`}>
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      {t('nav.admin')}
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`${langPrefix}/write-article`}>
                    <PenSquare className="h-4 w-4 mr-2" />
                    {t('nav.write')}
                  </Link>
                </Button>
                <Link to={`${langPrefix}/profile`} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors ml-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                    <User className="h-4 w-4" />
                  </div>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">{t('nav.logout')}</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to={`${langPrefix}/login`}>{t('nav.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to={`${langPrefix}/signup`}>{t('nav.signup')}</Link>
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
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-primary py-2 ${
                        isActive(link.path) ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                    {availableLanguages.map((lang) => (
                      <Button
                        key={lang.code}
                        variant={currentLanguage === lang.code ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => { changeLanguage(lang.code, true); setIsOpen(false); }}
                        className="w-full justify-start"
                      >
                        <span className="mr-2">{lang.flag}</span>
                        {getLanguageName(lang.code)}
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
