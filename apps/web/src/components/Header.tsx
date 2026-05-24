// @ts-nocheck

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Menu, Trophy, User, LogOut, ShieldAlert, Globe, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useLanguage, availableLanguages } from '@/contexts/LanguageContext.tsx';
import ThemeToggle from '@/components/ThemeToggle.tsx';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const langPrefix = `/${currentLanguage}`;

  const navLinks = [
    { path: `${langPrefix}`, label: t('nav.home', 'Home') },
    { path: `${langPrefix}/players`, label: t('nav.players', 'Players') },
    { path: `${langPrefix}/rankings`, label: t('nav.rankings', 'Rankings') },
    { path: `${langPrefix}/stories`, label: t('nav.stories', 'Stories') },
    { path: `${langPrefix}/vlogs`, label: 'Vlogs' }
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

  const activeLangObj = availableLanguages.find(l => l.code === currentLanguage) || availableLanguages[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to={langPrefix} className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl font-serif text-foreground dark:text-slate-50 tracking-tight">
              TennisHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-200 hover:text-primary relative py-2 ${
                  isActive(link.path)
                    ? 'text-primary'
                    : 'text-muted-foreground dark:text-slate-400'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-fade-in" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-slate-50">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium mr-1">{activeLangObj.flag}</span>
                  <span className="font-medium uppercase">{currentLanguage}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 dark:bg-slate-800 dark:border-slate-700">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code} 
                    onClick={() => changeLanguage(lang.code, true)}
                    className={`cursor-pointer dark:text-slate-50 dark:focus:bg-slate-700 ${currentLanguage === lang.code ? "bg-muted dark:bg-slate-700 font-medium" : ""}`}
                  >
                    <span className="mr-2 text-lg">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-px bg-border dark:bg-slate-700 mx-1" aria-hidden="true" />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700">
                    <User className="h-4 w-4 text-secondary-foreground/80 dark:text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex flex-col space-y-1 p-2">
                    {currentUser.name && <p className="font-medium dark:text-slate-50">{currentUser.name}</p>}
                    <p className="w-full truncate text-xs text-muted-foreground dark:text-slate-400">{currentUser.email}</p>
                  </div>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer mb-1 dark:text-slate-50 dark:focus:bg-slate-700">
                      <Link to={`${langPrefix}/admin`}>
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        {t('nav.admin', 'Admin Dashboard')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer mb-1 dark:text-slate-50 dark:focus:bg-slate-700">
                    <Link to={`${langPrefix}/profile`}>
                      <Settings className="h-4 w-4 mr-2" /> 
                      {t('nav.profile', 'Profile Settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20">
                    <LogOut className="h-4 w-4 mr-2" /> 
                    {t('nav.logout', 'Log out')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" asChild className="font-medium hover:bg-muted dark:hover:bg-slate-800 dark:text-slate-50">
                  <Link to={`${langPrefix}/login`}>{t('nav.login', 'Log in')}</Link>
                </Button>
                <Button asChild className="font-medium shadow-sm hover:shadow-md transition-shadow dark:bg-primary dark:text-primary-foreground">
                  <Link to={`${langPrefix}/signup`}>{t('nav.signup', 'Sign up')}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open Menu" className="dark:text-slate-50">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col border-l border-border/50 dark:bg-slate-950 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-8 mt-4">
                  <Trophy className="h-6 w-6 text-primary" />
                  <span className="font-bold text-xl font-serif dark:text-slate-50">TennisHub</span>
                </div>
                
                <nav className="flex flex-col gap-2 flex-1" aria-label="Mobile Navigation">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors py-3 px-4 rounded-lg ${
                        isActive(link.path) 
                          ? 'text-primary bg-primary/5 dark:bg-primary/10' 
                          : 'text-foreground dark:text-slate-50 hover:bg-muted dark:hover:bg-slate-800'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-border dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {availableLanguages.map((lang) => (
                      <Button
                        key={lang.code}
                        variant={currentLanguage === lang.code ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => { changeLanguage(lang.code, true); setIsOpen(false); }}
                        className="w-full justify-center text-xs dark:border-slate-700 dark:text-slate-50"
                      >
                        <span className="mr-1">{lang.flag}</span>
                        {lang.code.toUpperCase()}
                      </Button>
                    ))}
                  </div>

                  {isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline" className="justify-start w-full dark:border-slate-700 dark:text-slate-50" onClick={() => setIsOpen(false)}>
                         <Link to={`${langPrefix}/profile`}>
                           <User className="h-4 w-4 mr-2" /> Profile
                         </Link>
                      </Button>
                      <Button variant="destructive" className="justify-start w-full" onClick={handleLogout}>
                         <LogOut className="h-4 w-4 mr-2" /> {t('nav.logout', 'Log out')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" asChild onClick={() => setIsOpen(false)} className="dark:border-slate-700 dark:text-slate-50">
                        <Link to={`${langPrefix}/login`}>{t('nav.login', 'Log in')}</Link>
                      </Button>
                      <Button asChild onClick={() => setIsOpen(false)} className="dark:bg-primary dark:text-primary-foreground">
                        <Link to={`${langPrefix}/signup`}>{t('nav.signup', 'Sign up')}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
