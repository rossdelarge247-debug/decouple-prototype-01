import { describe, expect, it } from 'vitest'
import { API, LIVE_COPY, buildHelpContent, cleanBody, cleanHref, collectPaths, formsFrom, pageFrom } from '../lib/build/help.mjs'

/* Content API items as GOV.UK shapes them, cut down */
const GUIDE = {
  base_path: '/money-property-when-relationship-ends',
  title: 'Money and property when you divorce or separate',
  description: 'Getting a financial agreement',
  public_updated_at: '2025-02-03T10:00:00.000+00:00',
  details: {
    parts: [
      { title: 'Getting a financial agreement', slug: 'overview', body: '<p>You can agree.</p>' },
      { title: 'Get help agreeing', slug: 'mediation', body: [{ content_type: 'text/govspeak', content: 'x' }, { content_type: 'text/html', content: '<p>A mediator can help.</p>' }] },
      { title: 'If you agree', slug: 'apply-for-consent-order', body: '<p>Draft a consent order.</p>' },
    ],
  },
}
const PUBLICATION = { base_path: '/government/publications/x/y', title: 'Universal Credit: further information for couples', description: 'Couples', public_updated_at: '2026-01-01T00:00:00Z', details: { body: '<h2 id="a" class="gem">When you separate</h2><p>Tell us <a href="/report-benefits-change-circumstances" class="govuk-link">straight away</a>.</p>' } }
const STEPS = { base_path: '/get-a-divorce', title: 'Get a divorce: step by step', description: 'How to get a divorce', public_updated_at: '2024-11-01T00:00:00Z', details: { step_by_step_nav: { steps: [{ title: 'Check you can get a divorce' }] } } }
const TRANSACTION = { base_path: '/get-help-with-court-fees', title: 'Get help paying court and tribunal fees', description: 'Help with fees', public_updated_at: '2026-04-01T00:00:00Z', details: { introductory_paragraph: '<p>You may be able to get money off.</p>', more_information: '<p>Apply online.</p>' } }
const COLLECTION = {
  base_path: '/government/collections/financial-remedy-forms',
  title: 'Financial remedy forms',
  description: 'Forms',
  public_updated_at: '2026-09-22T00:00:00Z',
  details: { body: '<p>Forms for financial remedies.</p>' },
  links: {
    documents: [
      { title: 'Provide information about the parties’ financial situation to support your application for a consent order: Form D81', base_path: '/government/publications/form-d81' },
      { title: 'Financial statement for a financial order (Matrimonial Causes Act 1973 / Civil Partnership Act 2004): Form E', base_path: '/government/publications/form-e' },
      { title: 'Financial statement for a financial order: Form E1', base_path: '/government/publications/form-e1' },
      { title: 'Apply for a financial order: Form A', base_path: '/government/publications/form-a' },
      { title: 'Apply for a financial order (large print): Form A', base_path: '/government/publications/form-a-large' },
      { title: 'Form E2: Financial statement for a variation', web_url: 'https://www.gov.uk/government/publications/form-e2' },
      { title: 'Form A1: something else', base_path: '/government/publications/form-a1' },
      { title: 'Form EX160: help with fees', base_path: '/government/publications/ex160' },
    ],
  },
}

const SOURCES = {
  topics: [
    { id: 'money', gov: [{ path: '/money-property-when-relationship-ends' }] },
    { id: 'miam', gov: [{ path: '/money-property-when-relationship-ends/mediation' }] },
    { id: 'benefits', gov: [{ path: '/government/publications/x/y' }] },
    { id: 'divorce', gov: [{ path: '/get-a-divorce' }] },
    { id: 'legalaid', gov: [{ path: '/get-help-with-court-fees' }] },
    { id: 'counciltax', gov: [{ path: '/council-tax', confirm: true }] },
  ],
  disclosure: {
    gov: [{ path: '/money-property-when-relationship-ends/apply-for-consent-order' }],
    collection: { path: '/government/collections/financial-remedy-forms' },
  },
}

