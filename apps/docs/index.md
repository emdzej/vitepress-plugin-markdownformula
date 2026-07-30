# vitepress-plugin-markdownformula

Write Excel-like formulas directly in your markdown tables. They are evaluated
**at build time** by [HyperFormula](https://hyperformula.handsontable.com/) and
the computed values are baked into your static site — no client-side JavaScript.

## The idea

A formula is written as a markdown link whose text is a placeholder and whose
target is the formula, prefixed with `#`:

```
[placeholder](#FORMULA)
```

The `#` replaces the `=` you would use in Excel, so the source stays valid
markdown. Columns are addressed with letters (`A`, `B`, …) and rows with numbers
(`1`, `2`, …), exactly like a spreadsheet.

## Try it

The table below is written with formulas — hover a computed cell to see the
formula behind it.

<!-- demo -->
| name           | formula           | value                       |
| -------------- | ----------------- | --------------------------- |
| three          | –                 | 3                           |
| eight          | –                 | 8                           |
| summation      | `#SUM(C1:C2)`     | [?](#SUM(C1:C2))            |
| multiplication | `#C1*C2`          | [?](#C1*C2)                 |
| average        | `#AVERAGE(C1:C2)` | [?](#AVERAGE(C1:C2))        |

::: tip What happened
`C1` and `C2` hold `3` and `8`. `SUM(C1:C2)` → **11**, `C1*C2` → **24**,
`AVERAGE(C1:C2)` → **5.5**. The values above are generated at build time.
:::

## Installation

```bash
pnpm add -D vitepress-plugin-markdownformula
```

## Usage

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { markdownFormula } from 'vitepress-plugin-markdownformula'

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(markdownFormula, {
        precisionRounding: 4, // HyperFormula rounding precision
        output: 'span',       // 'span' | 'text' | 'link'
      })
    },
  },
})
```

## Writing formulas

| Concept              | Syntax                    | Notes                                                              |
| -------------------- | ------------------------- | ------------------------------------------------------------------ |
| Formula cell         | `[placeholder](#FORMULA)` | The link text is a placeholder; the target is the formula.         |
| Column / row address | `C2`                      | Columns are letters, rows are numbers — like a spreadsheet.        |
| Sheet name           | `<!-- name -->`           | Put the comment on the line directly above a table.                |
| Cross-table ref      | `#table1!C3`              | `SheetName!Cell` reads from another table.                         |

By default the **header row is not numbered** — the first data row is row `1`.
Set `includeHeaderInCellEnumeration: true` to count the header as row `1`.

## Options

| Option                           | Type                          | Default              | Description                                                        |
| -------------------------------- | ----------------------------- | -------------------- | ------------------------------------------------------------------ |
| `precisionRounding`              | `number`                      | `4`                  | Floating-point rounding precision, forwarded to HyperFormula.      |
| `includeHeaderInCellEnumeration` | `boolean`                     | `false`              | Count the header as row `1`.                                       |
| `output`                         | `'span' \| 'text' \| 'link'`  | `'span'`             | How to render an evaluated cell (see below).                       |
| `className`                      | `string`                      | `'markdown-formula'` | CSS class for the wrapping `<span>` when `output` is `'span'`.     |

### Output modes

- **`span`** (default) — `<span class="markdown-formula" data-formula="…" title="…">value</span>`.
  The formula stays discoverable on hover and is easy to style.
- **`text`** — the bare computed value.
- **`link`** — the original `[value](#formula)` link style, faithful to the
  [MarkdownFormula](https://github.com/cescript/MarkdownFormula) VS Code extension.

### Styling the `span` output

Add a rule to your VitePress theme (`.vitepress/theme/custom.css`):

```css
.markdown-formula {
  border-bottom: 1px dotted var(--vp-c-brand-1);
  cursor: help;
}
```

## Programmatic API

Both helpers are exported for testing or custom pipelines:

```ts
import {
  transformSource,
  collectFormulaMatches,
} from 'vitepress-plugin-markdownformula'

transformSource('| a |\n| - |\n| [?](#1+1) |', { output: 'text' })
// → '| a |\n| - |\n| 2 |'

collectFormulaMatches(source, resolvedOptions)
// → [{ line, column, length, formula, value }, …]
```

## Next steps

See [Examples](/examples) for named sheets, cross-table references, and error
handling in action.

