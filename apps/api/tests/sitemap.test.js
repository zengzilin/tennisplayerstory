import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSitemapXml } from '../../../shared/sitemap.mjs';

test('sitemap lists canonical published versions and omits demos, accounts and untranslated information pages', () => {
  const xml = renderSitemapXml({ baseUrl: 'https://tennisplayerstory.com', articles: [
    { id: 'original', status: 'approved', language: 'zh', updated: '2026-10-01', translations: { es: { title: 'Título', content: 'Texto' }, en: { title: 'Partial' } } },
    { id: 'private', status: 'pending', language: 'zh' },
  ], vlogs: [{ id: 'private-video', status: 'draft' }] });
  assert.match(xml, /\/zh\/stories\/original<\/loc>/);
  assert.match(xml, /\/es\/stories\/original<\/loc>/);
  assert.match(xml, /<lastmod>2026-10-01<\/lastmod>/);
  assert.ok(!xml.includes('/en/stories/original'));
  assert.ok(!xml.includes('private'));
  assert.ok(!xml.includes('live-matches'));
  assert.ok(!xml.includes('login'));
  assert.ok(!xml.includes('/fr/privacy-policy'));
  assert.match(xml, /\/en\/privacy-policy<\/loc>/);
  const fallback = renderSitemapXml({ baseUrl: 'https://tennisplayerstory.com' });
  assert.ok(!fallback.includes('<lastmod>'));
  assert.ok(!fallback.includes('/stories/original'));
});
