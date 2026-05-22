// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightUtils from '@lorenzo_lewis/starlight-utils';
import starlightCelestiaTheme from 'starlight-theme-celestia';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.syncbins.com',
  integrations: [
    starlight({
      title: 'SyncBins',
      plugins: [
        starlightCelestiaTheme({ stylingSystem: 'css' }),
        starlightUtils({
          multiSidebar: {
            switcherStyle: 'horizontalList',
          },
        }),
      ],
      description: 'SyncBins documentation — personal sharing portal, end-to-end encrypted, self-hostable.',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      favicon: '/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0c0b0e', media: '(prefers-color-scheme: dark)' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#faf8f5', media: '(prefers-color-scheme: light)' } },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://docs.syncbins.com/sbog.png' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://docs.syncbins.com/sbog.png' } },
      ],
      social: [
        { icon: 'github',  label: 'GitHub',  href: 'https://github.com/SyncBins' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/syncbins' },
      ],
      editLink: {
        baseUrl: 'https://github.com/SyncBins/Docs/edit/main/',
      },
      customCss: [
        '@fontsource/geist-mono/400.css',
        '@fontsource/geist-mono/500.css',
        './src/styles/custom.css',
      ],
      // Persona-split sidebar — KNOWLEDGE-BASE §5 proposed IA
      sidebar: [
        {
          label: 'Get Started',
          items: [
            { label: 'Welcome',                slug: 'get-started/welcome' },
            { label: 'First-time setup',       slug: 'get-started/first-setup' },
            { label: 'Adding your first item', slug: 'get-started/first-item' },
            { label: 'Pairing more devices',   slug: 'get-started/pairing' },
            { label: 'Quick-unlock PIN',       slug: 'get-started/quick-unlock', badge: { text: 'New', variant: 'tip' } },
            { label: 'Recovery scenarios',     slug: 'get-started/recovery',     badge: { text: 'New', variant: 'tip' } },
          ],
        },
        {
          label: 'Self-Hosting',
          items: [
            { label: 'Quick start (Docker)',   slug: 'self-hosting/quickstart' },
            { label: 'Choosing storage',       slug: 'self-hosting/storage', badge: { text: 'New', variant: 'tip' } },
            { label: 'TLS & domains',          slug: 'self-hosting/tls' },
            { label: 'Backups & restore',      slug: 'self-hosting/backups' },
            { label: 'Upgrades',               slug: 'self-hosting/upgrades' },
            { label: 'Configuration reference',slug: 'self-hosting/config' },
            { label: 'Multi-tenant mode',      slug: 'self-hosting/multi-tenant', badge: { text: 'New', variant: 'tip' } },
            { label: 'Troubleshooting',        slug: 'self-hosting/troubleshooting' },
          ],
        },
        {
          label: 'Integrations',
          items: [
            { label: 'MCP server',             slug: 'integrations/mcp' },
            { label: 'Browser extension',      slug: 'integrations/extension', badge: { text: 'Soon', variant: 'note' } },
            { label: 'Mobile apps',            slug: 'integrations/mobile',    badge: { text: 'Soon', variant: 'note' } },
            { label: 'Native desktop',         slug: 'integrations/desktop',   badge: { text: 'Soon', variant: 'note' } },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'How encryption works',   slug: 'concepts/encryption' },
            { label: 'How sync works',         slug: 'concepts/sync' },
            { label: 'The device model',      slug: 'concepts/devices' },
            { label: 'Multi-tenant vs single', slug: 'concepts/tenancy' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'REST API',               slug: 'reference/rest' },
            { label: 'WebSocket protocol',     slug: 'reference/ws' },
            { label: 'Encryption envelope',    slug: 'reference/envelope' },
            { label: 'Content types',          slug: 'reference/types' },
            { label: 'Error codes',            slug: 'reference/errors', badge: { text: 'New', variant: 'tip' } },
          ],
        },
        {
          label: 'Project',
          items: [
            { label: 'Changelog',              slug: 'project/changelog' },
            { label: 'Roadmap',                slug: 'project/roadmap' },
            { label: 'License & contributing', slug: 'project/license' },
          ],
        },
      ],
      components: {
        // Slot in a hero with the persona cards on the landing page.
        // We override Starlight's default Hero with our own Astro component.
        // Hero: './src/components/Hero.astro',
      },
      lastUpdated: true,
    }),
  ],
});
