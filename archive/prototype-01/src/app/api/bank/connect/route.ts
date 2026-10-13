import { NextRequest, NextResponse } from 'next/server'
import { buildTinkLinkUrl } from '@/lib/bank/tink-client'

/**
 * POST /api/bank/connect
 *
 * Initiates a Tink Link session for Open Banking bank connection.
 * Opens in a popup window (Tink blocks iframe embedding).
 *
 * Uses client_id-only mode — Tink Link creates a temporary user internally.
 * The authorization-grant API has changed and no longer auto-creates users
 * from external_user_id, and createUser + user_id produces auth codes that
 * Tink Link can't resolve (REQUEST_FAILED_FETCH_EXISTING_USER).
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.TINK_CLIENT_ID || !process.env.TINK_CLIENT_SECRET) {
      return NextResponse.json({
        error: 'Open Banking not configured. Tink credentials required.',
      }, { status: 503 })
    }

    const origin = request.headers.get('origin') || request.nextUrl.origin
    const redirectUri = `${origin}/api/bank/callback`

    const tinkLinkUrl = buildTinkLinkUrl(null, redirectUri)

    return NextResponse.json({ url: tinkLinkUrl })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Bank Connect] Error:', msg)
    return NextResponse.json({
      error: `Failed to start bank connection: ${msg}`,
    }, { status: 500 })
  }
}
