import test from 'node:test'
import assert from 'node:assert/strict'
import { parseMt940, parseMt940Amount, parseMt940Balances } from '../lib/core/mt940.js'

test('a decimal comma means cents: 100,50 -> 10050', () => {
  assert.equal(parseMt940Amount('100,50'), 10050)
  assert.equal(parseMt940Amount('12,5'), 1250)
  assert.equal(parseMt940Amount('0,01'), 1)
})

test('dots are thousands separators: 1.234,56 -> 123456', () => {
  assert.equal(parseMt940Amount('1.234,56'), 123456)
  assert.equal(parseMt940Amount('1.234.567,89'), 123456789)
  assert.equal(parseMt940Amount('100'), 10000)
})

test('non-compliant 100.50 is rejected with E_BR_CSV_INVALID', () => {
  assert.throws(() => parseMt940Amount('100.50'), /E_BR_CSV_INVALID/)
  assert.throws(() => parseMt940Amount('1,234'), /E_BR_CSV_INVALID/)
  assert.throws(() => parseMt940Amount(''), /E_BR_CSV_INVALID/)
})

test('the :61: parser uses the same amount grammar', () => {
  const ok = parseMt940(':25:NL91ABNA0417164300\n:61:2609010901CR100,50NTRFREF//X\n')
  assert.equal(ok[0].amount_cents, 10050)
  assert.throws(() => parseMt940(':25:NL91ABNA0417164300\n:61:2609010901CR100.50NTRFREF//X\n'), /E_BR_CSV_INVALID/)
})

test('balances use the same decimal-comma grammar', () => {
  const balances = parseMt940Balances(':60F:C260831EUR1.234,56\n:62F:C260930EUR1.000,00')
  assert.equal(balances.opening_cents, 123456)
  assert.equal(balances.closing_cents, 100000)
})

test('the public MT940 fixture keeps its signed decimal-comma amounts', () => {
  const text = [
    ':25:NL91ABNA0417164300',
    ':61:2609010901CR2500,00NTRF//BR001',
    ':61:2609020902DR120,45NDDT//BR002',
  ].join('\n')
  const rows = parseMt940(text)
  assert.deepEqual(rows.map((row) => row.amount_cents), [250000, -12045])
})
