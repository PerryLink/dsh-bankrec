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
  const r = await tools['bankrec_camt056_list'].execute({ camt_xml: xml }, { callId: 'c' })
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

// ISO 20022 names FIToFIPmtCxlReq as the camt.056 root element; BkToCstmrCxlReq is a
// market variant. Real bank feeds use the standard root and were rejected outright.
const standardXml = `<?xml version="1.0"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.056.001.08">
  <FIToFIPmtCxlReq>
    <GrpHdr><MsgId>STD-1</MsgId><CreDtTm>2026-11-05T10:00:00</CreDtTm></GrpHdr>
    <CxlReq>
      <Id>CXL-STD-1</Id>
      <Undrlyg><TxInf>
        <OrgnlInstrId>INS-9</OrgnlInstrId>
        <OrgnlEndToEndId>E2E-STD-1</OrgnlEndToEndId>
        <CxlRsnInf><Rsn><Cd>DUPL</Cd></Rsn></CxlRsnInf>
        <OrgnlTxRef><Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct></OrgnlTxRef>
      </TxInf></Undrlyg>
    </CxlReq>
  </FIToFIPmtCxlReq>
</Document>`

test('the ISO 20022 root FIToFIPmtCxlReq is accepted', () => {
  const r = parseCamt056(standardXml)
  assert.equal(r.length, 1)
  assert.equal(r[0].original_end_to_end_id, 'E2E-STD-1')
  assert.equal(r[0].reason_code, 'DUPL')
  assert.equal(r[0].account, 'DE89370400440532013000')
})

test('original_tx_id falls back to OrgnlInstrId when OrgnlTxId is absent', () => {
  assert.equal(parseCamt056(standardXml)[0].original_tx_id, 'INS-9')
})

test('proprietary reason (CxlRsn/Prtry) and non-IBAN account (Othr/Id) are readable', () => {
  const r = parseCamt056(`<?xml version="1.0"?>
<Document><FIToFIPmtCxlReq>
  <CxlReq><Id>CXL-O-1</Id>
    <Undrlyg><TxInf>
      <OrgnlInstrId>A-1</OrgnlInstrId>
      <OrgnlEndToEndId>E2E-O-1</OrgnlEndToEndId>
      <CxlRsn><Prtry>customer request</Prtry></CxlRsn>
      <OrgnlTxRef><Acct><Id><Othr><Id>6222020200123456789</Id></Othr></Id></Acct></OrgnlTxRef>
    </TxInf></Undrlyg>
  </CxlReq>
</FIToFIPmtCxlReq></Document>`)
  assert.equal(r.length, 1)
  assert.equal(r[0].reason_code, 'customer request')
  assert.equal(r[0].account, '6222020200123456789')
})
