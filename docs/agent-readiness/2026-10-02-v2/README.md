# Agent readiness follow-up — 2026-10-02 v2

Goal remains **incomplete**. No production deployment or final default-profile 100 scan has occurred. The prior browser baseline remains 20/100 at 13:07:20 Asia/Shanghai; it is not a new final score. Live homepage and skills-index response headers are saved here: the current public skills-index path still returns HTML, showing the local discovery changes are not deployed.

## Concrete changes and verification

- Fixed partial article translations: translated title no longer mislabels the original body language. Returns `language`, `title_language`, `translation_available`, `translation_complete`. The regression failed against the original implementation (`translation-regression-before.txt`) and passes after the change.
- Sources include `?article=ID#article-ID`. Human stories lookup explicitly retrieves an older approved item outside the normal latest 50, places it first, expands it and scrolls to it. Invalid identifiers are ignored; retrieval still requires approved status. A real browser opened a fixture older than 51 newer stories and displayed the complete original body and translated title.
- Fixed missing story labels in active locale JSON files for all six supported languages. Existing user changes were preserved; only the missing stories namespace was added.
- OpenAPI documents the actual returned fields and translation qualifiers. Article projection excludes non-string player names.
- Official Node 20.19.1 macOS ARM runtime downloaded from nodejs.org; SHA256 compared with official SHASUMS256.txt (`node20-runtime.json`). No production dependency or application runtime setting changed.
- **7 unit/HTTP tests passed on Node20** (`unit-http-node20.txt`). **6 real MySQL SQL/HTTP integration tests passed on Node20** (`mysql-integration-node20.txt`), using only synthetic records in a disposable loopback Docker MySQL8.4 fixture. Tested approved-only filtering, private fields, original-text search, full reads, dates, complete/partial translations, unknown/draft/injection-shaped IDs, deterministic bounded paging, literal percent queries, real article Markdown and actual storage-outage 503 behavior. This does not prove access to production MySQL.
- SDK1.31.0 candidate lifecycle passed on Node20 (`mcp-isolated-node20.json`); it remains isolated and unmounted pending dependency approval.
- `npm run typecheck`, `npm run lint`, `npm run build` passed using Node20 (`*-node20.txt`). Browser used the actual registered WebMCP article tool against the fixture DB; `browser-article-response.json` preserves the result and qualifications. No production publication or account creation occurred.

## Reproduce the database checks

Start a **new disposable loopback fixture**, not a production database:

```sh
docker run --rm -d --name tennishub-agent-fixture-qa -p 127.0.0.1::3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=tennishub_agent_fixture mysql:8.4
docker port tennishub-agent-fixture-qa 3306/tcp
```

Wait until `docker exec tennishub-agent-fixture-qa mysqladmin ping --silent` succeeds, then pass the reported localhost port:

```sh
TZ=UTC AGENT_FIXTURE_MYSQL_PORT=REPORTED_PORT node --test apps/api/tests/agent-lookup-mysql.test.js
node --test apps/api/tests/agent-discovery.test.js
docker stop tennishub-agent-fixture-qa
```

The database test overwrites connection configuration to localhost/root/empty password and the exact fixture schema; it creates and cleans its own table. The empty password is confined to disposable synthetic testing. Browser SQL seeding must use `mysql --default-character-set=utf8mb4` to preserve Unicode (`browser-fixture.sql`). Production credentials were never used.

## Remaining required work

- Await affirmative approval to add official `@modelcontextprotocol/sdk` to production dependencies, then mount the tested service and advertise its operational card.
- Obtain Hostinger deployment and DNS access. Native Chrome inspection reported that the Mac is locked and manual unlock is required. No Hostinger/Cloudflare/deployment/DNS tokens exist in the authorized project environment; the configured supplemental env file contains unrelated AI-provider/Postgres settings, not the needed access.
- The review-only `pending/agent-auth-construction.js` implements the explicitly disclosed planned-contract option from the user prompt. Tests passed on Node20 (`auth-construction-candidate-test.json`): matching issuer/resource, all capabilities disabled/planned, all reserved operations return 503/no-store without parsing identity bodies, human login documented accurately, public lookup still accessible. This candidate is not mounted. Owner acceptance is required by the original prompt before using construction metadata; a separate question asks whether to accept it or require operational OAuth.
- Publish and validate DNS-AID and DNSSEC, deploy with a release snapshot and rollback, verify the actual canonical CDN hostname and real records/operations, and rescan unchanged current default All Checks. A local test or isolated SDK lifecycle cannot satisfy these live requirements.

The pending user decisions remain necessary: unlock the Mac/open the logged-in Hostinger site management pages, approve the new production dependency, and accept disclosed construction-only agent OAuth or specify a working OAuth service. Goal has not been marked complete. No task is confirmed running for production deployment; local test services are stopped after verification.

## Rollback

The original v1 rollback manifest now includes all extra files first modified in v2. To undo this entire task and preserve the user's earlier unrelated edits:

```sh
python3 docs/agent-readiness/2026-10-02-v1/rollback.py
npm run build
```

To revert only this follow-up milestone to the v1 state, run `python3 docs/agent-readiness/2026-10-02-v2/rollback.py`. Neither rollback command changes DNS or a live deployment.
