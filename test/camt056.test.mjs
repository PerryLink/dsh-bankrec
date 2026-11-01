import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCamt056 } from '../lib/core/camt.js'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k){return this.map.get(k)}; entries(){return this.map.entries()}; get size(){return this.map.size}; async put(k,v){this.map.set(k,v)} }
const tools = Object.fromEntries(createTools({ transactions: new T(), matches: new T(), baseDir: '/tmp/br-056' }).map((t) => [t.name, t]))
const xml = `<?xml version="1.0"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.056.001.08">
  <BkToCstmrCxlReq>
    <CxlReq>
      <Id>CXL-1</Id>
      <Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>
      <Undrlyg>
        <TxInf>
          <OrgnlTxId>TXN-100</OrgnlTxId>
          <OrgnlEndToEndId>E2E-100</OrgnlEndToEndId>
          <CxlRsnInf><Rsn><Cd>DUPL</Cd></Rsn></CxlRsnInf>
        </TxInf>
        <TxInf>
          <OrgnlTxId>TXN-101</OrgnlTxId>
          <CxlRsnInf><Rsn><Prtry>customer request</Prtry></Rsn></CxlRsnInf>
        </TxInf>
      </Undrlyg>
    </CxlReq>
  </BkToCstmrCxlReq>
</Document>`

test('cancellation requests expose original ids and reasons', async () => {
  const r = await tools['bankrec.camt056_list'].execute({ camt_xml: xml }, { callId: 'c' })
  assert.equal(r.requests, 2)
  assert.equal(r.items[0].original_tx_id, 'TXN-100')
  assert.equal(r.items[0].original_end_to_end_id, 'E2E-100')
  assert.equal(r.items[0].reason_code, 'DUPL')
  assert.equal(r.items[0].account, 'DE89370400440532013000')
  assert.equal(r.items[1].reason_code, 'customer request')
})

test('a document without cancellation requests is rejected', () => {
  assert.throws(() => parseCamt056('<Document><BkToCstmrStmt/></Document>'), /E_BR_CSV_INVALID/)
})
