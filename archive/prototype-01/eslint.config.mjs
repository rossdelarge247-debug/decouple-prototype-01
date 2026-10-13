import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'docs/**', 'playwright-report/**', 'test-results/**']),
  {
    // Domain code never imports UI. Effects sit behind interfaces so logic stays testable.
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@/app', '@/app/*', '@/components', '@/components/*'], message: 'src/lib does not import UI.' }] }],
    },
  },
])
