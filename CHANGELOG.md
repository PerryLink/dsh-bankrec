# Changelog

## [0.1.0-alpha.14] — 2026-11-01

### Added

- `bankrec.camt056_list`: read CAMT.056 payment cancellation requests (original transaction id, end-to-end id, reason code, account). Read-only; nothing is cancelled. Verified by `node --test test/*.test.mjs` (17/17).

## [Unreleased]

### Added

- `bankrec.ingest_camt054`: parse CAMT.054 debit/credit notifications (`BkToCstmrDbtCdtNtfctn`) into the same bank rows as camt.053, with signed amounts and duplicate-safe storage. Verified by `node --test test/*.test.mjs` (15/15).

## [Unreleased]

### Added

- `bankrec.iban_check`: IBAN validation per ISO 13616 (charset, country BBAN length, ISO 7064 mod 97-10). Verified by `node --test test/iban.test.mjs` (5/5) and the full suite (12/12); no third-party code or fixtures.

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
