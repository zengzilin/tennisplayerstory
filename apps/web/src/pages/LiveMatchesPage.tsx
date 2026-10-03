import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { LIVE_MATCHES_URL } from '../../../../shared/site-info.mjs';

export default function LiveMatchesPage() {
  const { t } = useTranslation();
  useEffect(() => {
    window.location.replace(LIVE_MATCHES_URL);
  }, []);

  return (
    <>
      <SEOHelmet pageKey="liveMatches" url="/live-matches" overrideTitle="TennisScoresToday" overrideDescription="Tennis scores and match information on TennisScoresToday." noindex />
      <main className="p-8">
        <a className="text-primary underline" href={LIVE_MATCHES_URL}>
          {t('nav.liveMatches', 'Live Matches')} — TennisScoresToday
        </a>
      </main>
    </>
  );
}
