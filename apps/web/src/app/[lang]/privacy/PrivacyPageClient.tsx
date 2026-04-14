// @ts-nocheck
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const PrivacyPageClient = ({ lang }: { lang: LangCode }) => {
  const t = useTranslations();

  const sections = t.raw('legal.privacy.sections') as Array<{ title: string; content: string }>;
  const title = t('legal.privacy.title');
  const lastUpdated = t('legal.privacy.lastUpdated');
  const version = t('legal.privacy.version');

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
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
    </div>
  );
};

export default PrivacyPageClient;
