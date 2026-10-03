#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { publicPages } from '../../../shared/public-pages.mjs';
import { renderSitemapXml } from '../../../shared/sitemap.mjs';

const domain = process.env.WEBSITE_DOMAIN || 'tennisplayerstory.com';
const origin = new URL(domain.startsWith('http') ? domain : `https://${domain}`).origin;
const text = `# TennisHub

> Multilingual tennis news, approved community stories, player listings, rankings and video pages.

## Public pages
${publicPages.map(page => `- [${page.title}](${origin}/en${page.path}): ${page.description}`).join('\n')}

## Agent access
- [Agent guide](${origin}/ai/): Bounded public page and approved article lookup.
- [OpenAPI](${origin}/openapi.json): Public read-only API, no credentials required.
- [Lookup skill](${origin}/ai/skills/tennishub-lookup/SKILL.md): Usage and interpretation instructions.
- [Authentication](${origin}/auth.md): Existing human accounts; no OAuth or agent registration service.

Rankings and scores are not guaranteed current. Cite source URLs and preserve stored dates and language qualifiers. Unknown facts remain unknown.
`;
writeFileSync(fileURLToPath(new URL('../public/llms.txt', import.meta.url)), text);
writeFileSync(fileURLToPath(new URL('../public/sitemap.xml', import.meta.url)), renderSitemapXml({ baseUrl: origin }));
