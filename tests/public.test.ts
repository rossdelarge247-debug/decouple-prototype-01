import { describe, expect, it } from 'vitest'
import { isPublicPath, loadPublicList, normalisePath } from '../lib/public.ts'
import { PUBLIC_PATHS } from '../lib/generated/public.ts'

describe('the public allow-list', () => {
  it('matches encoded and decoded forms of the same path', () => {
    const list = loadPublicList(['/Marketing 02 · Divorce Guide.html', '/m02/guide/g.css'])
    expect(isPublicPath('/Marketing%2002%20%C2%B7%20Divorce%20Guide.html', list)).toBe(true)
    expect(isPublicPath('/Marketing 02 · Divorce Guide.html', list)).toBe(true)
    expect(isPublicPath('//m02/guide/g.css', list)).toBe(true)
    expect(isPublicPath('/m02/guide/g.css/', list)).toBe(false)
    expect(isPublicPath('/proto/ut/ut.js', list)).toBe(false)
    expect(normalisePath('%E0%A4%A')).toBe('/%E0%A4%A')
  })

  it('is generated with the guide, the holding page and the privacy page, and nothing private', () => {
    expect(PUBLIC_PATHS).toContain('/Marketing 02 · Divorce Guide.html')
    expect(PUBLIC_PATHS).toContain('/Marketing 01 · Holding Page.html')
    expect(PUBLIC_PATHS).toContain('/privacy.html')
    expect(PUBLIC_PATHS).toContain('/shared/dc-site.js')
    expect(PUBLIC_PATHS).toContain('/fonts.css')
    for (const p of PUBLIC_PATHS) {
      expect(p).not.toMatch(/^\/(results|hub|settings|atlas)\//)
      expect(p).not.toMatch(/^\/Proto \d\d/)
      expect(p).not.toMatch(/^\/Decouple/)
      expect(p).not.toBe('/proto/ut/ut.js')
    }
  })
})
