#!/usr/bin/env node
/**
 * Quickstart runner for the shipped synthetic sample.
 *
 *   node samples/quickstart/run.mjs          # human-readable transcript (screenshot source)
 *   node samples/quickstart/run.mjs --json   # canonical result used as the gold file
 *
 * Everything runs locally against `samples/quickstart/input/`; nothing is uploaded and no
 * customer data is involved. The export is written to a temporary directory that is removed
 * afterwards, so the sample never writes into the checkout.
 */
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTools } from '../../lib/plugin/tools.js'
import { parseCsv, sha256Hex } from '../../lib/core/bankrec.js'
import { readWorkbook } from '../../lib/core/xlsx-lite.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const readInput = (name) => readFileSync(path.join(root, 'samples', 'quickstart', 'input', name), 'utf8')
const sha = (value) => createHash('sha256').update(value).digest('hex')
const money = (cents) => (cents / 100).toFixed(2)

class MemoryTable {
  map = new Map()
  get(key) { return this.map.get(key) }
  entries() { return this.map.entries() }
  async put(key, value) { this.map.set(key, value) }
}

async function run() {
  const account = 'ACC-SYN-001'
  const period = '2026-03'
  const bankCsv = readInput('bank.csv')
  const glCsv = readInput('gl.csv')
  const camt053 = readInput('camt053.xml')
  const camt054 = readInput('camt054.xml')
  const camt056 = readInput('camt056.xml')
  const mt940 = readInput('mt940.sta')
  const iban = 'DE89370400440532013000'

  const baseDir = await mkdtemp(path.join(os.tmpdir(), 'dsh-bankrec-quickstart-'))
  try {
    const tools = Object.fromEntries(createTools({
      transactions: new MemoryTable(),
      matches: new MemoryTable(),
      baseDir,
    }).map((tool) => [tool.name, tool]))
    const call = (name, args) => tools[name].execute(args, { callId: 'quickstart' })

    const ingest = await call('bankrec.ingest', {
      account_id: account,
      period,
      bank_csv: bankCsv,
      gl_csv: glCsv,
    })
    const match = await call('bankrec.match', { account_id: account, period })
    const exported = await call('bankrec.export', { account_id: account, period })
    const workbook = readWorkbook(await readFile(exported.path))

    const bankRows = parseCsv(bankCsv, 'bank', account, period, sha256Hex(bankCsv))
    const glRows = parseCsv(glCsv, 'gl', account, period, sha256Hex(glCsv))
    const refOf = new Map([...bankRows, ...glRows].map((row) => [row.txn_id, row.reference]))
    const unmatchedBank = match.unmatched_bank.map((id) => refOf.get(id) ?? id).sort()
    const unmatchedGl = match.unmatched_gl.map((id) => refOf.get(id) ?? id).sort()

    const camt = await call('bankrec.ingest_camt', { camt_xml: camt053, account_id: account })
    const balance = await call('bankrec.reconcile_camt', { camt_xml: camt053 })
    const notifications = await call('bankrec.ingest_camt054', { camt_xml: camt054, account_id: account })
    const cancellations = await call('bankrec.camt056_list', { camt_xml: camt056 })
    const mt = await call('bankrec.ingest_mt940', { mt940_text: mt940, account_id: account })
    const ibanResult = await call('bankrec.iban_check', { iban })

    const summary = {
      package: 'dsh-bankrec',
      sample: 'synthetic/quickstart',
      account_id: account,
      period,
      bank_rows: ingest.bank_rows,
      gl_rows: ingest.gl_rows,
      matched: match.matched,
      unmatched_bank: unmatchedBank,
      unmatched_gl: unmatchedGl,
      workpaper: {
        sheets: workbook.sheets.map((sheet) => sheet.name),
        rows: workbook.sheets.map((sheet) => sheet.rows.length),
      },
      camt053: {
        rows: camt.rows,
        opening_cents: balance.opening_cents,
        closing_cents: balance.closing_cents,
        net_cents: balance.net_cents,
        difference_cents: balance.difference_cents,
        balanced: balance.balanced,
      },
      camt054_rows: notifications.rows,
      camt056_requests: cancellations.requests,
      camt056_reason_codes: cancellations.items.map((item) => item.reason_code).sort(),
      mt940_rows: mt.rows,
      iban: { valid: ibanResult.valid, country: ibanResult.country },
      input_sha256: {
        'bank.csv': sha(bankCsv),
        'gl.csv': sha(glCsv),
        'camt053.xml': sha(camt053),
        'mt940.sta': sha(mt940),
      },
    }

    if (process.argv.includes('--json')) {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
      return
    }

    const lines = [
      'dsh-bankrec quickstart - synthetic sample, not customer data',
      `[1/5] ingest bank+GL CSV .......... bank=${ingest.bank_rows} gl=${ingest.gl_rows}`,
      `[2/5] 1:1 match ................... matched=${match.matched}, unmatched bank=${unmatchedBank.length}, gl=${unmatchedGl.length}`,
      `[3/5] export 3-sheet workpaper .... ${workbook.sheets.map((sheet) => sheet.name).join('/')} rows=${workbook.sheets.map((sheet) => sheet.rows.length).join('/')}`,
      `[4/5] CAMT.053 balance ............ opening ${money(balance.opening_cents)} + net ${money(balance.net_cents)} = closing ${money(balance.closing_cents)} ${balance.balanced ? 'OK' : 'DIFF'}`,
      `[5/5] CAMT.054 / CAMT.056 / MT940 / IBAN ... ${notifications.rows} rows / ${cancellations.requests} request / ${mt.rows} rows / ${ibanResult.valid ? 'valid' : 'invalid'}`,
      `result: matched=${match.matched} unmatched=${unmatchedBank.length}+${unmatchedGl.length} workpaper=${workbook.sheets.length} sheets`,
      `unmatched bank: ${unmatchedBank.join(', ') || 'none'}`,
      `unmatched GL:   ${unmatchedGl.join(', ') || 'none'}`,
      'quickstart ok',
    ]
    process.stdout.write(`${lines.join('\n')}\n`)
  } finally {
    await rm(baseDir, { recursive: true, force: true })
  }
}

await run()
