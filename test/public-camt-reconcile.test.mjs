import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createTools } from '../lib/plugin/tools.js'

class T {
  map = new Map()
  get(key) { return this.map.get(key) }
  entries() { return this.map.entries() }
  get size() { return this.map.size }
  async put(key, value) { this.map.set(key, value) }
}

test('public MIT CAMT: opening + entries = closing', async () => {
  const xml = readFileSync('fixtures/public/mit-camt/test-camt053.xml', 'utf8')
  const tools = createTools({ transactions: new T(), matches: new T(), baseDir: '/tmp/bank-public' })
  const reconcile = tools.find((tool) => tool.name === 'bankrec.reconcile_camt')
  const result = await reconcile.execute({ camt_xml: xml }, { callId: 'camt-reconcile' })
  assert.equal(result.opening_cents, 100000)
  assert.equal(result.closing_cents, 95000)
  assert.equal(result.net_cents, -5000)
  assert.equal(result.balanced, true)
})
