# Agent readiness — 2026-10-02 v3

Target: https://tennisplayerstory.com. Base release: 6085f3eb570429090f37de21bc45e6afb55c8af9.

The current browser default All Checks enables 20 checks (A2A and AP2 excluded). Browser baseline: **67/100**, Level4, 2026-10-02 19:26:07 Asia/Shanghai. The aligned raw API scan is separately timestamped 2026-10-02T11:32:56.669Z and has no numeric score field. 15 applicable scored checks: 10 pass, 5 fail; 5 enabled neutral checks; no observed unableToCheck. Commerce is excluded by the verified current client formula. See baseline-summary.json, baseline-api.json, baseline-browser.txt and baseline-browser.jpg.

Owner approved the official MCP SDK production dependency and explicitly disabled planned-contract agent OAuth on 2026-10-02. Owner provided the logged-in Hostinger DNS editor. Official SDK version1.31.0 is mounted as stateless Streamable HTTP with a real public lookup tool. OAuth is construction-only: available=false, planned_contract_only, unknown launch date, reserved operations503/no-store before logging/body parsing. No identity data, accounts or tokens processed. The existing auth.md human email/password/JWT flow is preserved in the revised document; human login is unchanged.

Corrected the news Markdown source mismatch: human Brief and Markdown now use the same fixed upstream, filters, original publisher excerpts, links and distinct source/collection dates. Regression failed before and passed after. No extra production dependency for this correction. Agent guide, skill/digest, ARD, service index and API catalog advertise the real MCP task.

14 Node20 HTTP/unit/lifecycle checks passed, including actual SDK client calls, missing/invalid inputs, origin protection, disabled authentication payload handling, publisher feed forwarding and the news regression. Typecheck, lint and build passed (named logs). Existing MySQL fixture tests were not rerun because SQL/translation code did not change; previous v2 evidence remains separate from this milestone.

## DNS blocker and reviewable proposal

Hostinger editor offers A, MX, AAAA, CNAME, SRV, TXT, CAA, without SVCB/HTTPS. Current DNSKEY and DS queries have no answers; validating resolvers show AD=false; index SVCB is NXDOMAIN. Hostinger's official guide says its nameservers do not support DNSSEC. The DNSSEC screen is a registrar DS-entry form, not an authoritative signing control. No DNS changes have been made.

- Existing8 domain records and nameservers: dns-records-before.json; DNS-only browser excerpt: dns-before.txt.
- Draft service record: dns-proposal.zone. HTTP/2 and /ai/index.ilang verified; key65409 is a private experimental path key, not a registered permanent standard.
- Current DNS-AID draft02 and scanner repair skill retained under references. Published signed record and AD validation still required.
- To resolve this needs provider support, or explicit owner approval to move authoritative DNS to a provider with SVCB/HTTPS and DNSSEC. Keep hosting at Hostinger. Preserve all existing website/mail target values. Hostinger ALIAS records would require a supported flattening equivalent at the new DNS provider. Prevalidate the entire zone before changing NS; enable signing there, then register the exact generated DS at Hostinger. Cloudflare's existing Wrangler OAuth has zone read, not DNS-write scope. No signing keys or DS may be invented.
- DNS rollback must remove a newly registered DS before disabling the matching authoritative signing or restoring unsigned nameservers; use actual exported values. App rollback never changes DNS.

## App rollback

`python3 docs/agent-readiness/2026-10-02-v3/rollback.py` restores only the12 snapshotted application paths to the base release, leaving unrelated .env/local dependencies alone. Inspect the diff, restore lockfile dependencies, rebuild, and commit/push the selected files through the existing Git deployment to revert production. Local restore alone does not roll back live code. Once published, record release commit and live checks here.

Goal is incomplete until the same default profile reaches100 with no failing/unresolved applicable scored items. Do not represent Level5 or construction metadata as operational OAuth.
