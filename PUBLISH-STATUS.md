# PUBLISH-STATUS — @perrylink/dsh-bankrec
## 0.1.0-alpha.0 — verified 2026-10-31T07:10+08:00
- `dist-tags`: latest/next `0.1.0-alpha.0`; shasum `30204224bc5cf12074c496af44d06e4bde8d3005`.
- Registry tarball install into a temp DSH profile passed; layer contains `dsh-bankrec`.
- First-package propagation took a few minutes; no unpublish/deprecate.

## 0.1.0-alpha.1 — CAMT.053 (2026-10-31)

- `latest`/`next` moved to alpha.1 after propagation.
- Added `bankrec.ingest_camt` with 2 MIT public CAMT.053 samples (2 + 11 entries); 5 gate rows, 3 tests.
- Public sample licenses/source in `fixtures/public/mit-camt/`; not in npm tarball.

## 0.1.0-alpha.2 — CAMT balance identity (2026-10-31)

- Added `bankrec.reconcile_camt`; MIT test-camt053 balances: opening 100000 + net -5000 = closing 95000.
- Tests pass; gate 6 rows.

## 0.1.0-alpha.3 — multi-account CAMT (2026-10-31)

- `bankrec.reconcile_camt` now supports `account_id` and rejects ambiguous multi-account input; MIT multi-account sample test.
- Tests pass; gate 6 rows.