/* a fake GOV.UK: guide parts resolve to their guide, like the content store's prefix routes */
function govuk(over: Record<string, unknown> = {}, opts: { down?: boolean; live?: unknown } = {}) {
  const items: Record<string, unknown> = {
    '/money-property-when-relationship-ends': GUIDE,
    '/money-property-when-relationship-ends/mediation': GUIDE,
    '/money-property-when-relationship-ends/apply-for-consent-order': GUIDE,
    '/government/publications/x/y': PUBLICATION,
    '/get-a-divorce': STEPS,
    '/get-help-with-court-fees': TRANSACTION,
    '/government/collections/financial-remedy-forms': COLLECTION,
    ...over,
  }
  const calls: string[] = []
  const fetchJson = async (url: string) => {
    calls.push(url)
    if (url === LIVE_COPY) {
      if (opts.live === undefined) throw new Error('getaddrinfo ENOTFOUND decouple.uk')
      return { status: 200, json: opts.live }
    }
    if (opts.down) throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } })
    const path = url.slice(API.length)
    const item = items[path]
    if (item === 503) return { status: 503, json: null }
    return item ? { status: 200, json: item } : { status: 404, json: null }
  }
  return { fetchJson, calls }
}

type Page = { title: string; description: string; updated: string; url: string; body: string }
type Result = { content: { built: string | null; pages: Record<string, Page>; forms: { code: string; title: string; url: string }[] }; problems: string[]; warnings: string[] }

const run = (fetchJson: (u: string) => Promise<{ status: number; json: unknown }>, sources: unknown = SOURCES): Promise<Result> =>
  buildHelpContent(sources, { fetchJson, now: () => new Date('2026-10-16T05:00:00Z'), pauseMs: 0, retryOpts: { backoffMs: [0, 0] } }) as Promise<Result>

