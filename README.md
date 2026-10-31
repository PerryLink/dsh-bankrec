# dsh-bankrec

Bank CSV/GL/CAMT.053/MT940 ingest, matching and a 3-sheet reconciliation workpaper for DeepSeek Harness.

> **Status: alpha / public-synthetic / partial / not counted / not GA.** No customer evidence, customer data, or production-readiness claim. All acceptance rows are `counted=false`.

## Install

```sh
dsh plugin --profile <profile> add dsh-bankrec
dsh --profile <profile> --dump-config | grep dsh-bankrec
```

Requires DSH `>=0.2.1-rc.3 <0.3.0` and Node `>=24.9 <25`.

<details>
<summary>中文摘要</summary>

银行流水/GL/CAMT.053/MT940 入库、对账与三表底稿。 安装：`dsh plugin --profile <profile> add dsh-bankrec`。公开/合成、alpha、非 GA。

</details>

## Tools

| Tool | What it does | Risk |
|---|---|---|
| `bankrec.ingest` | Ingest bank CSV/GL rows | R1 local write |
| `bankrec.ingest_camt` | Ingest CAMT.053 XML | R1 local write |
| `bankrec.ingest_mt940` | Ingest MT940 statements | R1 local write |
| `bankrec.reconcile_camt` | Reconcile CAMT opening + entries = closing; require `account_id` when ambiguous | R0 |
| `bankrec.match` | 1:1 match bank rows to GL rows | R0 |
| `bankrec.export` | Export a 3-sheet xlsx: Bank / GL / Matches | R1 local write |

## Input / output

**Input:** bank CSV/GL rows, CAMT.053 XML, or MT940 statements. **Output:** matched/unmatched rows and a 3-sheet reconciliation workpaper. Multi-account CAMT reconciliation requires `account_id` when the account cannot be inferred.

## Configuration

| Env | Default | Meaning |
|---|---|---|
| `DSH_BANKREC_HOME` | `$DSH_HOME/storages/dsh-bankrec` | local domain and exports |

## Limits / non-claims

- No bank API, PDF/OCR statement parsing, or automatic write-back to a bank/ERP.
- 1:1 matching only; no fuzzy multi-to-many reconciliation engine.
- No Client surface and no customer bank data.
- No customer evidence, customer data, or production-readiness claim; all fixtures are public/synthetic.

## Public sample

MIT CAMT.053 and MT940 samples; `ACCEPTANCE.csv` lists 7 public checks.

## Development

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm gate:sku06
```

## License

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
