import { BankrecError, sha256Hex, txnId } from './bankrec.js'
import type { TxnRecord } from '../plugin/storage.js'

function dateOf(yymmdd: string): string {
  if (!/^\d{6}$/.test(yymmdd)) throw new BankrecError('E_BR_CSV_INVALID', `MT940 bad date: ${yymmdd}`)
  return `20${yymmdd.slice(0, 2)}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`
}

/** MT940 amount grammar: decimal comma, dot only as thousands separator (`1.234,56`). */
const MT940_AMOUNT = /^(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?$/

/**
 * Parse an MT940 amount into integer cents. MT940 uses `,` as the decimal separator and `.`
 * as the thousands separator, so `100,50` -> 10050 and `1.234,56` -> 123456. A value such as
 * `100.50` is not valid MT940 and is rejected instead of being mis-scaled.
 */
export function parseMt940Amount(raw: string): number {
  const match = MT940_AMOUNT.exec(raw.trim())
  if (!match) throw new BankrecError('E_BR_CSV_INVALID', `MT940 bad amount: ${raw}`)
  const whole = match[1]!.replace(/\./g, '')
  const fraction = (match[2] ?? '').padEnd(2, '0')
  const value = Number(whole) * 100 + Number(fraction)
  if (!Number.isSafeInteger(value)) throw new BankrecError('E_BR_CSV_INVALID', `MT940 amount out of range: ${raw}`)
  return value
}

export function parseMt940(text: string, accountOverride?: string, evidenceSha?: string): TxnRecord[] {
  const lines = text.replace(/\r/g, '').split('\n')
  const account = accountOverride?.trim() || lines.find((line) => line.startsWith(':25:'))?.slice(4).trim() || ''
  if (!account) throw new BankrecError('E_BR_CSV_INVALID', 'MT940 has no :25: account')
  const evidence = evidenceSha ?? sha256Hex(text)
  const out: TxnRecord[] = []
  let pending: { date: string; amount: number; reference: string } | undefined
  for (const line of lines) {
    if (line.startsWith(':61:')) {
      const body = line.slice(4)
      const match = body.match(/^(\d{6})(?:\d{4})?([CD]R?)([\d.,]+)([A-Z].*)$/)
      if (!match) throw new BankrecError('E_BR_CSV_INVALID', `MT940 bad :61: ${line}`)
      const sign = match[2]!.startsWith('D') ? -1 : 1
      const date = dateOf(match[1]!)
      const amount = sign * parseMt940Amount(match[3]!)
      const tail = match[4]!
      const refMatch = tail.match(/\/\/(.+)$/)
      const reference = refMatch?.[1] ?? tail.replace(/^[A-Z]{4}/, '').slice(0, 80) ?? 'mt940'
      pending = { date, amount, reference }
      out.push({ txn_id: txnId('mt940', account, date.slice(0, 7), evidence, [date, amount, reference, out.length]), account_id: account, period: date.slice(0, 7), side: 'bank', date, amount_cents: amount, reference, evidence_sha256: evidence, created_at: new Date().toISOString() })
    } else if (line.startsWith(':86:') && pending) {
      const description = line.slice(4).trim()
      if (description) {
        const last = out[out.length - 1]
        if (last) last.reference = `${last.reference} ${description}`.trim().slice(0, 200)
      }
    }
  }
  if (out.length === 0) throw new BankrecError('E_BR_CSV_INVALID', 'MT940 has no :61: entries')
  return out
}

export interface Mt940Balance { opening_cents: number; closing_cents: number }
export function parseMt940Balances(text: string): Mt940Balance {
  const line60 = text.split(/\r?\n/).find((line) => line.startsWith(':60F:'))
  const line62 = text.split(/\r?\n/).find((line) => line.startsWith(':62F:'))
  const parse = (line: string | undefined): number => {
    if (!line) throw new BankrecError('E_BR_CSV_INVALID', 'MT940 lacks :60F:/:62F:')
    const m = line.match(/^:[0-9]{2}F:([CD])(\d{6})[A-Z]{3}([\d.,]+)$/)
    if (!m) throw new BankrecError('E_BR_CSV_INVALID', `bad MT940 balance: ${line}`)
    return (m[1] === 'D' ? -1 : 1) * parseMt940Amount(m[3]!)
  }
  return { opening_cents: parse(line60), closing_cents: parse(line62) }
}
