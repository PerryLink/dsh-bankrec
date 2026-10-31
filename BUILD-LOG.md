# BUILD-LOG — @perrylink/dsh-bankrec
## 2026-10-31 — S1
- 3 tools; bankrec domain; xlsx 3 sheets; test 2/2; gate 4/4. Publish pending.
### Publish verified
- dist-tags latest/next alpha.0; tarball install/layer passed.

### alpha.1 — CAMT.053

- Added `bankrec.ingest_camt`; 2 MIT public CAMT samples (2 + 11 entries); test/gate include public sample.

### alpha.1 verified

- `latest`/`next` alpha.1; tests 3/3; gate 5 rows; CAMT samples 2 + 11 entries.

### alpha.2 — CAMT balance identity

- Added `bankrec.reconcile_camt`; test/acceptance against MIT test-camt053 (balanced).

### alpha.3 — multi-account CAMT

- Balance reconciliation filters by account; test uses MIT multi-account sample.
