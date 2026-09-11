import { NextRequest, NextResponse } from 'next/server'
import { fetchProviderDisplayNames, getAccounts, getTransactions, getUserToken, parseTinkAmount } from '@/lib/bank/tink-client'
import { transformTinkAccount } from '@/lib/bank/tink-transformer'
import { fitTinkSource, type BankAccount } from '@/lib/build/bank'
import { bankCookieEntries, CONFIRM_COOKIE } from '@/lib/build/store'
import { cookieOptions } from '@/lib/cookies'
import { errorRef } from '@/lib/errors'

// Tink's own fetches can be slow; the SDK rules give routes 300 s.
export const maxDuration = 300

/**
 * GET /api/bank/callback?code=...
 *
 * Tink Link lands here after the user connects a bank. The accounts and twelve months
 * of transactions go through the Tink transformer, are stored behind the Build store's
 * interface, and the user continues to the reveal. Cancelled or failed connections
 * return to the connect screen with their state preserved and a reference id.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const code = params.get('code')
  const credentialsId = params.get('credentialsId')
  const error = params.get('error')
  const origin = request.nextUrl.origin

  if (error || (!code && !credentialsId)) {
    const state = error && !/cancel/i.test(error) ? `failed&ref=${errorRef()}` : 'cancelled'
    return NextResponse.redirect(`${origin}/build/connect?state=${state}`, 303)
  }

  try {
    const userToken = await getUserToken(code || credentialsId!)
    const tinkAccounts = await getAccounts(userToken)
    if (tinkAccounts.length === 0) throw new Error('No accounts returned')
    const institutionIds = [...new Set(tinkAccounts.map(a => a.financialInstitutionId))]
    const providerNames = await fetchProviderDisplayNames(institutionIds)

    const accounts: BankAccount[] = []
    for (const account of tinkAccounts) {
      const transactions = await getTransactions(userToken, account.id)
      const extraction = transformTinkAccount(account, transactions, providerNames[account.financialInstitutionId])
      accounts.push({
        extraction,
        transactions: transactions.map(t => ({
          date: t.dates.booked,
          description: t.descriptions.display || t.descriptions.original,
          amount: parseTinkAmount(t.amount),
        })),
      })
    }

    const source = fitTinkSource({ kind: 'tink', accounts, connectedAt: new Date().toISOString() })
    const response = NextResponse.redirect(`${origin}/build/reveal`, 303)
    for (const [name, value] of bankCookieEntries(source)) response.cookies.set(name, value, cookieOptions)
    response.cookies.delete(CONFIRM_COOKIE)
    return response
  } catch (e) {
    const ref = errorRef()
    // The message may name a provider; it is logged with the reference, never shown.
    console.error(`[bank callback ${ref}]`, e instanceof Error ? e.message : e)
    return NextResponse.redirect(`${origin}/build/connect?state=failed&ref=${ref}`, 303)
  }
}
