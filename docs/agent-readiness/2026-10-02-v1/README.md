Current follow-up verification and remaining blockers: [2026-10-02-v2](../2026-10-02-v2/README.md). The record below describes the earlier baseline milestone.

# TennisHub agent readiness — 2026-10-02 v1

Status: local implementation verified; not deployed. No final 100 claim.

Browser baseline: **20/100, default All Checks, 2026-10-02 13:07:20 Asia/Shanghai**.
Result: https://isitagentready.com/tennisplayerstory.com
Profile: `profile-baseline.json`; raw broader scan: `baseline.json`; per-check matrix: `check-matrix.json`.
The browser default has 20 enabled checks, 15 scored checks, 3 pass, 12 fail, 5 neutral. A2A/AP2 are not default checks. Commerce and Web Bot Auth were informational. The raw broader API scan ran separately and encountered intermittent target HTTP 429 responses; it is not the browser score evidence.

## Implemented

- `/api/agent/lookup`: bounded read-only search/read for actual public page routes and existing approved articles. No user, draft, admin, author/private fields returned.
- `/ai/`, `/ai/index.ilang`, `/llms.txt`, `/llms-full.txt`: operating instructions, real lookup paths, provenance and limitations.
- Homepage HTTP Link relations; real public pages support Markdown negotiation with `Vary: Accept`, quality weights and no-store for Markdown.
- `/openapi.json`, `/.well-known/api-catalog`, `/.well-known/agent-skills/index.json`, `/ai/skills/tennishub-lookup/SKILL.md`, `/.well-known/ai-catalog.json`.
- Feature-detected browser WebMCP tool with actual callback, shared schema, AbortSignal/HMR cleanup.
- Sitemap and llms generation use shared route data; actual news and German routes included, non-existent player detail routes removed. Fixed HTML build entry from missing main.jsx to actual main.tsx.
- Content usage: search=yes, ai-input=yes, ai-train=no. Existing wildcard crawl policy retained.
- `/auth.md`: describes the existing human password/JWT flow and public service honestly. No OAuth endpoints, planned account stubs, keys or tokens fabricated. No login behavior changed.

## Verified / limitations

`node --test apps/api/tests/agent-discovery.test.js`: 6 passed. `npm run typecheck`, `npm run lint`, `npm run build`: passed. See `test-output.txt`, `verification.json`.
Browser executed the real registered tool to search rankings, read an exact ID in Japanese, and handle a missing ID. Desktop homepage/login and 390×844 mobile homepage/menu rendered. No credentials submitted and no records written.
Official MCP SDK 1.31.0 Client initialized the isolated candidate and executed tools/list and tools/call; known/missing/invalid/lang/outage cases passed (`mcp-proposal-test.json`). This candidate is not integrated into production dependencies or mounted yet.
Local article storage lacks MySQL configuration, so real database-backed article retrieval, full authentication, CDN cache variation and live scanner acceptance remain unverified. Storage errors return 503 rather than an empty inventory. Test host uses Node 24; production Node 20.19.1 was not available for validation.

## Remaining work to reach verified default 100

1. Approve the new production dependency `@modelcontextprotocol/sdk@^1.31.0` (repository engineering rule requires approval). Candidate is `pending/agent-mcp.js`; independent client checks are `pending/verify-mcp.mjs`. To integrate: install in `apps/api`, copy candidate to `apps/api/src/routes/agent-mcp.js`, import/mount it after agentDiscoveryRouter and before SPA fallback. Add its operational server card to ARD and the agent guide only after the lifecycle passes in the integrated app. SDK/zod peer versions must be resolved by npm; do not replace the protocol with a hand-written JSON file.
2. Obtain Hostinger deployment access and public DB configuration through existing authorization. README's `main.js` entry is absent from the current project; deployment must run the existing `npm run start --prefix apps/api` (`tsx src/main.ts`) or an equivalent verified Hostinger launch command. Deploy the whole Node service plus web build and shared modules; static uploads alone cannot support negotiation or tools. Preserve all current unrelated workspace edits and the host's existing launch/config settings. Do not blindly change hosting.
3. DNS-AID: `_index._agents` has no service record; public DS lookup is empty (`dns-index.json`, `dns-ds.json`). After DNS access is available, export relevant service/DS records, verify authoritative DNSKEY/signing support and registrar DS workflow. Conditional draft candidate: `_index._agents.tennisplayerstory.com. 300 IN SVCB 1 tennisplayerstory.com. alpn="h2" port="443" key65409="/ai/index.ilang"`. The path key is experimental, not a guaranteed assignment; recheck the current draft/provider syntax before applying. Verify signed authoritative responses, DS chain and AD with a validating resolver. Do not modify unrelated DNS, migrate nameservers or edit DS blindly.
4. `oauthDiscovery` / `oauthProtectedResource`: the existing website uses password/JWT, not an OAuth issuer. Existing account functionality must remain intact. A real supported issuer/resource design is needed; no disabled placeholder was used to misrepresent existing login. `authMd` now documents the real access model; its final scanner acceptance is unknown.
5. Deploy, verify the actual canonical CDN origin (including HTML→Markdown and Markdown→HTML), known/unknown article lookup with real DB, MCP lifecycle, digest, ARD/CORS, desktop/mobile reading and existing sign-in. Rescan the same current default enabled set from `profile-baseline.json`. Honor Retry-After. Save final raw result, browser displayed score/profile and timestamp; 100 requires zero scored failures/unresolved unableToCheck. No final live score exists yet.

## Recovery

Before local changes, source snapshots were saved under `rollback/`. Existing unrelated uncommitted changes are preserved in those snapshots. Restore this task's code with:

```sh
python3 docs/agent-readiness/2026-10-02-v1/rollback.py
npm run build
```

The script removes only the listed new implementation files; review the manifest before running after further work. No deployment or DNS change has occurred. A production deployment needs its own release snapshot/rollback before switching traffic.
