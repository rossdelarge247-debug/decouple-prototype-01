import { encode } from '@/lib/codec'

// Sarah, from the golden path, as cookies the stub reads. The stub session cookie is
// unsigned on purpose so this file can build one; the same codec the app uses.
export const sarahAnswers = {
  stage: 'decided',
  relationship: 'married',
  living: 'yes',
  children: 2,
  home: 'mortgage',
  quality: 'amicable',
  devicePrivate: true,
  selfEmployed: 'no',
  awareness: 'some',
  priorities: ['home', 'children', 'pension'],
  worries: ['mortgage', 'fair'],
}

export const sarahSession = {
  id: 'e2e-sarah',
  name: 'Sarah Jones',
  email: 'sarah@example.com',
  createdAt: '2026-09-11T00:00:00.000Z',
  start: sarahAnswers,
  flags: { safety: false, devicePrivate: true, complexity: false },
}

export function seededCookies(url: string) {
  return [
    { name: 'decouple_start', value: encode(sarahAnswers), url, httpOnly: true, sameSite: 'Lax' as const },
    { name: 'decouple_session', value: encode(sarahSession), url, httpOnly: true, sameSite: 'Lax' as const },
  ]
}
