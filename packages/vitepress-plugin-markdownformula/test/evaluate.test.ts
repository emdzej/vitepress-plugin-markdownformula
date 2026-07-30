import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { collectFormulaMatches, transformSource, markdownFormula } from '../src/index.js'

const table1 = `<!-- table1 -->
| name           | formula         | values           |
| -------------- | --------------- | ---------------- |
| three          | -               | 3                |
| eight          | -               | 8                |
| summation      | #SUM(C1:C2)     | [?](#SUM(C1:C2)) |
| multiplication | #C1*C2          | [?](#C1*C2)      |
| average        | #AVERAGE(C1:C2) | [?](#AVERAGE(C1:C2)) |
`

describe('collectFormulaMatches', () => {
  it('evaluates the basic example', () => {
    const matches = collectFormulaMatches(table1, {
      precisionRounding: 4,
      includeHeaderInCellEnumeration: false,
      output: 'text',
      className: 'markdown-formula',
    })
    const byFormula = Object.fromEntries(matches.map((m) => [m.formula, m.value]))
    expect(byFormula['SUM(C1:C2)']).toBe('11')
    expect(byFormula['C1*C2']).toBe('24')
    expect(byFormula['AVERAGE(C1:C2)']).toBe('5.5')
  })

  it('reports accurate source locations', () => {
    const matches = collectFormulaMatches(table1, {
      precisionRounding: 4,
      includeHeaderInCellEnumeration: false,
      output: 'text',
      className: 'markdown-formula',
    })
    const sum = matches.find((m) => m.formula === 'SUM(C1:C2)')!
    const line = table1.split('\n')[sum.line]
    expect(line.slice(sum.column, sum.column + sum.length)).toBe('[?](#SUM(C1:C2))')
  })
})

describe('transformSource', () => {
  it('replaces formulas with plain values in text mode', () => {
    const out = transformSource(table1, { output: 'text' })
    expect(out).toContain('| summation      | #SUM(C1:C2)     | 11 |')
    expect(out).toContain('| #C1*C2          | 24')
    expect(out).toContain('5.5')
    expect(out).not.toContain('[?]')
  })

  it('wraps values in a span with the formula preserved (default)', () => {
    const out = transformSource(table1)
    expect(out).toContain(
      '<span class="markdown-formula" data-formula="SUM(C1:C2)" title="SUM(C1:C2)">11</span>',
    )
  })

  it('keeps the original link style in link mode', () => {
    const out = transformSource(table1, { output: 'link' })
    expect(out).toContain('[11](#SUM(C1:C2))')
  })

  it('honours a custom class name', () => {
    const out = transformSource(table1, { className: 'formula' })
    expect(out).toContain('<span class="formula"')
  })

  it('is a no-op for documents without formulas', () => {
    const doc = '# Hello\n\nJust prose, no tables.\n'
    expect(transformSource(doc)).toBe(doc)
  })

  it('handles formulas containing quotes and parentheses', () => {
    const doc = `<!-- t -->
| a | b | c |
| - | - | - |
| 3 | x | [?](#COUNTIF(A1:A3,">3")) |
| 8 | y | z |
| 11 | z | w |
`
    // A column values are 3, 8, 11 → two are > 3
    const text = transformSource(doc, { output: 'text' })
    expect(text).toContain('| 3 | x | 2 |')

    const span = transformSource(doc, { output: 'span' })
    expect(span).toContain('data-formula="COUNTIF(A1:A3,&quot;&gt;3&quot;)"')
  })

  it('renders spreadsheet errors as error codes', () => {
    const doc = `<!-- e -->
| a | b |
| - | - |
| 1 | [?](#A1/0) |
`
    expect(transformSource(doc, { output: 'text' })).toContain('#DIV/0!')
  })
})

describe('cross-sheet references', () => {
  const doc =
    table1 +
    `
<!-- table2 -->
| name                  | value            |
| --------------------- | ---------------- |
| summation from table1 | [?](#table1!C3)  |
`
  it('resolves references to other tables by sheet name', () => {
    const out = transformSource(doc, { output: 'text' })
    expect(out).toContain('| summation from table1 | 11')
  })
})

describe('markdown-it integration', () => {
  it('computes values during rendering', () => {
    const md = new MarkdownIt({ html: true }).use(markdownFormula, { output: 'text' })
    const html = md.render(table1)
    expect(html).toContain('<td>11</td>')
    expect(html).toContain('<td>24</td>')
    // the value cell no longer contains the raw formula link
    expect(html).not.toContain('](#SUM')
  })

  it('emits span markup when configured', () => {
    const md = new MarkdownIt({ html: true }).use(markdownFormula)
    const html = md.render(table1)
    expect(html).toContain('<span class="markdown-formula"')
    expect(html).toContain('>11</span>')
  })
})
