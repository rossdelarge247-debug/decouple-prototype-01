import { NextResponse } from 'next/server'
import { cookieOptions } from '@/lib/cookies'
import { SESSION_COOKIE } from '@/lib/session/stub'
import { START_COOKIE } from '@/lib/start/store'

// The Exit-this-page endpoint: best effort, kills the session and the interview
// answers. A form post (no JavaScript) is sent on to BBC News; the beacon gets 204.
export const EXIT_URL = 'https://www.bbc.co.uk/news'

function clearing(res: NextResponse): NextResponse {
  for (const name of [SESSION_COOKIE, START_COOKIE]) {
    res.cookies.set(name, '', { ...cookieOptions, maxAge: 0 })
  }
  return res
}

export async function POST(request: Request): Promise<NextResponse> {
  const wantsPage = (request.headers.get('accept') ?? '').includes('text/html')
  const res = wantsPage
    ? NextResponse.redirect(EXIT_URL, { status: 303 })
    : new NextResponse(null, { status: 204 })
  return clearing(res)
}
