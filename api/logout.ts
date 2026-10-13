import { json } from '../lib/http.js'
import { COOKIE, clearCookie } from '../lib/session.js'

export async function POST(): Promise<Response> {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8' })
  const res = json({ ok: true })
  res.headers.append('set-cookie', clearCookie(COOKIE.owner))
  res.headers.append('set-cookie', clearCookie(COOKIE.tester))
  void headers
  return res
}
