/** ISO 13616 IBAN validation (ISO 7064 mod 97-10). Clean-room implementation from the published spec. */
export interface IbanResult {
  iban: string
  valid: boolean
  country: string
  check_digits: string
  bban_length: number
  reason?: string
}

// Published national BBAN lengths for the countries this package is most likely to meet.
// Unknown countries still get the generic length range and the mod-97 check.
const BBAN_LENGTH: Record<string, number> = {
  AT: 16, BE: 12, CH: 17, CZ: 20, DE: 18, DK: 14, EE: 16, ES: 20, FI: 14, FR: 23,
  GB: 18, GR: 23, HU: 24, IE: 18, IT: 23, LU: 16, NL: 14, NO: 11, PL: 24, PT: 21,
  RO: 20, SE: 20, SK: 20, TR: 22,
}

export function ibanNormalize(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

function mod97(input: string): number {
  let remainder = 0
  for (const ch of input) {
    const digit = ch >= '0' && ch <= '9' ? ch : String(ch.charCodeAt(0) - 55)
    for (const d of digit) remainder = (remainder * 10 + Number(d)) % 97
  }
  return remainder
}

export function ibanCheck(raw: string): IbanResult {
  const iban = ibanNormalize(raw)
  const base: IbanResult = { iban, valid: false, country: '', check_digits: '', bban_length: 0 }
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return { ...base, reason: 'E_BR_IBAN_CHARSET' }
  const country = iban.slice(0, 2)
  const checkDigits = iban.slice(2, 4)
  const bban = iban.slice(4)
  const result: IbanResult = { iban, valid: false, country, check_digits: checkDigits, bban_length: bban.length }
  if (iban.length < 15 || iban.length > 34) return { ...result, reason: 'E_BR_IBAN_LENGTH' }
  const expected = BBAN_LENGTH[country]
  if (expected !== undefined && bban.length !== expected) return { ...result, reason: 'E_BR_IBAN_COUNTRY_LENGTH' }
  if (mod97(bban + country + checkDigits) !== 1) return { ...result, reason: 'E_BR_IBAN_CHECKSUM' }
  return { ...result, valid: true }
}
