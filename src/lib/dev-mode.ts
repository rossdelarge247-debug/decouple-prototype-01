// A named switch, set in Vercel for production only while no real auth provider
// exists: the stub session may run there, and every screen says so. It is a
// prototype convenience, not a product mode; remove the variable before real users.
export function devMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.DECOUPLE_DEV_MODE === '1'
}
