import { NextResponse } from 'next/server'
import { isComplete } from '@/lib/start/answers'
import { PLAN_TIMEOUT_MS, generatePlanProse } from '@/lib/start/plan-prose'
import { cookieStartStore } from '@/lib/start/store'

// The one model call of the Start phase. The SDK is loaded only when a key exists,
// so CI and the tests never touch it. Any failure is a null, never an error.
export const maxDuration = 300

export async function POST(): Promise<NextResponse> {
  const answers = await cookieStartStore().read()
  if (!answers || !isComplete(answers)) return NextResponse.json({ prose: null }, { status: 400 })
  const apiKey = process.env.ANTHROPIC_API_KEY
  const prose = await generatePlanProse(answers, {
    hasKey: !!apiKey,
    client: async () => {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      return new Anthropic({ apiKey, timeout: PLAN_TIMEOUT_MS })
    },
  })
  return NextResponse.json({ prose })
}
