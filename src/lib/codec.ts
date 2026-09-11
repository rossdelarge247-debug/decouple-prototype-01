// Cookie payloads are base64url JSON. No Next imports here: Playwright builds
// cookies with the same functions to seed screens for the accessibility floor.
export function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

export function decode<T>(raw: string | undefined, guard: (x: unknown) => x is T): T | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
    return guard(parsed) ? parsed : null
  } catch {
    return null
  }
}
