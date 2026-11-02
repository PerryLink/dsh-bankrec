import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k) { return this.map.get(k) }; entries() { return this.map.entries() }; get size() { return this.map.size }; async put(k, v) { this.map.set(k, v) } }

const bank = 'date,amount,reference\n2026-01-01,100.00,A\n2026-01-03,50.00,B'
const gl = 'date,amount,reference\n2026-01-02,100.00,A\n2026-01-04,50.00,B'

async function setup(dir) {
  const transactions = new T()
  const matches = new T()
  const tools = createTools({ transactions, matches, baseDir: path.join(dir, 'store') })
  return { transactions, by: Object.fromEntries(tools.map((tool) => [tool.name, tool])), exec: { callId: 'idem' } }
}

test('re-ingesting the same bank/GL CSVs is idempotent and reports skipped rows', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-bankrec-idem-'))
  try {
    const { transactions, by, exec } = await setup(dir)
    const first = await by['bankrec.ingest'].execute({ account_id: 'A1', period: '2026-01', bank_csv: bank, gl_csv: gl }, exec)
    assert.equal(first.skipped, 0)
    assert.equal(transactions.size, 4)
    const second = await by['bankrec.ingest'].execute({ account_id: 'A1', period: '2026-01', bank_csv: bank, gl_csv: gl }, exec)
    assert.equal(second.skipped, 4)
    assert.equal(transactions.size, 4)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('identical movements in two accounts no longer overwrite each other', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-bankrec-idem-'))
  try {
    const { transactions, by, exec } = await setup(dir)
    await by['bankrec.ingest'].execute({ account_id: 'A1', period: '2026-01', bank_csv: bank, gl_csv: gl }, exec)
    await by['bankrec.ingest'].execute({ account_id: 'A2', period: '2026-01', bank_csv: bank, gl_csv: gl }, exec)
    assert.equal(transactions.size, 8)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('the same account/period from a different file keeps both rows', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-bankrec-idem-'))
  try {
    const { transactions, by, exec } = await setup(dir)
    await by['bankrec.ingest'].execute({ account_id: 'A1', period: '2026-01', bank_csv: bank, gl_csv: gl }, exec)
    const variant = bank + '\n'
    await by['bankrec.ingest'].execute({ account_id: 'A1', period: '2026-01', bank_csv: variant, gl_csv: gl }, exec)
    // Two extra bank rows from the new evidence hash; GL rows are unchanged and skipped.
    assert.equal(transactions.size, 6)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('MT940 re-ingest is idempotent', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-bankrec-idem-'))
  try {
    const { transactions, by, exec } = await setup(dir)
    const text = readFileSync('fixtures/public/mit-mt940/mt940-statement.sta', 'utf8')
    const first = await by['bankrec.ingest_mt940'].execute({ mt940_text: text }, exec)
    assert.equal(first.rows, 5)
    const second = await by['bankrec.ingest_mt940'].execute({ mt940_text: text }, exec)
    assert.equal(second.rows, 0)
    assert.equal(second.skipped, 5)
    assert.equal(transactions.size, 5)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
