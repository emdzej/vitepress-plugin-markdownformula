import { defineConfig } from 'vitepress'
import { markdownFormula } from 'vitepress-plugin-markdownformula'

export default defineConfig({
  // Set DOCS_BASE (e.g. "/vitepress-plugin-markdownformula/") when deploying to
  // a GitHub Pages project site; defaults to "/" for local dev.
  base: process.env.DOCS_BASE || '/',
  title: 'vitepress-plugin-markdownformula',
  description: 'Evaluate Excel-like formulas in your VitePress markdown tables.',
  cleanUrls: true,
  markdown: {
    config: (md) => {
      md.use(markdownFormula, {
        precisionRounding: 4,
        output: 'span',
      })
    },
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/' },
      { text: 'Examples', link: '/examples' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting started', link: '/' },
          { text: 'Examples', link: '/examples' },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/emdzej/vitepress-plugin-markdownformula',
      },
    ],
  },
})
