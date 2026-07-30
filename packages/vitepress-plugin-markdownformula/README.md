<p align="center">
  <img src="./logo/logo.png" alt="markdown-formula" width="96" />
</p>

<h1 align="center">vitepress-plugin-markdownformula</h1>

<p align="center">
  Evaluate Excel-like formulas in your VitePress (markdown-it) tables — at build time.
</p>

---

Inspired by the [MarkdownFormula](https://github.com/cescript/MarkdownFormula)
VS Code extension. Where that extension rewrites your files on save, this plugin
evaluates formulas **while VitePress renders**, so your source keeps the formula
and your published site shows the computed value. Powered by
[HyperFormula](https://hyperformula.handsontable.com/).

## How it works

Write a formula as a markdown link whose target is the formula prefixed with `#`
(the `#` stands in for Excel's `=`, keeping the source valid markdown):

```markdown
[placeholder](#SUM(C1:C2))
```

At render time the plugin parses every table in the document, treats each table
as a spreadsheet sheet (columns `A, B, …`, rows `1, 2, …`), evaluates the
formulas, and replaces the link with the result.

- **Sheet names** — an HTML comment `<!-- name -->` directly above a table names
  its sheet. Otherwise sheets are `Sheet0`, `Sheet1`, … in document order.
- **Cross-table references** — `#table1!C3` reads cell `C3` from the sheet named
  `table1`.
- **Rows** — the header row is *not* counted by default; the first data row is
  row `1` (toggle with `includeHeaderInCellEnumeration`).

## Install

```bash
pnpm add -D vitepress-plugin-markdownformula
# or: npm i -D  /  yarn add -D
```

`markdown-it` is a peer dependency and already ships with VitePress.

## Usage

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { markdownFormula } from 'vitepress-plugin-markdownformula'

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(markdownFormula, { precisionRounding: 4 })
    },
  },
})
```

### Example

```markdown
<!-- table1 -->
| name           | formula           | value                |
| -------------- | ----------------- | -------------------- |
| three          | –                 | 3                    |
| eight          | –                 | 8                    |
| summation      | #SUM(C1:C2)       | [?](#SUM(C1:C2))     |
| multiplication | #C1*C2            | [?](#C1*C2)          |
| average        | #AVERAGE(C1:C2)   | [?](#AVERAGE(C1:C2)) |
```

renders `11`, `24` and `5.5` in the last column.

## Options

| Option                           | Type                        | Default              | Description                                                                                 |
| -------------------------------- | --------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `precisionRounding`              | `number`                    | `4`                  | Floating-point rounding precision, forwarded to HyperFormula.                               |
| `includeHeaderInCellEnumeration` | `boolean`                   | `false`              | Count the header as row `1`. When `false`, the first data row is row `1`.                    |
| `output`                         | `'span' \| 'text' \| 'link'`| `'span'`             | How to render an evaluated cell (see below).                                                |
| `className`                      | `string`                    | `'markdown-formula'` | CSS class for the wrapping `<span>` when `output` is `'span'`.                               |

### `output` modes

- **`span`** (default) — `<span class="markdown-formula" data-formula="…" title="…">value</span>`.
  The formula stays discoverable on hover and is easy to style:

  ```css
  .markdown-formula { border-bottom: 1px dotted; cursor: help; }
  ```

- **`text`** — the bare computed value.
- **`link`** — the original `[value](#formula)` link style, faithful to the VS
  Code extension.

## Programmatic API

```ts
import { transformSource, collectFormulaMatches } from 'vitepress-plugin-markdownformula'

transformSource('| a |\n| - |\n| [?](#1+1) |', { output: 'text' })
// → '| a |\n| - |\n| 2 |'

collectFormulaMatches(source, resolvedOptions)
// → [{ line, column, length, formula, value }, …]
```

## License

GPL-3.0-or-later. HyperFormula is used under its `gpl-v3` license key.
