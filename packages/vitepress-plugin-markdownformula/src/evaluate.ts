import { HyperFormula, DetailedCellError } from 'hyperformula'
import type { SimpleCellAddress } from 'hyperformula'
import type { FormulaMatch, ResolvedOptions } from './types.js'

/** A single parsed table cell and where it lives in the source. */
interface TableCell {
  line: number
  column: number
  content: string
}

/** A markdown table mapped onto a HyperFormula sheet. */
interface TableContent {
  sheet: string
  data: TableCell[][]
}

/** Matches a `[value](#formula)` link. The formula group is greedy so nested
 * parentheses — e.g. `#COUNTIF(C1:C3,">3")` — are captured correctly. */
const FORMULA_PATTERN = /\[.*?\]\(#(.*)\)/

/**
 * Parse every markdown table in `source`, evaluate the embedded formulas with
 * HyperFormula, and return the list of matches with their computed values.
 * Each table becomes an isolated sheet, so cross-table references such as
 * `#table1!C3` work exactly like the VS Code extension.
 */
export function collectFormulaMatches(
  source: string,
  options: ResolvedOptions,
): FormulaMatch[] {
  const lines = source.split(/\r?\n/gm)
  const tables = splitValidMarkdownTables(lines, options.includeHeaderInCellEnumeration)

  const precisionRounding =
    options.precisionRounding >= 0 ? options.precisionRounding : 4

  const hf = HyperFormula.buildEmpty({
    precisionRounding,
    licenseKey: 'gpl-v3',
  })

  const matches: FormulaMatch[] = []

  try {
    for (const table of tables) {
      const sheetName = hf.addSheet(table.sheet)
      const sheetId = hf.getSheetId(sheetName)
      if (typeof sheetId === 'undefined') continue

      const { data, cells } = buildSheetData(table, sheetId)
      hf.setSheetContent(sheetId, data)

      for (const cell of cells) {
        matches.push({
          line: cell.line,
          column: cell.column,
          length: cell.length,
          formula: cell.formula,
          value: stringifyValue(hf.getCellValue(cell.address)),
        })
      }
    }
  } finally {
    hf.destroy()
  }

  return matches
}

/** A formula cell discovered while flattening a table into sheet data. */
interface FormulaCell {
  address: SimpleCellAddress
  line: number
  column: number
  length: number
  formula: string
}

/** Flatten a table into the 2D content array HyperFormula expects, collecting
 * the formula cells (and their source locations) along the way. */
function buildSheetData(
  table: TableContent,
  sheetId: number,
): { data: string[][]; cells: FormulaCell[] } {
  const data: string[][] = []
  const cells: FormulaCell[] = []

  for (let row = 0; row < table.data.length; row++) {
    const rowData: string[] = []

    for (let col = 0; col < table.data[row].length; col++) {
      let content = table.data[row][col].content
      const match = FORMULA_PATTERN.exec(content)

      if (match !== null && match.index !== undefined) {
        cells.push({
          address: { col, row, sheet: sheetId },
          line: table.data[row][col].line,
          column: table.data[row][col].column + match.index,
          length: match[0].length,
          formula: match[1],
        })
        content = '=' + match[1]
      }

      rowData.push(content.trim())
    }

    data.push(rowData)
  }

  return { data, cells }
}

/** Render a HyperFormula cell value to a display string, Excel-style. */
function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof DetailedCellError) return value.value
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  return String(value)
}

/**
 * Split a document into candidate table blocks and keep the ones that look
 * like GitHub-flavoured markdown tables (a header row followed by a
 * `|---|---|` delimiter row and at least one data row).
 */
function splitValidMarkdownTables(
  lines: string[],
  includeHeader: boolean,
): TableContent[] {
  const candidateLines: number[] = []
  const tablePattern = /^\|(.*)\|$/

  for (let l = 0; l < lines.length; l++) {
    if (tablePattern.test(lines[l].trim())) candidateLines.push(l)
  }

  const blocks = findConsecutiveBlocks(candidateLines)
  const tables: TableContent[] = []

  for (const block of blocks) {
    // second line must be the |---|---| delimiter row
    if (!/(?:\|.+?[-]+.+?)+\|/.test(lines[block[1]])) continue
    // need header + delimiter + at least one data row
    if (block.length <= 2) continue
    tables.push(getTableContent(lines, block, tables.length, includeHeader))
  }

  return tables
}

/**
 * Group a sorted list of line numbers into runs of consecutive lines.
 * `[1,2,4,5,6,7,9]` → `[[1,2],[4,5,6,7]]`. Runs shorter than two lines are
 * dropped (a lone `|...|` line is not a table).
 */
function findConsecutiveBlocks(array: number[]): number[][] {
  const blocks: number[][] = []
  if (array.length === 0) return blocks

  let run = [array[0]]
  for (let k = 1; k < array.length; k++) {
    if (run[run.length - 1] + 1 === array[k]) {
      run.push(array[k])
    } else {
      if (run.length >= 2) blocks.push(run)
      run = [array[k]]
    }
  }
  if (run.length >= 2) blocks.push(run)

  return blocks
}

/** Build a {@link TableContent} from a block of table lines, resolving the
 * sheet name from a preceding `<!-- name -->` comment when present. */
function getTableContent(
  lines: string[],
  dataLines: number[],
  index: number,
  includeHeader: boolean,
): TableContent {
  const table: TableContent = { sheet: 'Sheet' + index, data: [] }

  if (includeHeader) {
    table.data.push(getTableColumns(lines, dataLines[0]))
  }

  // skip the header row and the |---| delimiter row
  for (let i = 2; i < dataLines.length; i++) {
    table.data.push(getTableColumns(lines, dataLines[i]))
  }

  if (dataLines[0] > 0) {
    const previous = lines[dataLines[0] - 1]
    const comment = previous.match(/<!--(.+?)-->/)
    if (comment !== null) table.sheet = comment[1].trim()
  }

  return table
}

/** Split a single table row into cells, tracking each cell's start column so
 * formulas can later be located precisely in the source line. */
function getTableColumns(lines: string[], lineNumber: number): TableCell[] {
  const columns: TableCell[] = []
  const splits = lines[lineNumber].split('|')

  // Character offset where the first cell's content begins: everything before
  // the leading pipe (usually empty) plus the pipe itself.
  let column = splits[0].length + 1

  // skip the empty first/last segments produced by the leading/trailing pipe
  for (let i = 1; i < splits.length - 1; i++) {
    columns.push({ line: lineNumber, column, content: splits[i] })
    column += splits[i].length + 1
  }

  return columns
}
