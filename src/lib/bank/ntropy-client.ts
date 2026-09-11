// Ntropy API client for transaction enrichment.
// Used as an oracle to validate and supplement our keyword-based classification.
//
// Layered pipeline position: Ntropy enrichment runs AFTER Tink raw data
// and BEFORE our keyword/rules layer. Our Form E-specific rules override
// Ntropy's generic consumer categories where needed.
//
// API docs: https://docs.ntropy.com/documentation/api/transactions/post-transaction

// ═══ Types ═══

export interface NtropyTransactionInput {
  transaction_id: string
  description: string
  entry_type: 'outgoing' | 'incoming'
  amount: number
  iso_currency_code: string
  date: string  // ISO 8601
  country: string
  account_holder_id: string
  account_holder_type: 'consumer' | 'business'
}

export interface NtropyEnrichedTransaction {
  transaction_id: string
  merchant: string | null
  merchant_id: string | null
  logo: string | null
  website: string | null
  mcc: string | null
  labels: string[]
  categories: string[]
}

export interface NtropyEnrichResult {
  enriched: NtropyEnrichedTransaction[]
  error: string | null
  latencyMs: number
  creditsUsed: number
}

// ═══ Client ═══

const NTROPY_API_URL = 'https://api.ntropy.com/v2/transactions/sync'

export async function enrichTransactions(
  transactions: NtropyTransactionInput[],
  apiKey: string,
): Promise<NtropyEnrichResult> {
  const start = Date.now()

  try {
    const res = await fetch(NTROPY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(transactions),
    })

    const latencyMs = Date.now() - start

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText)
      return {
        enriched: [],
        error: `Ntropy API error ${res.status}: ${errorText}`,
        latencyMs,
        creditsUsed: 0,
      }
    }

    const data = await res.json()
    // Response is an array of enriched transactions
    const enriched: NtropyEnrichedTransaction[] = (Array.isArray(data) ? data : [data]).map((item: Record<string, unknown>) => ({
      transaction_id: (item.transaction_id as string) ?? '',
      merchant: (item.merchant as string) ?? null,
      merchant_id: (item.merchant_id as string) ?? null,
      logo: (item.logo as string) ?? null,
      website: (item.website as string) ?? null,
      mcc: (item.mcc as string) ?? null,
      labels: Array.isArray(item.labels) ? item.labels as string[] : [],
      categories: Array.isArray(item.categories) ? item.categories as string[] : [],
    }))

    return {
      enriched,
      error: null,
      latencyMs,
      creditsUsed: enriched.length,
    }
  } catch (err) {
    return {
      enriched: [],
      error: `Ntropy fetch error: ${(err as Error).message}`,
      latencyMs: Date.now() - start,
      creditsUsed: 0,
    }
  }
}

// ═══ Helpers ═══

/** Convert our DetectedPayment into Ntropy input format. */
export function toNtropyInput(
  payments: { payee: string; amount: number; date?: string }[],
  accountHolderId: string = 'decouple-test',
): NtropyTransactionInput[] {
  return payments.map((p, i) => ({
    transaction_id: `tx-${i}-${p.payee.slice(0, 20).replace(/\s/g, '-')}`,
    description: p.payee,
    entry_type: 'outgoing' as const,
    amount: Math.abs(p.amount),
    iso_currency_code: 'GBP',
    date: p.date ?? '2025-06-01',
    country: 'GB',
    account_holder_id: accountHolderId,
    account_holder_type: 'consumer' as const,
  }))
}
