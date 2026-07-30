/**
 * How an evaluated formula cell is rendered into the output.
 *
 * - `span`  – `<span class="markdown-formula" data-formula="…" title="…">value</span>`
 *             (default; keeps the formula discoverable on hover / for styling)
 * - `text`  – the bare computed value, as plain text
 * - `link`  – the original `[value](#formula)` link style, faithful to the
 *             VS Code *markdown-formula* extension
 */
export type FormulaOutput = 'span' | 'text' | 'link'

export interface MarkdownFormulaOptions {
  /**
   * Rounding precision for floating point numbers, forwarded to HyperFormula.
   * @default 4
   */
  precisionRounding?: number

  /**
   * Include the table header as the first row (`1:1`) when enumerating cells.
   * When `false` (the default) the first *data* row is row `1`.
   * @default false
   */
  includeHeaderInCellEnumeration?: boolean

  /**
   * How to render an evaluated formula cell.
   * @default 'span'
   */
  output?: FormulaOutput

  /**
   * CSS class applied to the wrapping element when {@link output} is `span`.
   * @default 'markdown-formula'
   */
  className?: string
}

/** Fully-resolved options with defaults applied. */
export type ResolvedOptions = Required<MarkdownFormulaOptions>

/** A single formula found in the source, with everything needed to replace it. */
export interface FormulaMatch {
  /** Zero-based line index in the source document. */
  line: number
  /** Zero-based column (character) offset of the match within the line. */
  column: number
  /** Length of the matched `[value](#formula)` substring. */
  length: number
  /** The extracted formula text (without the leading `#`). */
  formula: string
  /** The computed value rendered to a string. */
  value: string
}
