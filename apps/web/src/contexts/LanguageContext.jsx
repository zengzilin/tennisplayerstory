import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

const LanguageContext = createContext();

export const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'にほんご', flag: '🇯🇵' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

const supportedLanguages = availableLanguages.map(({ code }) => code);

export const localizedRouteSegments = {
  players: {
    en: 'players',
    zh: '球员',
    ja: 'プレイヤー',
    es: 'jugadores',
    fr: 'joueurs'
  },
  rankings: {
    en: 'rankings',
    zh: '排名',
    ja: 'ランキング',
    es: 'clasificaciones',
    fr: 'classements'
  },
  stories: {
    en: 'stories',
    zh: '故事',
    ja: 'ストーリー',
    es: 'historias',
    fr: 'histoires'
  }
};

export const getLocalizedRouteSegment = (language, routeKey) => {
  if (!routeKey || routeKey === 'home') {
    return '';
  }

  return localizedRouteSegments[routeKey]?.[language] || routeKey;
};

export const getRouteKeyFromSegment = (segment) => {
  if (!segment) {
    return null;
  }

  const matchedEntry = Object.entries(localizedRouteSegments).find(([, translations]) =>
    Object.values(translations).includes(segment)
  );

  return matchedEntry?.[0] || null;
};

export const buildLocalizedPath = (language, routeKey = 'home', suffix = '') => {
  const normalizedSuffix = String(suffix || '').replace(/^\/+/, '');

  if (!routeKey || routeKey === 'home') {
    return normalizedSuffix ? `/${language}/${normalizedSuffix}` : `/${language}`;
  }

  const segment = getLocalizedRouteSegment(language, routeKey);
  const basePath = `/${language}/${segment}`;

  return normalizedSuffix ? `${basePath}/${normalizedSuffix}` : basePath;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || i18n.language?.split('-')[0] || 'en';
  });

  const changeLanguage = useCallback((newLang, shouldNavigate = true) => {
    if (!supportedLanguages.includes(newLang)) return;
    if (newLang === language && !shouldNavigate) return;

    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    setLanguageState(newLang);

    if (shouldNavigate) {
      const pathParts = location.pathname.split('/').filter(Boolean);
      const currentPathWithoutLang = [...pathParts];

      if (supportedLanguages.includes(currentPathWithoutLang[0])) {
        currentPathWithoutLang.shift();
      }

      const currentSegment = currentPathWithoutLang[0];
      const routeKey = getRouteKeyFromSegment(currentSegment);

      if (routeKey) {
        currentPathWithoutLang[0] = getLocalizedRouteSegment(newLang, routeKey);
      }

      const newUrl = `/${newLang}${currentPathWithoutLang.length ? `/${currentPathWithoutLang.join('/')}` : ''}${location.search}${location.hash}`;
      navigate(newUrl, { replace: true });
    }
  }, [i18n, language, location, navigate]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'language' && e.newValue !== language) {
        if (supportedLanguages.includes(e.newValue)) {
          changeLanguage(e.newValue, false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [language, changeLanguage]);

  return (
    <LanguageContext.Provider value={{
      language,
      currentLanguage: language,
      changeLanguage,
      availableLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  // During SSR/SSG (static generation), context may be undefined.
  // Return a safe default to prevent build failures.
  if (context === undefined) {
    return {
      language: 'en',
      currentLanguage: 'en',
      changeLanguage: () => {},
      availableLanguages,
    };
  }
  return context;
};
