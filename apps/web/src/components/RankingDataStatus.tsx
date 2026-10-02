// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiServerClient } from '@/lib/apiServerClient.js';

export default function RankingDataStatus({ source: selectedSource } = {}) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let cancelled = false;
    apiServerClient.fetch('/scrape/status')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load ranking update status');
        return response.json();
      })
      .then(data => { if (!cancelled) setStatus(data); })
      .catch(error => console.error(error.message));
    return () => { cancelled = true; };
  }, []);
  const formatDate = date => date ? new Date(date).toLocaleString(i18n.language) : '—';
  return (
    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 mt-4">
      {(selectedSource ? [selectedSource] : ['atp', 'wta']).map(source => (
        <span key={source}>
          <a className="underline underline-offset-4" href={status?.feeds?.[source]?.sourceUrl || (source === 'atp' ? 'https://www.protennislive.com/posting/ramr/singles_entry_numerical.pdf' : 'https://www.wtatennis.com/rankings/singles')} target="_blank" rel="noopener noreferrer">
            {source === 'atp' ? (status?.feeds?.atp?.sourceUrl?.includes('espn') ? 'ATP · ESPN' : 'ATP · ' + t('rankingFilters.official', 'Official PDF')) : 'WTA · wtatennis.com'}
          </a>
          {' · '}{t('rankingData.lastSynced', 'Last synced:')} {formatDate(status?.[source])}
          {status?.feeds?.[source]?.rankingDate && <> · {t('rankingData.rankingDate', 'Ranking date:')} {new Date(status.feeds[source].rankingDate).toLocaleDateString(i18n.language)}</>}
        </span>
      ))}
    </div>
  );
}
