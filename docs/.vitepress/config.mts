import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Reefs',
  description: 'A reactive query language for the OCEAN blackboard system',
  base: '/reefs-documentation/',

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/flow-documentation/favicon.png' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide',     link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/syntax' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started',     link: '/guide/getting-started' },
          { text: 'Writing Queries',     link: '/guide/writing-queries' },
          { text: 'Observers & Modes',   link: '/guide/observers' },
          { text: 'Unity Integration',   link: '/guide/unity-integration' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Query Syntax',  link: '/reference/syntax' },
          { text: 'Keywords',      link: '/reference/keywords' },
          { text: 'API',           link: '/reference/api' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/filipefthomaz-gd/Reefs' },
    ],

    footer: {
      message: 'Reefs — A reactive query language for the OCEAN blackboard system.',
    },

    search: {
      provider: 'local',
    },
  },
})
