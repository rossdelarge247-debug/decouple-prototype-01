// Tink Open Banking API client
// Handles OAuth flow, user management, and data fetching
// Docs: https://docs.tink.com/api
//
// Flow:
// 1. getClientToken() — client credentials grant
// 2. createUser() — create a Tink user for this session
// 3. getAuthorizationCode() — delegate grant for user
// 4. buildTinkLinkUrl() — URL for user to connect their bank
// 5. getUserToken() — exchange callback code for user access token
// 6. getAccounts() + getTransactions() — fetch financial data

const TINK_BASE_URL = 'https://api.tink.com'

function getConfig() {
  const clientId = process.env.TINK_CLIENT_ID
  const clientSecret = process.env.TINK_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Tink not configured: TINK_CLIENT_ID and TINK_CLIENT_SECRET required')
  }
  return { clientId, clientSecret }
}

// ═══ Tink API response types ═══

export interface TinkAccount {
  id: string
  name: string
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN' | 'MORTGAGE' | 'PENSION' | 'OTHER'
  balances: {
    booked: {
      amount: { value: { unscaledValue: string; scale: string }; currencyCode: string }
    }
  }
  identifiers: {
    iban?: { iban: string }
    sortCode?: { accountNumber: string; code: string }
    financialInstitution?: { accountNumber: string; referenceNumbers?: { type: string; value: string }[] }
  }
  financialInstitutionId: string
  customerSegment?: 'PERSONAL' | 'BUSINESS'
  dates?: { lastRefreshed: string }
}

export interface TinkTransaction {
  id: string
  accountId: string
  amount: { value: { unscaledValue: string; scale: string }; currencyCode: string }
  descriptions: { original: string; display: string }
  dates: { booked: string }
  categories: { pfm: { id: string; name: string } }
  merchantInformation?: { merchantName: string; merchantCategoryCode: string }
  types: { type: 'DEFAULT' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL' }
  status: 'BOOKED' | 'PENDING'
}

// ═══ Auth ═══

export async function getClientToken(scope: string): Promise<string> {
  const { clientId, clientSecret } = getConfig()

  const res = await fetch(`${TINK_BASE_URL}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tink client token failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

export async function createUser(externalUserId: string): Promise<{ userId: string; raw: Record<string, unknown> }> {
  const token = await getClientToken('user:create')

  const res = await fetch(`${TINK_BASE_URL}/api/v1/user/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_user_id: externalUserId,
      market: 'GB',
      locale: 'en_GB',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tink create user failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  // Return raw response for debugging
  return { userId: data.user_id, raw: data }
}

// Default scope for data access. Tink Link needs TINK_LINK_SCOPE instead.
const DATA_ACCESS_SCOPE = 'accounts:read,transactions:read'
export const TINK_LINK_SCOPE = 'authorization:read,credentials:refresh,credentials:read,credentials:write,providers:read,user:read'

export async function getAuthorizationCode(userId: string, scope?: string): Promise<string> {
  const { clientId } = getConfig()
  const token = await getClientToken('authorization:grant')

  const res = await fetch(`${TINK_BASE_URL}/api/v1/oauth/authorization-grant/delegate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      user_id: userId,
      actor_client_id: clientId,
      scope: scope ?? DATA_ACCESS_SCOPE,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tink auth code failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.code
}

/**
 * Create an authorization code for Tink Link.
 * Uses the authorization grant endpoint with user_id (Tink internal ID).
 * The user must be created first via createUser().
 */
export async function createTinkLinkAuthCode(userId: string): Promise<string> {
  const token = await getClientToken('authorization:grant')

  const res = await fetch(`${TINK_BASE_URL}/api/v1/oauth/authorization-grant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      user_id: userId,
      scope: TINK_LINK_SCOPE,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tink Link auth code failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.code
}

export function buildTinkLinkUrl(authCode: string | null, redirectUri: string): string {
  const { clientId } = getConfig()

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    market: 'GB',
    locale: 'en_GB',
  })

  if (authCode) {
    params.set('authorization_code', authCode)
  }

  return `https://link.tink.com/1.0/transactions/connect-accounts?${params}`
}

// ═══ Token exchange ═══

export async function getUserToken(code: string): Promise<string> {
  const { clientId, clientSecret } = getConfig()

  const res = await fetch(`${TINK_BASE_URL}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tink user token exchange failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

// ═══ Data fetching ═══

export async function getAccounts(userToken: string): Promise<TinkAccount[]> {
  const res = await fetch(`${TINK_BASE_URL}/data/v2/accounts`, {
    headers: { 'Authorization': `Bearer ${userToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tink accounts fetch failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.accounts || []
}

export async function getTransactions(
  userToken: string,
  accountId: string,
  pageSize = 100,
): Promise<TinkTransaction[]> {
  const all: TinkTransaction[] = []
  let pageToken: string | null = null

  // Paginate through all transactions (up to 12 months)
  do {
    const params = new URLSearchParams({
      accountIdIn: accountId,
      pageSize: String(pageSize),
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(`${TINK_BASE_URL}/data/v2/transactions?${params}`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Tink transactions fetch failed (${res.status}): ${text}`)
    }

    const data = await res.json()
    all.push(...(data.transactions || []))
    pageToken = data.nextPageToken || null
  } while (pageToken)

  return all
}

// ═══ Provider name resolution ═══

/**
 * Fetch human-readable display names for financial institution IDs.
 * Uses client credentials with providers:read scope.
 * Returns a map of institutionId → displayName.
 */
export async function fetchProviderDisplayNames(
  institutionIds: string[],
): Promise<Record<string, string>> {
  const names: Record<string, string> = {}
  if (institutionIds.length === 0) return names

  try {
    const token = await getClientToken('providers:read')

    // Fetch all GB providers in one call and filter
    const res = await fetch(`${TINK_BASE_URL}/api/v1/providers/gb`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (res.ok) {
      const data = await res.json()
      const providers: Array<{ name: string; displayName: string; financialInstitutionId: string }> =
        data.providers || data || []

      for (const provider of providers) {
        const id = provider.financialInstitutionId || provider.name
        if (institutionIds.includes(id)) {
          names[id] = provider.displayName || provider.name
        }
      }
    }

    // For any IDs not found via the list, try individual lookup
    for (const id of institutionIds) {
      if (names[id]) continue
      try {
        const provRes = await fetch(`${TINK_BASE_URL}/api/v1/providers/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (provRes.ok) {
          const provData = await provRes.json()
          names[id] = provData.displayName || provData.name || id
        }
      } catch {
        // Individual lookup failed — fall through to transformer's hardcoded map
      }
    }
  } catch (error) {
    console.warn('[Tink] Provider name lookup failed, using fallback:', error)
  }

  return names
}

// ═══ Helpers ═══

/** Parse Tink's unscaled amount format: { unscaledValue: "12345", scale: "2" } → 123.45 */
export function parseTinkAmount(amount: TinkTransaction['amount']): number {
  const unscaled = parseInt(amount.value.unscaledValue, 10)
  const scale = parseInt(amount.value.scale, 10)
  return unscaled / Math.pow(10, scale)
}
