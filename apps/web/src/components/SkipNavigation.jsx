
import React from 'react';
import { useTranslation } from 'react-i18next';

const SkipNavigation = () => {
  const { t } = useTranslation();
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[100] bg-primary text-primary-foreground px-6 py-3 rounded-md shadow-xl font-bold transition-transform"
    >
      {t('accessibility.skipToMain', 'Skip to main content')}
    </a>
  );
};

export default SkipNavigation;
