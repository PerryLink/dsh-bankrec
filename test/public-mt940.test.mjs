import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k){return this.map.get(k)}; entries(){return this.map.entries()}; get size(){return this.map.size}; async put(k,v){this.map.set(k,v)} }

test('public MIT MT940 ingest', async () => {
  const text = readFileSync('fixtures/public/mit-mt940/mt940-statement.sta', 'utf8')
  const tools = createTools({ transactions: new T(), matches: new T(), baseDir: '/tmp/bank-mt940' })
  const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
  const result = await byName['bankrec.ingest_mt940'].execute({ mt940_text: text }, { callId: 'mt940' })
  assert.equal(result.rows, 5)
  assert.equal(result.account, 'NL91ABNA0417164300')
})
