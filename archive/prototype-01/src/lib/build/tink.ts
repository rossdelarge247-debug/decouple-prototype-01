/** Tink Link only works where its callback is whitelisted: production, or a local dev server. */
export function tinkAvailable(env: Record<string, string | undefined> = process.env): boolean {
  const configured = !!env.TINK_CLIENT_ID && !!env.TINK_CLIENT_SECRET
  const whitelisted = !env.VERCEL || env.VERCEL_ENV === 'production'
  return configured && whitelisted
}
