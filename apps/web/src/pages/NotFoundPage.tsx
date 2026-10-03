import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';

export default function NotFoundPage() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || 'en';
  return <div className="min-h-screen flex flex-col bg-background">
    <SEOHelmet pageKey="home" overrideTitle={t('notFound.title')} overrideDescription={t('notFound.description')} noindex />
    <Header />
    <main id="main-content" className="container mx-auto flex-1 px-4 py-20">
      <h1 className="text-3xl font-bold mb-6">{t('notFound.title')}</h1>
      <p className="text-muted-foreground mb-6">{t('notFound.description')}</p>
      <Link className="text-primary underline" to={`/${currentLanguage}`}>{t('nav.home')}</Link>
    </main>
    <Footer />
  </div>;
}
