import { WORDMARK } from '@/constants'

// Phase 1 (Orient) starts here. Nothing is built yet: the golden-path test in
// tests/e2e/golden-path.e2e.ts fails at its first step until it is.
export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      <h1 style={{ fontFamily: 'var(--font-source-serif), serif', fontSize: 32, margin: 0 }}>{WORDMARK}</h1>
      <p style={{ color: '#5B6472', lineHeight: 1.5 }}>The complete picture. The journey begins with the interview; it is not built yet.</p>
    </main>
  )
}
