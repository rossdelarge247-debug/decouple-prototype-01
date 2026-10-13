import { gunzipSync, gzipSync } from 'node:zlib'

// Bank data is larger than one cookie holds, so it travels gzipped and split across
// numbered cookies. No Next imports: the e2e fixtures build the same cookies with it.
export const CHUNK_SIZE = 3800
export const MAX_CHUNKS = 3

export function pack(value: unknown): string[] {
  const text = gzipSync(Buffer.from(JSON.stringify(value), 'utf8')).toString('base64url')
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += CHUNK_SIZE) chunks.push(text.slice(i, i + CHUNK_SIZE))
  return chunks
}

export function unpack<T>(chunks: string[], guard: (x: unknown) => x is T): T | null {
  if (chunks.length === 0) return null
  try {
    const parsed: unknown = JSON.parse(gunzipSync(Buffer.from(chunks.join(''), 'base64url')).toString('utf8'))
    return guard(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function fits(value: unknown): boolean {
  return pack(value).length <= MAX_CHUNKS
}
