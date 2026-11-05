import test from 'node:test'
import assert from 'node:assert/strict'
import { ibanCheck, ibanNormalize } from '../lib/core/iban.js'
import { createTools } from '../lib/plugin/tools.js'

const tools = Object.fromEntries(createTools({ transactions: { get(){}, entries(){ return [] }, put(){} }, matches: { get(){}, entries(){ return [] }, put(){} }, baseDir: '/tmp' }).map((t) => [t.name, t]))

test('valid IBANs pass mod-97', () => {
  for (const iban of ['DE89370400440532013000', 'GB82WEST12345698765432', 'NL91ABNA0417164300', 'FR1420041010050500013M02606']) {
    const r = ibanCheck(iban)
    assert.equal(r.valid, true, `${iban} should be valid`)
    assert.equal(r.reason, undefined)
  }
})

test('spaces and lowercase are normalised', () => {
  assert.equal(ibanNormalize('de89 3704 0044 0532 0130 00'), 'DE89370400440532013000')
  assert.equal(ibanCheck('de89 3704 0044 0532 0130 00').valid, true)
})

test('bad checksum, charset, length and country length are rejected with stable codes', () => {
  assert.equal(ibanCheck('DE89370400440532013001').reason, 'E_BR_IBAN_CHECKSUM')
  assert.equal(ibanCheck('DE89-3704-0044').reason, 'E_BR_IBAN_CHARSET')
  assert.equal(ibanCheck('DE8937040044053201300').reason, 'E_BR_IBAN_COUNTRY_LENGTH')
  assert.equal(ibanCheck('XX89370400440532013000').reason, 'E_BR_IBAN_CHECKSUM')
})

test('unknown country still gets the generic check', () => {
  const r = ibanCheck('XX00ABC1234567890123')
  assert.equal(r.valid, false)
  assert.equal(r.reason, 'E_BR_IBAN_CHECKSUM')
})

test('tool exposes the same result', async () => {
  const r = await tools['bankrec.iban_check'].execute({ iban: 'GB82WEST12345698765432' }, { callId: 'iban' })
  assert.equal(r.valid, true)
  assert.equal(r.country, 'GB')
})

// Regression guard: the harness validates tool output against the declared schema with
// `additionalProperties: false`, so an undeclared key makes EVERY call fail at runtime
// even though `execute()` returns the right thing. ibanCheck() returns `bban_length`,
// which the schema used to omit. This test fails if a returned key is ever undeclared.
test('every key returned by execute() is declared in the tool output schema', async () => {
  const tool = tools['bankrec.iban_check']
  const declared = new Set(Object.keys(tool.output.schema.properties))
  for (const iban of ['DE89370400440532013000', 'DE89370400440532013001', 'DE89-3704-0044']) {
    const r = await tool.execute({ iban }, { callId: 'schema' })
    for (const key of Object.keys(r)) {
      assert.ok(declared.has(key), `output key "${key}" is not declared in the tool schema`)
    }
    for (const key of declared) {
      assert.ok(tool.output.schema.properties[key].required === undefined || key in r, `required key "${key}" is missing from the output`)
    }
  }
})
