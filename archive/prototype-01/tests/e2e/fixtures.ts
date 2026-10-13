import { encode } from '@/lib/codec'
import { pack } from '@/lib/build/pack'

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

// Sarah's profile and her test scenario, so the Build screens after the profile render
// with real findings rather than redirecting back to connect.
export const sarahProfile = {
  lender: 'Halifax',
  rentTo: null,
  rentAmount: null,
  rentDay: null,
  businessName: null,
  businessStructure: null,
  payMethod: null,
  incomeChannels: [],
  vehicles: 'one',
  vehicleFinance: false,
  financeProvider: null,
  pensions: 'one',
  pensionProvider: 'Aviva',
  pensionKind: 'none',
  children: 2,
  otherAssets: ['savings'],
  accountsNoted: true,
  pensionsAnsweredAt: '2026-09-11T00:00:00.000Z',
}

export const sarahBank = { kind: 'scenario', id: 'sarah-employed-homeowner', connectedAt: '2026-09-11T00:00:00.000Z' }

export function seededCookies(url: string) {
  const cookie = (name: string, value: string) => ({ name, value, url, httpOnly: true, sameSite: 'Lax' as const })
  return [
    cookie('decouple_start', encode(sarahAnswers)),
    cookie('decouple_session', encode(sarahSession)),
    cookie('decouple_profile', encode(sarahProfile)),
    ...pack(sarahBank).map((chunk, i) => cookie(`decouple_bank.${i}`, chunk)),
  ]
}
