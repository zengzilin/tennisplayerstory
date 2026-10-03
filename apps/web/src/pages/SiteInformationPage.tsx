// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext.tsx';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { SUPPORT_EMAIL } from '../../../../shared/site-info.mjs';

export default function SiteInformationPage({ page }) {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  const info = t(`siteInfo.${page}`, { returnObjects: true });
  const contentLanguage = i18n.getResource(currentLanguage, 'translation', `siteInfo.${page}`) ? currentLanguage : 'en';
  const path = page === 'privacy' ? 'privacy-policy' : page === 'terms' ? 'terms-of-service' : page;
  return <div className="min-h-screen flex flex-col bg-background">
    <SEOHelmet pageKey={page} overrideTitle={info.title} overrideDescription={info.description} url={`/${path}`} canonicalLanguage={contentLanguage} alternateLanguages={['en', 'zh']} />
    <Header />
    <main id="main-content" className="flex-1 container mx-auto px-4 py-10 sm:py-16">
      <article lang={contentLanguage} className="max-w-3xl mx-auto">
        <nav aria-label={t('siteInfo.navigation')} className="flex flex-wrap gap-4 mb-8 text-sm text-muted-foreground">
          {['about', 'contact', 'privacy', 'terms'].map(key => <Link key={key} className="hover:underline" aria-current={page === key ? 'page' : undefined} to={`/${currentLanguage}/${key === 'privacy' ? 'privacy-policy' : key === 'terms' ? 'terms-of-service' : key}`}>{t(`siteInfo.${key}.title`)}</Link>)}
        </nav>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-4">{info.title}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">{info.description}</p>
        {page === 'contact' && <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-block text-lg text-primary underline break-all mb-6">{SUPPORT_EMAIL}</a>}
        <p className="text-sm text-muted-foreground mb-8">{t('siteInfo.updated')}: <time dateTime="2026-10-03">2026-10-03</time></p>
        <div className="space-y-8">{info.sections.map(section => <section key={section.title}>
          <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
          <p className="text-muted-foreground leading-8 whitespace-pre-line">{section.content}</p>
        </section>)}</div>
        {page === 'privacy' && <ul className="mt-6 space-y-2 text-sm">
          <li><a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">{t('siteInfo.googlePrivacy')}</a></li>
          <li><a className="underline" href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">{t('siteInfo.adSettings')}</a></li>
        </ul>}
        {page !== 'contact' && <aside className="mt-10 rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-2">{t('siteInfo.contact.title')}</h2>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline break-all">{SUPPORT_EMAIL}</a>
        </aside>}
      </article>
    </main>
    <Footer />
  </div>;
}
