import { redirect } from 'next/navigation'
import { stepRoute } from '@/lib/start/answers'

export default function StartIndex() {
  redirect(stepRoute('o1'))
}
