// @ts-nocheck
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

const LanguageContext = createContext();

export const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'にほんご', flag: '🇯🇵' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || i18n.language?.split('-')[0] || 'en';
  });

  const changeLanguage = useCallback((newLang, shouldNavigate = true) => {
    if (!['en', 'zh', 'ja', 'es', 'fr', 'de'].includes(newLang)) return;
    if (newLang === language && !shouldNavigate) return;

    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    setLanguageState(newLang);

    if (shouldNavigate) {
      const pathParts = location.pathname.split('/').filter(Boolean);
      if (['en', 'zh', 'ja', 'es', 'fr', 'de'].includes(pathParts[0])) {
        pathParts[0] = newLang;
      } else {
        pathParts.unshift(newLang);
      }
      const newUrl = `/${pathParts.join('/')}${location.search}${location.hash}`;
      navigate(newUrl, { replace: true });
    }
  }, [i18n, language, location, navigate]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'language' && e.newValue !== language) {
        if (['en', 'zh', 'ja', 'es', 'fr', 'de'].includes(e.newValue)) {
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
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};