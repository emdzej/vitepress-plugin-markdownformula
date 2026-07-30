<p align="center">
  <img src="./packages/vitepress-plugin-markdownformula/logo/logo.png" alt="markdown-formula" width="96" />
</p>

<h1 align="center">vitepress-plugin-markdownformula</h1>

<p align="center">
  Evaluate Excel-like formulas in your VitePress markdown tables — at build time,
  powered by <a href="https://hyperformula.handsontable.com/">HyperFormula</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vitepress-plugin-markdownformula"><img src="https://img.shields.io/npm/v/vitepress-plugin-markdownformula.svg" alt="npm version" /></a>
  <a href="https://github.com/emdzej/vitepress-plugin-markdownformula/actions/workflows/ci.yml"><img src="https://github.com/emdzej/vitepress-plugin-markdownformula/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0--or--later-blue.svg" alt="License" /></a>
</p>

---

Write a formula as a markdown link whose target is the formula prefixed with `#`
(the `#` stands in for Excel's `=`, so the source stays valid markdown):

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

The last column renders as `11`, `24`, and `5.5` in your published site — no
client-side JavaScript.

Inspired by the [MarkdownFormula](https://github.com/cescript/MarkdownFormula)
VS Code extension; where that rewrites your files on save, this evaluates while
VitePress renders.

## Documentation

Full usage, options, and live examples: **the [docs site](./apps/docs)**
(run `pnpm docs:dev`), or the package
[README](./packages/vitepress-plugin-markdownformula/README.md).

## Quick start

```bash
pnpm add -D vitepress-plugin-markdownformula
```

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { markdownFormula } from 'vitepress-plugin-markdownformula'

export default defineConfig({
  markdown: {
    config: (md) => md.use(markdownFormula, { precisionRounding: 4 }),
  },
})
```

## Repository layout

This is a [pnpm](https://pnpm.io/) + [Turborepo](https://turbo.build/) workspace.

```
packages/
  vitepress-plugin-markdownformula/   # the published plugin
apps/
  docs/                               # VitePress demo & documentation site
```

## Development

```bash
pnpm install
pnpm build        # build the plugin (turbo)
pnpm test         # run unit tests
pnpm typecheck    # type-check all packages
pnpm docs:dev     # run the demo docs site
```

## Releasing

Versioning and publishing are automated with
[Changesets](https://github.com/changesets/changesets):

1. Run `pnpm changeset` and describe your change.
2. Merge to `main`. The **Release** workflow opens a "Version Packages" PR.
3. Merge that PR to publish to npm (requires an `NPM_TOKEN` repository secret).

The **CI** workflow builds, type-checks, and tests on every push and PR; the
**Docs** workflow deploys the site to GitHub Pages.

## License

GPL-3.0-or-later.
