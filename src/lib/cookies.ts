// Shared cookie policy. Lax, not Strict: the Tink callback in Build arrives as a
// cross-site top-level GET and must still see the session. No Max-Age: these are
// session cookies; the exit endpoint is the real clear.
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: !!process.env.VERCEL,
  path: '/',
}
