import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BANK_COOKIE } from '@/lib/build/store'

const extraction = {
  document_type: 'bank_statement', provider: 'Barclays', account_number_last4: '2323', account_type: 'current',
  is_joint: false, joint_holder_name: null, statement_period_start: '2025-01-01', statement_period_end: '2025-12-31',
  closing_balance: 1500, income_deposits: [], regular_payments: [], spending_categories: [], notable_transactions: [],
}

vi.mock('@/lib/bank/tink-client', () => ({
  getUserToken: vi.fn().mockResolvedValue('test-token'),
  getAccounts: vi.fn().mockResolvedValue([{ id: 'acc-1', financialInstitutionId: 'fi-1', balances: { booked: { amount: { value: '150000' } } }, type: 'CHECKING', name: 'Current Account', identifiers: {} }]),
  getTransactions: vi.fn().mockResolvedValue([
    { id: 'tx-1', amount: { value: { unscaledValue: '321800', scale: '2' }, currencyCode: 'GBP' }, descriptions: { original: 'SALARY', display: 'Acme salary' }, dates: { booked: '2025-01-28' }, status: 'BOOKED' },
  ]),
  fetchProviderDisplayNames: vi.fn().mockResolvedValue({ 'fi-1': 'Barclays' }),
  parseTinkAmount: vi.fn().mockReturnValue(3218),
}))

vi.mock('@/lib/bank/tink-transformer', () => ({
  transformTinkAccount: vi.fn().mockReturnValue(extraction),
}))

function request(path: string) {
  const url = new URL(`http://localhost${path}`)
  const req = new Request(url) as unknown as { nextUrl: URL }
  Object.defineProperty(req, 'nextUrl', { value: url })
  return req
}

describe('/api/bank/callback route', () => {
  beforeEach(() => {
    vi.stubEnv('TINK_CLIENT_ID', 'test-id')
    vi.stubEnv('TINK_CLIENT_SECRET', 'test-secret')
  })

  it('stores the connected accounts behind the Build store and continues to the reveal', async () => {
    const { GET } = await import('@/app/api/bank/callback/route')
    const res = await GET(request('/api/bank/callback?code=test-code') as Parameters<typeof GET>[0])
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('http://localhost/build/reveal')
    const cookies = res.headers.getSetCookie()
    expect(cookies.some(c => c.startsWith(`${BANK_COOKIE}.0=`))).toBe(true)
    expect(cookies.some(c => /HttpOnly/i.test(c))).toBe(true)
  })

  it('returns to the connect screen with state preserved when the user cancels', async () => {
    const { GET } = await import('@/app/api/bank/callback/route')
    const res = await GET(request('/api/bank/callback?error=USER_CANCELLED') as Parameters<typeof GET>[0])
    expect(res.headers.get('location')).toBe('http://localhost/build/connect?state=cancelled')
  })

  it('returns to the connect screen with a reference id when Tink fails', async () => {
    const tink = await import('@/lib/bank/tink-client')
    vi.mocked(tink.getAccounts).mockRejectedValueOnce(new Error('Tink is down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { GET } = await import('@/app/api/bank/callback/route')
    const res = await GET(request('/api/bank/callback?code=x') as Parameters<typeof GET>[0])
    expect(res.headers.get('location')).toMatch(/^http:\/\/localhost\/build\/connect\?state=failed&ref=[a-z0-9]{4}$/)
    expect(res.headers.getSetCookie()).toEqual([])
    spy.mockRestore()
  })
})
