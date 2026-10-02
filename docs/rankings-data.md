# Singles ranking sources

- ATP: the [ATP media reports page](https://www.atptour.com/en/media/rankings-and-stats) links the numerical singles report hosted by ProTennisLive. Fetch `https://www.protennislive.com/posting/ramr/singles_entry_numerical.pdf`, parse with `pdf2json` 3.2.2 (Node >=20.18), and retain the first 150 players, matching the site's existing coverage. The legacy atptour.com PDF path contains an old report and must not be used.
- WTA: https://www.wtatennis.com/rankings/singles (currently 50 players).

Refresh daily at 02:00 UTC, with startup catch-up for snapshots older than 24 hours or a changed source URL. Ranking date and synchronization time are separate fields shown on the website. Reject partial feeds, challenge pages, invalid rows, and ATP reports older than 14 days; never replace a newer saved ranking date with an older one. If upstream fetching fails, retain the existing records and record a failed refresh; there is no ESPN ranking fallback.

Player synchronization preserves IDs, photos, age, and editorial fields that are absent from the official PDF. Preferred-name aliases account for the old provider's three differing names. Neutral nationality entries remain blank. Official reports do not include previous rank, so ATP movement is shown as unknown.

Offline regression fixture: `apps/api/tests/fixtures/atp-official-rankings.pdf`, downloaded from the official URL above, ranking date 2026-09-28. Tests use a fixed clock for reproducibility.

Run `node --test apps/api/tests/tennis-rankings*.test.js apps/web/tests/ranking-filters.test.js`.
