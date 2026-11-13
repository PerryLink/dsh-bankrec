# Changelog

## [0.2.0] — 2026-11-13

### Breaking

- **Tool names no longer contain a dot.** The nine tools are now `bankrec_ingest`, `bankrec_match`, `bankrec_ingest_camt`, `bankrec_export`, `bankrec_ingest_mt940`, `bankrec_reconcile_camt`, `bankrec_iban_check`, `bankrec_ingest_camt054` and `bankrec_camt056_list`. Providers validate `tools[].name` against `^[a-zA-Z0-9_-]+$`; the old dotted names invalidated the whole `tools` array, so the plugin registered but every request carrying its tools was rejected with `Invalid 'tools[N].name'`. Minor bump because tool names are part of the 0.1.0 compatibility promise — update prompts, saved calls and permission rules that still use the old dotted names.
- `test/tool-name-wire.test.mjs` pins the wire pattern so a new tool cannot reintroduce a dot or drop the `bankrec_` namespace.
- Earlier changelog entries use the new spelling, so a repository-wide search no longer finds dotted tool names.

## [0.1.2] — 2026-11-13

### Fixed

- **CAMT.056 now accepts the ISO 20022 root.** `camt056_list` only looked under `BkToCstmrCxlReq/CxlReq`; the standard root element is `FIToFIPmtCxlReq`, so real bank feeds were rejected with `E_BR_CSV_INVALID`. Both roots are accepted, together with `OrgnlInstrId` as the original-transaction-id fallback, proprietary reason codes (`CxlRsn/Prtry`) and non-IBAN accounts (`Othr/Id`). (#8, fixes #7)
- **`iban_check` declares `bban_length`.** The output schema listed four of the five keys `ibanCheck()` returns while setting `additionalProperties: false`, so every call failed harness schema validation even though `execute()` returned the right object. A regression test now asserts that every returned key is declared. (fixes #7)

## [0.1.0] — 2026-11-02

### Stable

- First non-alpha release: the CLI surface and the tool names in this package are now
  covered by a compatibility promise (breaking changes require a minor bump).
- Ships a quickstart sample, a one-line prompt, a permission block and real captures,
  so the package can be tried without reading the source.

## [0.1.0] — 2026-11-01

### Packaging

- Package Standard v1: shipped `samples/quickstart/` (synthetic bank/GL CSV, CAMT.053/.054/.056, MT940 + real-output gold `expected/result.json` + runner), `dsh.demo` metadata, README-zh eight blocks (including the demo prompt and permission lines), `docs/assets/quickstart.png` rendered from a real run, and a `PS1-QS01` acceptance row. `npm pack --dry-run` contains `samples/quickstart/*`; `node --test test/*.test.mjs` 35/35.
- The three most common errors now read `<what happened>（E_XXX）｜下一步：<action>`; `TROUBLESHOOTING.md` lists the three cases with symptom/cause/action.

### Security / Fixes

- Path-traversal guard, account/period/evidence-scoped transaction ids (no cross-account overwrite), MT940 amounts parsed by grammar instead of blind dot stripping, idempotent re-import.


### Added

- `bankrec_camt056_list`: read CAMT.056 payment cancellation requests (original transaction id, end-to-end id, reason code, account). Read-only; nothing is cancelled. Verified by `node --test test/*.test.mjs` (17/17).

## [Unreleased]

### Added

- `bankrec_ingest_camt054`: parse CAMT.054 debit/credit notifications (`BkToCstmrDbtCdtNtfctn`) into the same bank rows as camt.053, with signed amounts and duplicate-safe storage. Verified by `node --test test/*.test.mjs` (15/15).

## [Unreleased]

### Added

- `bankrec_iban_check`: IBAN validation per ISO 13616 (charset, country BBAN length, ISO 7064 mod 97-10). Verified by `node --test test/iban.test.mjs` (5/5) and the full suite (12/12); no third-party code or fixtures.

## [0.1.0-alpha.10] — 2026-11-01

### Changed

- Documentation: five-language fixture/acceptance links now resolve on npm; added specific related-checker/tool links.
- Marketplace metadata: taxonomy category, archetype, domains and status; docs page now shows the same.
- Added a real terminal hero (and GIF for the active docs set) plus `TROUBLESHOOTING.md`.

All notable changes to `dsh-bankrec` are documented here. The format follows Keep a Changelog; this project uses alpha versions.

## [0.1.0-alpha.9] — 2026-11-01

### Added

- Five-language READMEs: English, 简体中文, Español, Português, हिन्दी.
- Local workflow SVG at `docs/assets/dsh-bankrec-flow.svg`.
- Family cross-links (domain index, checker family, `dsh-kit`), compatibility, permissions, and related-work sections.
- Standard repository files: `SECURITY.md`, `PRIVACY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, and `icon.svg`.

### Changed

- README aligned with the PerryLink DSH checker/plugin family style; package remains public/synthetic, alpha, not GA.

## [Earlier]

Earlier alpha builds are available from npm and GitHub Releases; this file starts at the family-standard documentation wave.
