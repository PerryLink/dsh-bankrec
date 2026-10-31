import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseCamt } from '../lib/core/camt.js'

for (const [name, count] of [['test-camt053.xml', 2], ['example-camt053-a.xml', 11]]) {
  test(`public MIT CAMT: ${name}`, () => {
    const rows = parseCamt(readFileSync(`fixtures/public/mit-camt/${name}`, 'utf8'))
    assert.equal(rows.length, count)
    assert.ok(rows.every((row) => row.side === 'bank'))
    assert.ok(rows.some((row) => row.amount_cents < 0))
    assert.ok(rows.some((row) => row.amount_cents > 0))
  })
}