describe('help content: cleaning (spec §5.2)', () => {
  it('keeps only the allowed tags, with a link’s href made absolute', () => {
    expect(cleanBody('<h2 id="x" class="y">Title</h2><p style="color:red">Text <strong>bold</strong> <a href="/legal-aid" class="govuk-link" onclick="x()">legal aid</a></p>')).toBe(
      '<h2>Title</h2><p>Text <strong>bold</strong> <a href="https://www.gov.uk/legal-aid">legal aid</a></p>',
    )
    expect(cleanBody('<div class="call-to-action"><p>Call <abbr title="x">CLA</abbr><br/>now</p></div>')).toBe('<p>Call <abbr>CLA</abbr><br>now</p>')
    expect(cleanBody('<table class="t"><thead><tr><th scope="col">A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>')).toBe('<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>')
  })

  it('drops scripts, styles, iframes and images whole, and unsafe links', () => {
    const out = cleanBody('<p>a</p><script>alert(1)</script><style>p{}</style><iframe src="x"><p>in</p></iframe><img src="x.png" alt="pic"><svg><text>t</text></svg><!-- note --><p>b</p>')
    expect(out).toBe('<p>a</p><p>b</p>')
    expect(cleanBody('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(cleanBody('<a href="#section">x</a>')).toBe('<a>x</a>')
    expect(cleanHref('mailto:a@b.co')).toBe('mailto:a@b.co')
    expect(cleanHref('https://www.citizensadvice.org.uk/a?b=1&amp;c=2')).toBe('https://www.citizensadvice.org.uk/a?b=1&c=2')
  })

  it('closes what the source left open and never lets stray brackets through', () => {
    expect(cleanBody('<ul><li>one<li>two</ul>')).toBe('<ul><li>one<li>two</li></li></ul>')
    expect(cleanBody('<p>3 < 4 & 5 > 2</p>')).toBe('<p>3 &lt; 4 & 5 &gt; 2</p>')
    expect(cleanBody('<p>open')).toBe('<p>open</p>')
  })
})

describe('help content: pages and forms', () => {
  it('takes a guide whole, each part under its title, or the one part a path names', () => {
    const whole = pageFrom(GUIDE, '/money-property-when-relationship-ends')
    expect(whole).toMatchObject({ title: GUIDE.title, updated: GUIDE.public_updated_at, url: 'https://www.gov.uk/money-property-when-relationship-ends' })
    expect(whole?.body).toBe('<h2>Getting a financial agreement</h2>\n<p>You can agree.</p>\n<h2>Get help agreeing</h2>\n<p>A mediator can help.</p>\n<h2>If you agree</h2>\n<p>Draft a consent order.</p>')
    expect(pageFrom(GUIDE, '/money-property-when-relationship-ends/mediation')?.body).toBe('<p>A mediator can help.</p>')
    expect(pageFrom(GUIDE, '/money-property-when-relationship-ends/nope')).toBeNull()
  })

  it('takes a body, a transaction’s introduction, and nothing for a step-by-step page', () => {
    expect(pageFrom(PUBLICATION, '/government/publications/x/y')?.body).toBe('<h2>When you separate</h2><p>Tell us <a href="https://www.gov.uk/report-benefits-change-circumstances">straight away</a>.</p>')
    expect(pageFrom(TRANSACTION, '/get-help-with-court-fees')?.body).toBe('<p>You may be able to get money off.</p>\n<p>Apply online.</p>')
    expect(pageFrom(STEPS, '/get-a-divorce')).toMatchObject({ title: STEPS.title, description: STEPS.description, body: '' })
  })

  it('lists the five forms once each, wherever GOV.UK puts "Form X" in the title', () => {
    expect(formsFrom(COLLECTION)).toEqual([
      { code: 'D81', title: COLLECTION.links.documents[0].title, url: 'https://www.gov.uk/government/publications/form-d81' },
      { code: 'A', title: 'Apply for a financial order: Form A', url: 'https://www.gov.uk/government/publications/form-a' },
      { code: 'E', title: COLLECTION.links.documents[1].title, url: 'https://www.gov.uk/government/publications/form-e' },
      { code: 'E1', title: 'Financial statement for a financial order: Form E1', url: 'https://www.gov.uk/government/publications/form-e1' },
      { code: 'E2', title: 'Form E2: Financial statement for a variation', url: 'https://www.gov.uk/government/publications/form-e2' },
    ])
    expect(formsFrom({})).toEqual([])
  })

  it('collects every path once, with its topic, the confirm flag and the collection', () => {
    expect(collectPaths(SOURCES).map((p) => [p.path, p.topic, p.confirm])).toEqual([
      ['/money-property-when-relationship-ends', 'money', false],
      ['/money-property-when-relationship-ends/mediation', 'miam', false],
      ['/government/publications/x/y', 'benefits', false],
      ['/get-a-divorce', 'divorce', false],
      ['/get-help-with-court-fees', 'legalaid', false],
      ['/council-tax', 'counciltax', true],
      ['/money-property-when-relationship-ends/apply-for-consent-order', 'disclosure', false],
      ['/government/collections/financial-remedy-forms', 'disclosure', false],
    ])
  })
})

describe('help content: the whole step', () => {
  it('writes every page and the forms, and only warns about a missing confirm path', async () => {
    const { fetchJson } = govuk()
    const r = await run(fetchJson)
    expect(r.problems).toEqual([])
    expect(r.warnings).toEqual(['/council-tax (topic "counciltax") is not on GOV.UK (404); marked confirm, so left out'])
    expect(r.content.built).toBe('2026-10-16T05:00:00.000Z')
    expect(Object.keys(r.content.pages).sort()).toEqual([
      '/get-a-divorce',
      '/get-help-with-court-fees',
      '/government/collections/financial-remedy-forms',
      '/government/publications/x/y',
      '/money-property-when-relationship-ends',
      '/money-property-when-relationship-ends/apply-for-consent-order',
      '/money-property-when-relationship-ends/mediation',
    ])
    expect(r.content.pages['/money-property-when-relationship-ends/apply-for-consent-order'].body).toBe('<p>Draft a consent order.</p>')
    expect(r.content.forms.map((f) => f.code)).toEqual(['D81', 'A', 'E', 'E1', 'E2'])
  })

  it('fails by name on a path that is not on GOV.UK', async () => {
    const { fetchJson } = govuk()
    const r = await run(fetchJson, { topics: [...SOURCES.topics, { id: 'made-up', gov: [{ path: '/made-up-page' }] }] })
    expect(r.problems).toEqual(['/made-up-page (topic "made-up") is not on GOV.UK (404)'])
  })

  it('finds a guide part in its guide when GOV.UK has no route for the part itself', async () => {
    const { fetchJson } = govuk({ '/money-property-when-relationship-ends/mediation': undefined })
    const r = await run(fetchJson)
    expect(r.problems).toEqual([])
    expect(r.content.pages['/money-property-when-relationship-ends/mediation'].body).toBe('<p>A mediator can help.</p>')
    const nope = await run(govuk().fetchJson, { topics: [{ id: 'x', gov: [{ path: '/money-property-when-relationship-ends/no-such-part' }] }] })
    expect(nope.problems).toEqual(['/money-property-when-relationship-ends/no-such-part (topic "x") is not on GOV.UK (404)'])
    const routed = await run(govuk({ '/money-property-when-relationship-ends/no-such-part': GUIDE }).fetchJson, { topics: [{ id: 'x', gov: [{ path: '/money-property-when-relationship-ends/no-such-part' }] }] })
    expect(routed.problems).toEqual(['/money-property-when-relationship-ends/no-such-part (topic "x") is not on GOV.UK: the guide has no such part'])
    const pub = await run(govuk({ '/government/publications/x': PUBLICATION }).fetchJson, { topics: [{ id: 'y', gov: [{ path: '/government/publications/x/z' }] }] })
    expect(pub.problems).toEqual(['/government/publications/x/z (topic "y") is not on GOV.UK (404)'])
  })

  it('retries a 5xx, then reuses the live copy for what GOV.UK never answered', async () => {
    const live = { built: '2026-10-12T05:00:00.000Z', pages: { '/get-a-divorce': { title: 'old', description: '', updated: '', url: 'u', body: '' } }, forms: [{ code: 'A', title: 'old', url: 'u' }] }
    const { fetchJson, calls } = govuk({ '/get-a-divorce': 503 }, { live })
    const r = await run(fetchJson)
    expect(calls.filter((c) => c.endsWith('/get-a-divorce'))).toHaveLength(3)
    expect(r.problems).toEqual([])
    expect(r.content.pages['/get-a-divorce'].title).toBe('old')
    expect(r.content.forms.map((f) => f.code)).toEqual(['D81', 'A', 'E', 'E1', 'E2'])
    expect(r.warnings).toContain('1 of 8 paths got no answer from GOV.UK; reused 1 from the live copy')
  })

  it('with GOV.UK down, stops asking after three, and falls back to the live copy, then to nothing', async () => {
    const live = { built: '2026-10-12T05:00:00.000Z', pages: { '/get-a-divorce': { title: 'old' } }, forms: [] }
    const down = govuk({}, { down: true, live })
    const r = await run(down.fetchJson)
    expect(down.calls.filter((c) => c.startsWith(API))).toHaveLength(9)
    expect(r.problems).toEqual([])
    expect(r.content).toEqual({ built: '2026-10-12T05:00:00.000Z', pages: { '/get-a-divorce': { title: 'old' } }, forms: [] })
    const nothing = await run(govuk({}, { down: true }).fetchJson)
    expect(nothing.content).toEqual({ built: null, pages: {}, forms: [] })
    expect(nothing.warnings).toEqual(['GOV.UK could not be reached; the live copy could not be read either, so 8 show as links only'])
  })

  it('never types a figure: the content holds only what GOV.UK returned', async () => {
    const r = await run(govuk().fetchJson)
    const all = JSON.stringify(r.content)
    for (const s of ['£', '500', '2029', '2027']) expect(all, s).not.toContain(s)
  })
})
