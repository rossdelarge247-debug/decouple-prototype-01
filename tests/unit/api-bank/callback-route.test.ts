import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/bank/tink-client', () => ({
  getUserToken: vi.fn().mockResolvedValue('test-token'),
  getAccounts: vi.fn().mockResolvedValue([{
    id: 'acc-1', financialInstitutionId: 'fi-1',
    balances: { available: { amount: { value: '150000' } } },
    type: 'CHECKING', name: 'Current Account',
  }]),
  getTransactions: vi.fn().mockResolvedValue([
    { id: 'tx-1', amount: { value: '321800' }, descriptions: { original: 'SALARY' }, dates: { booked: '2025-01-28' }, status: 'BOOKED' },
  ]),
  fetchProviderDisplayNames: vi.fn().mockResolvedValue({ 'fi-1': 'Barclays' }),
}));

vi.mock('@/lib/bank/tink-transformer', () => ({
  transformTinkAccount: vi.fn().mockReturnValue({
    provider: 'Barclays', account_type: 'current',
    transactions: [{ date: '2025-01-28', description: 'SALARY', amount: 3218 }],
  }),
}));

vi.mock('@/lib/ai/result-transformer', () => ({
  transformExtractionResult: vi.fn().mockReturnValue({ questions: [], sections: [] }),
}));

describe('/api/bank/callback route', () => {
  beforeEach(() => {
    vi.stubEnv('TINK_CLIENT_ID', 'test-id');
    vi.stubEnv('TINK_CLIENT_SECRET', 'test-secret');
  });

  it('success redirect points to /dev/proto/your-picture, not stale /workspace', async () => {
    const { GET } = await import('@/app/api/bank/callback/route');
    const url = new URL('http://localhost/api/bank/callback?code=test-code');
    const req = new Request(url) as Parameters<typeof GET>[0];
    Object.defineProperty(req, 'nextUrl', { value: url });

    const res = await GET(req);
    const html = await res.text();

    expect(html).toContain('/dev/proto/your-picture?source=openbanking');
    expect(html).not.toContain('/workspace?source=openbanking');
  });

  it('error redirect does not link to stale /workspace', async () => {
    const { GET } = await import('@/app/api/bank/callback/route');
    const url = new URL('http://localhost/api/bank/callback');
    const req = new Request(url) as Parameters<typeof GET>[0];
    Object.defineProperty(req, 'nextUrl', { value: url });

    const res = await GET(req);
    const html = await res.text();

    expect(html).not.toContain('href="/workspace"');
  });
});
