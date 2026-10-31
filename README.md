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

## 中文说明

银行流水/GL/CAMT.053/MT940 入库、对账与三表底稿。**公开/合成、alpha、非 GA**；没有客户银行数据。

### 安装

```sh
dsh plugin --profile <profile> add dsh-bankrec
```

### 工具

| 工具 | 作用 |
|---|---|
| `bankrec.ingest` | 银行 CSV/GL 入库 |
| `bankrec.ingest_camt` | CAMT.053 XML 入库 |
| `bankrec.ingest_mt940` | MT940 对账单入库 |
| `bankrec.reconcile_camt` | 期初 + 明细 = 期末；多账户必须给 `account_id` |
| `bankrec.match` | 银行行与 GL 行 1:1 匹配 |
| `bankrec.export` | 银行 / GL / 匹配三张表 |

### 输入 / 输出

输入银行 CSV/GL、CAMT.053 或 MT940；输出匹配/未匹配行和三表对账底稿。

### 边界

- 不连银行 API，不做 PDF/OCR 流水，不自动写回银行/ERP。
- 只做 1:1 匹配，不做模糊多对多对账引擎。
- 无 Client，无客户银行数据。

## Development

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm gate:sku06
```

## License

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
