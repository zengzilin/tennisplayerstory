import { useEffect, useState } from 'react';

// The API serves XML in production; static hosting uses the generated fallback.
export default function SitemapXml() {
  const [xml, setXml] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/sitemap.xml', { signal: controller.signal })
      .then(async response => {
        if (!response.ok || !response.headers.get('content-type')?.includes('xml')) throw new Error('Sitemap unavailable');
        setXml(await response.text());
      })
      .catch(() => { if (!controller.signal.aborted) setXml('Sitemap temporarily unavailable. Please retry later.'); });
    return () => controller.abort();
  }, []);
  return <pre className="whitespace-pre-wrap break-words p-5">{xml}</pre>;
}
