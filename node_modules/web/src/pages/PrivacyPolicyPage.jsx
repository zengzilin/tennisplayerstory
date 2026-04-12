
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const PrivacyPolicyPage = () => {
  const { t } = useTranslation();
  
  // Fallback content if translations are missing
  const defaultSections = [
    { title: 'Information Collection', content: 'We collect information to provide better services to our users.' },
    { title: 'Use of Information', content: 'The information we collect is used to improve our platform and user experience.' },
    { title: 'Data Protection', content: 'We implement security measures to maintain the safety of your personal information.' }
  ];

  const legalData = t('legal.privacy', { returnObjects: true });
  const sections = Array.isArray(legalData?.sections) ? legalData.sections : defaultSections;
  const title = typeof legalData?.title === 'string' ? legalData.title : 'Privacy Policy';
  const lastUpdated = typeof legalData?.lastUpdated === 'string' ? legalData.lastUpdated : 'Last Updated: April 2026';
  const version = typeof legalData?.version === 'string' ? legalData.version : 'Version 1.0';

  return (
    <>
      <Helmet>
        <title>{`${title} - TennisHub`}</title>
        <meta name="description" content="Privacy Policy and data protection information for TennisHub." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="mb-12 border-b border-border pb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                {title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>{lastUpdated}</span>
                <span>•</span>
                <span>{version}</span>
              </div>
            </div>

            <div className="space-y-10">
              {sections.map((section, index) => (
                <motion.section 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">
                    {section.title}
                  </h2>
                  <div className="text-muted-foreground leading-relaxed space-y-4">
                    <p>{section.content}</p>
                  </div>
                </motion.section>
              ))}
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
