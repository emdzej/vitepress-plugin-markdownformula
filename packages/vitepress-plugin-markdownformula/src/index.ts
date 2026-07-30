import type MarkdownIt from 'markdown-it'
import { collectFormulaMatches } from './evaluate.js'
import type {
  FormulaMatch,
  MarkdownFormulaOptions,
  ResolvedOptions,
} from './types.js'

export type {
  FormulaMatch,
  FormulaOutput,
  MarkdownFormulaOptions,
  ResolvedOptions,
} from './types.js'
export { collectFormulaMatches } from './evaluate.js'

const DEFAULTS: ResolvedOptions = {
  precisionRounding: 4,
  includeHeaderInCellEnumeration: false,
  output: 'span',
  className: 'markdown-formula',
}

function resolveOptions(options: MarkdownFormulaOptions = {}): ResolvedOptions {
  return { ...DEFAULTS, ...options }
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Render a single evaluated match into its replacement string. */
function renderMatch(match: FormulaMatch, options: ResolvedOptions): string {
  switch (options.output) {
    case 'text':
      return match.value
    case 'link':
      return `[${match.value}](#${match.formula})`
    case 'span':
    default:
      return (
        `<span class="${escapeAttr(options.className)}"` +
        ` data-formula="${escapeAttr(match.formula)}"` +
        ` title="${escapeAttr(match.formula)}">` +
        `${escapeText(match.value)}</span>`
      )
  }
}

/**
 * Evaluate every `[value](#formula)` in a markdown document and return the
 * document with each match replaced according to `options`. Pure and
 * synchronous — useful for testing or custom pipelines.
 */
export function transformSource(
  source: string,
  options: MarkdownFormulaOptions = {},
): string {
  // Fast path: nothing that could be a formula link.
  if (!source.includes('](#')) return source

  const resolved = resolveOptions(options)
  const matches = collectFormulaMatches(source, resolved)
  if (matches.length === 0) return source

  const lines = source.split(/\r?\n/gm)

  // Group matches by line, then apply right-to-left so earlier column offsets
  // stay valid as we splice replacements in.
  const byLine = new Map<number, FormulaMatch[]>()
  for (const match of matches) {
    const bucket = byLine.get(match.line)
    if (bucket) bucket.push(match)
    else byLine.set(match.line, [match])
  }

  for (const [line, lineMatches] of byLine) {
    if (line < 0 || line >= lines.length) continue
    lineMatches.sort((a, b) => b.column - a.column)
    let text = lines[line]
    for (const match of lineMatches) {
      text =
        text.slice(0, match.column) +
        renderMatch(match, resolved) +
        text.slice(match.column + match.length)
    }
    lines[line] = text
  }

  return lines.join('\n')
}

/**
 * markdown-it plugin that evaluates Excel-like formulas embedded in markdown
 * tables. Register it from your VitePress config:
 *
 * ```ts
 * import { defineConfig } from 'vitepress'
 * import { markdownFormula } from 'vitepress-plugin-markdownformula'
 *
 * export default defineConfig({
 *   markdown: {
 *     config: (md) => md.use(markdownFormula, { precisionRounding: 4 }),
 *   },
 * })
 * ```
 */
export function markdownFormula(
  md: MarkdownIt,
  options: MarkdownFormulaOptions = {},
): void {
  const resolved = resolveOptions(options)

  // Run after `normalize` (line endings unified) but before `block`, so the
  // block tokenizer parses the already-computed values.
  md.core.ruler.before('block', 'markdown_formula', (state) => {
    state.src = transformSource(state.src, resolved)
  })
}

export default markdownFormula
