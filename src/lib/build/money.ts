// Money and names as a person reads them. Negatives sit in parentheses because the
// picture is a financial document, and a bank's payee string is never shown raw.

export function pounds(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString('en-GB')
  return n < 0 ? `(£${abs})` : `£${abs}`
}

export function toMonthly(amount: number, frequency: 'monthly' | 'weekly' | 'quarterly' | 'annual' | 'one_off'): number {
  switch (frequency) {
    case 'weekly': return Math.round((amount * 52) / 12)
    case 'quarterly': return Math.round(amount / 3)
    case 'annual': return Math.round(amount / 12)
    case 'one_off': return 0
    default: return Math.round(amount)
  }
}

const PREFIXES = /^(card payment to|card payment|faster payment to|direct debit|standing order|bank transfer to|visa deb|contactless)\s+/i
const MARKERS = /\b(dd|so|sto|fpi|fpo|bgc|bac|chq|tfr|cr|dr|spc|bgt|d\/d|s\/o)\b/gi
const NOISE = /\b(salary|wages|mortgage|mortgages|pension|contrib|contribution|ctax|tax|payment|payments|ltd|plc|limited|uk|gbr|group|services|service|account|inv|ndds)\b/gi
const ACRONYMS = new Set(['hmrc', 'dwp', 'hl', 'nhs', 'bt', 'edf', 'sse', 'ee', 'tsb', 'hsbc', 'rbkc', 'lbc', 'cc', 'uc', 'lb', 'l&q', 'bmw', 'nw1'])

/** "DD HALIFAX MORTGAGE 87234561" reads as "Halifax"; "FPI HMRC CHILD BENEFIT" as "HMRC Child Benefit". */
export function displayPayee(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(PREFIXES, '')
    .replace(MARKERS, ' ')
    .replace(/\b\d{3,}\b/g, ' ')
    .replace(/\.com\b/g, '')
    .replace(NOISE, ' ')
    .replace(/[^a-z0-9&\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return raw.trim()
  return cleaned
    .split(' ')
    .map(w => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** A small stable hash, for keys derived from strings. */
export function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return h >>> 0
}
