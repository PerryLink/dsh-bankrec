import { XMLParser } from 'fast-xml-parser'
import { BankrecError, cents, sha256Hex, txnId } from './bankrec.js'
import type { TxnRecord } from '../plugin/storage.js'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true, parseTagValue: false, trimValues: true, processEntities: false })
const asArray = (value: unknown): any[] => Array.isArray(value) ? value : value === undefined ? [] : [value]
const asObject = (value: unknown): any => value && typeof value === 'object' && !Array.isArray(value) ? value : undefined
function scalar(value: unknown): string { if (value === null || value === undefined) return ''; if (typeof value !== 'object') return String(value); const o = value as any; return String(o['#text'] ?? ''); }
function dateOf(entry: any): string { const d = scalar(entry.BookgDt?.Dt) || scalar(entry.BookgDt?.DtTm) || scalar(entry.ValDt?.Dt) || scalar(entry.ValDt?.DtTm); return d.slice(0, 10) }

export function parseCamt(text: string, accountOverride?: string, evidenceSha?: string): TxnRecord[] {
  let root: any
  try { root = parser.parse(text) } catch { throw new BankrecError('E_BR_CSV_INVALID', 'CAMT XML is not parseable') }
  const statements = asArray(asObject(root?.Document)?.BkToCstmrStmt?.Stmt)
  if (statements.length === 0) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT has no BkToCstmrStmt/Stmt')
  const evidence = evidenceSha ?? sha256Hex(text)
  const out: TxnRecord[] = []
  for (const stmt of statements) {
    const iban = scalar(stmt?.Acct?.Id?.IBAN) || scalar(stmt?.Acct?.Id?.Othr?.Id)
    const account = accountOverride?.trim() || iban
    if (!account) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT statement has no account/IBAN')
    for (const [index, entry] of asArray(stmt?.Ntry).entries()) {
      const amount = scalar(entry?.Amt)
      const sign = scalar(entry?.CdtDbtInd).toUpperCase() === 'DBIT' ? -1 : 1
      const value = sign * cents(amount)
      const date = dateOf(entry)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BankrecError('E_BR_CSV_INVALID', `CAMT entry has no booking date (${index})`)
      const details = entry?.NtryDtls?.TxDtls
      const reference = scalar(entry?.AcctSvcrRef) || scalar(details?.Refs?.TxId) || scalar(details?.Refs?.EndToEndId) || scalar(details?.RmtInf?.Ustrd) || scalar(details?.RmtInf?.Strd?.CdtrRefInf?.Ref) || 'camt'
      const period = date.slice(0, 7)
      out.push({ txn_id: txnId('camt', account, period, evidence, [date, value, reference, out.length]), account_id: account, period, side: 'bank', date, amount_cents: value, reference, evidence_sha256: evidence, created_at: new Date().toISOString() })
    }
  }
  if (out.length === 0) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT has no entries')
  return out
}

export interface CamtBalance { account: string; type: string; amount_cents: number; date: string }

export function parseCamtBalances(text: string): CamtBalance[] {
  let root: any
  try { root = parser.parse(text) } catch { throw new BankrecError('E_BR_CSV_INVALID', 'CAMT XML is not parseable') }
  const statements = asArray(asObject(root?.Document)?.BkToCstmrStmt?.Stmt)
  const balances: CamtBalance[] = []
  for (const stmt of statements) {
    const account = scalar(stmt?.Acct?.Id?.IBAN) || scalar(stmt?.Acct?.Id?.Othr?.Id)
    for (const bal of asArray(stmt?.Bal)) {
      const type = scalar(bal?.Tp?.CdOrPrtry?.Cd)
      const raw = scalar(bal?.Amt)
      if (!type || !raw) continue
      const sign = scalar(bal?.CdtDbtInd).toUpperCase() === 'DBIT' ? -1 : 1
      balances.push({ account, type, amount_cents: sign * cents(raw), date: scalar(bal?.Dt?.Dt) || scalar(bal?.Dt?.DtTm).slice(0, 10) })
    }
  }
  return balances
}


/** camt.054 debit/credit notification entries (BkToCstmrDbtCdtNtfctn/Ntfctn), same row shape as camt.053. */
export function parseCamt054(text: string, accountOverride?: string, evidenceSha?: string): TxnRecord[] {
  let root: any
  try { root = parser.parse(text) } catch { throw new BankrecError('E_BR_CSV_INVALID', 'CAMT.054 XML is not parseable') }
  const notifications = asArray(asObject(root?.Document)?.BkToCstmrDbtCdtNtfctn?.Ntfctn)
  if (notifications.length === 0) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT.054 has no BkToCstmrDbtCdtNtfctn/Ntfctn')
  const evidence = evidenceSha ?? sha256Hex(text)
  const out: TxnRecord[] = []
  for (const notification of notifications) {
    const iban = scalar(notification?.Acct?.Id?.IBAN) || scalar(notification?.Acct?.Id?.Othr?.Id)
    const account = accountOverride?.trim() || iban
    if (!account) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT.054 notification has no account/IBAN')
    const notificationId = scalar(notification?.Id) || 'ntfctn'
    for (const [index, entry] of asArray(notification?.Ntry).entries()) {
      const amount = scalar(entry?.Amt)
      const sign = scalar(entry?.CdtDbtInd).toUpperCase() === 'DBIT' ? -1 : 1
      const value = sign * cents(amount)
      const date = dateOf(entry)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BankrecError('E_BR_CSV_INVALID', `CAMT.054 entry has no booking date (${index})`)
      const details = entry?.NtryDtls?.TxDtls
      const reference = scalar(entry?.AcctSvcrRef) || scalar(details?.Refs?.TxId) || scalar(details?.Refs?.EndToEndId) || scalar(details?.RmtInf?.Ustrd)
      const period = date.slice(0, 7)
      out.push({ txn_id: txnId('camt054', account, period, evidence, [date, value, reference, out.length]), account_id: account, period, side: 'bank', date, amount_cents: value, reference, evidence_sha256: evidence, created_at: new Date().toISOString() })
    }
  }
  if (out.length === 0) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT.054 has no entries')
  return out
}

export interface Camt056Request {
  cancellation_id: string
  original_tx_id: string
  original_end_to_end_id: string
  reason_code: string
  account: string
}
/** camt.056 payment cancellation requests (BkToCstmrCxlReq/CxlReq) — read-only extraction. */
export function parseCamt056(text: string): Camt056Request[] {
  let root: any
  try { root = parser.parse(text) } catch { throw new BankrecError('E_BR_CSV_INVALID', 'CAMT.056 XML is not parseable') }
  const requests = asArray(asObject(root?.Document)?.BkToCstmrCxlReq?.CxlReq)
  if (requests.length === 0) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT.056 has no BkToCstmrCxlReq/CxlReq')
  const out: Camt056Request[] = []
  for (const [index, req] of requests.entries()) {
    const infos = asArray(req?.Undrlyg?.TxInf)
    for (const [inner, tx] of infos.entries()) {
      out.push({
        cancellation_id: `${scalar(req?.Id) || 'cxl'}-${index}-${inner}`,
        original_tx_id: scalar(tx?.OrgnlTxId),
        original_end_to_end_id: scalar(tx?.OrgnlEndToEndId),
        reason_code: scalar(tx?.CxlRsnInf?.Rsn?.Cd) || scalar(tx?.CxlRsnInf?.Rsn?.Prtry),
        account: scalar(tx?.OrgnlTxRef?.Acct?.Id?.IBAN) || scalar(req?.Acct?.Id?.IBAN),
      })
    }
  }
  if (out.length === 0) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT.056 has no transaction info')
  return out
}
