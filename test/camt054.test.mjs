import test from 'node:test'
import assert from 'node:assert/strict'
import { createTools } from '../lib/plugin/tools.js'
import { parseCamt054 } from '../lib/core/camt.js'

class T { map = new Map(); get(k){return this.map.get(k)}; entries(){return this.map.entries()}; get size(){return this.map.size}; async put(k,v){this.map.set(k,v)} }

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08">
  <BkToCstmrDbtCdtNtfctn>
    <Ntfctn>
      <Id>N-1</Id>
      <Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>
      <Ntry>
        <Amt Ccy="EUR">1250.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-03-04</Dt></BookgDt>
        <AcctSvcrRef>REF-1</AcctSvcrRef>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">19.99</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <BookgDt><Dt>2026-03-05</Dt></BookgDt>
        <AcctSvcrRef>REF-2</AcctSvcrRef>
      </Ntry>
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`

test('camt.054 entries become bank rows with signed amounts', () => {
  const rows = parseCamt054(xml)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].amount_cents, 125000)
  assert.equal(rows[1].amount_cents, -1999)
  assert.equal(rows[0].account_id, 'DE89370400440532013000')
  assert.equal(rows[1].period, '2026-03')
  assert.equal(rows[0].side, 'bank')
})

test('a camt.053 document is rejected by the 054 parser', () => {
  const camt053 = '<?xml version="1.0"?><Document><BkToCstmrStmt><Stmt><Id>S1</Id></Stmt></BkToCstmrStmt></Document>'
  assert.throws(() => parseCamt054(camt053), /E_BR_CSV_INVALID/)
})

test('the tool stores rows once and reports the count', async () => {
  const tools = Object.fromEntries(createTools({ transactions: new T(), matches: new T(), baseDir: '/tmp/br-camt054' }).map((t) => [t.name, t]))
  const first = await tools['bankrec_ingest_camt054'].execute({ camt_xml: xml }, { callId: 'c' })
  assert.equal(first.rows, 2)
  const second = await tools['bankrec_ingest_camt054'].execute({ camt_xml: xml }, { callId: 'c' })
  assert.equal(second.rows, 0)
})
