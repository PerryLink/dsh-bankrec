import { createHash } from 'node:crypto'
import { XMLParser } from 'fast-xml-parser'
import { BankrecError, cents } from './bankrec.js'
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
  const evidence = evidenceSha ?? createHash('sha256').update(text).digest('hex')
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
      out.push({ txn_id: `camt-${account}-${date}-${value}-${index}`, account_id: account, period: date.slice(0, 7), side: 'bank', date, amount_cents: value, reference, evidence_sha256: evidence, created_at: new Date().toISOString() })
    }
  }
  if (out.length === 0) throw new BankrecError('E_BR_CSV_INVALID', 'CAMT has no entries')
  return out
}
