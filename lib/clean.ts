/* Cleaning answers (spec §7). Pure: the API calls this before anything reaches the sheet. */
export const TESTS = ['M02 Guide', 'Prototype testing', 'M01 Holding', 'Screener'] as const

/** one test per MVP prototype, e.g. "MVP 05 · Financial statement". Each gets its own tab. */
export const MVP_TEST_RE = /^MVP \d{2} · [A-Za-z&' -]{1,40}$/

/* New tests are added here deliberately: anything else is a 400 */
export function knownTest(test: unknown): test is string {
  return typeof test === 'string' && ((TESTS as readonly string[]).includes(test) || MVP_TEST_RE.test(test))
}

/** the screener's wellbeing question (scr-wb) is never sent by the page, and never stored if it is */
export const BLOCKED_QIDS = ['safe', 'safe2', 'name_me', 'name_them', 'scr-wb'] as const
export const MAX_ROWS = 80
export const MAX_ANSWER = 2000
export const MAX_PID = 40

/* m02.safe → safe. Any qid containing "email" is blocked too. */
export function blockedQid(qid: unknown): boolean {
  const k = String(qid ?? '').replace(/^m02\./, '')
  return (BLOCKED_QIDS as readonly string[]).includes(k) || /email/i.test(String(qid ?? ''))
}

/* Control characters out; line breaks and tabs stay, because long answers have them */
export function stripControl(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
}

const str = (v: unknown, max: number): string => stripControl(String(v ?? '')).trim().slice(0, max)

export interface AnswerRow {
  qid: string
  qv: number
  q: string
  type: string
  a: string
}

export interface Batch {
  batchKey: string
  sid: string
  pid: string
  test: string
  step: string
  price: string
  landing: string
  device: string
  rows: AnswerRow[]
}

export type CleanResult = { kind: 'ok'; batch: Batch } | { kind: 'drop'; why: string } | { kind: 'bad'; error: string }

export interface Sender {
  owner: boolean
  /** a tester's label */
  label?: string
}

export function cleanAnswers(body: unknown, who: Sender): CleanResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'bad', error: 'Expected an object.' }
  const b = body as Record<string, unknown>
  if (typeof b.hp === 'string' && b.hp.trim() !== '') return { kind: 'drop', why: 'hp' }
  if (b.hp != null && typeof b.hp !== 'string') return { kind: 'bad', error: 'hp must be a string.' }
  const test = b.test
  if (!knownTest(test)) return { kind: 'bad', error: 'Unknown test.' }
  const sid = str(b.sid, 64)
  if (!sid) return { kind: 'bad', error: 'sid is required.' }
  if (!Array.isArray(b.rows)) return { kind: 'bad', error: 'rows must be an array.' }
  if (b.rows.length > MAX_ROWS) return { kind: 'bad', error: `At most ${MAX_ROWS} rows.` }
  const rows: AnswerRow[] = []
  for (const raw of b.rows) {
    if (!raw || typeof raw !== 'object') return { kind: 'bad', error: 'Each row must be an object.' }
    const r = raw as Record<string, unknown>
    const qid = str(r.qid, 80)
    if (!qid) return { kind: 'bad', error: 'Each row needs a qid.' }
    if (blockedQid(qid)) continue
    const a = str(r.a, MAX_ANSWER)
    if (!a) continue
    const qv = Number(r.qv)
    rows.push({ qid, qv: Number.isFinite(qv) && qv > 0 ? Math.floor(qv) : 1, q: str(r.q, 300), type: str(r.type, 40), a })
  }
  const pid = who.owner ? str(b.pid, MAX_PID) || 'anon' : who.label ? str(who.label, MAX_PID) || 'anon' : 'anon'
  return {
    kind: 'ok',
    batch: {
      batchKey: str(b.batchKey, 120) || `${sid}:${Date.now().toString(36)}`,
      sid,
      pid,
      test,
      step: str(b.step, 200),
      price: str(b.price, 20),
      landing: str(b.landing, 20),
      device: str(b.device, 40),
      rows,
    },
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const SIGNUP_SOURCE_RE = /^(holding:[A-Za-z0-9._-]{1,40}|guide|guide-optin|help)$/

export interface Signup {
  email: string
  stage: string
  source: string
  sid: string
}

export type SignupResult = { kind: 'ok'; signup: Signup } | { kind: 'drop'; why: string } | { kind: 'bad'; error: string }

export function cleanSignup(body: unknown): SignupResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'bad', error: 'Expected an object.' }
  const b = body as Record<string, unknown>
  if (typeof b.hp === 'string' && b.hp.trim() !== '') return { kind: 'drop', why: 'hp' }
  const email = str(b.email, 254).toLowerCase()
  if (!EMAIL_RE.test(email)) return { kind: 'bad', error: 'That is not an email address.' }
  const source = str(b.source, 60)
  if (!SIGNUP_SOURCE_RE.test(source)) return { kind: 'bad', error: 'Unknown source.' }
  const stage = str(b.stage, 200)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(';')
  const sid = str(b.sid, 64)
  return { kind: 'ok', signup: { email, stage, source, sid } }
}

/* The participant hub's thank-you step (spec §7, /api/participant): a follow-up yes or no, a voucher
   choice, and an email address when either needs one. It goes to the Participants tab, which no read
   ever returns, and never alongside answers. */
export interface Participant {
  sid: string
  followup: boolean
  voucher: string
  email: string
}

export type ParticipantResult = { kind: 'ok'; participant: Participant } | { kind: 'drop'; why: string } | { kind: 'bad'; error: string }

export function cleanParticipant(body: unknown): ParticipantResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'bad', error: 'Expected an object.' }
  const b = body as Record<string, unknown>
  if (typeof b.hp === 'string' && b.hp.trim() !== '') return { kind: 'drop', why: 'hp' }
  const sid = str(b.sid, 64)
  if (!sid) return { kind: 'bad', error: 'sid is required.' }
  if (b.followup != null && typeof b.followup !== 'boolean') return { kind: 'bad', error: 'followup must be true or false.' }
  if (b.voucher != null && typeof b.voucher !== 'string') return { kind: 'bad', error: 'voucher must be text.' }
  const followup = b.followup === true
  const voucher = str(b.voucher, 60)
  const email = str(b.email, 254).toLowerCase()
  if (email && !EMAIL_RE.test(email)) return { kind: 'bad', error: 'That is not an email address.' }
  if ((followup || voucher) && !email) return { kind: 'bad', error: 'An email address is needed for that.' }
  return { kind: 'ok', participant: { sid, followup, voucher, email } }
}
