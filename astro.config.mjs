// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// When deploying to GitHub Pages at a custom domain (e.g. docs.syncbins.com),
// set site to that domain and leave base as '/'.
// For a repo sub-path (e.g. syncbins.github.io/Docs), set base: '/Docs'.

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.syncbins.com',
	integrations: [
		starlight({
			title: 'SyncBins',
			description: 'Personal sharing portal — end-to-end encrypted, self-hostable, multi-device.',
			favicon: {
				href: '/favicon.svg',
				type: 'image/svg+xml',
			},
			head: [
				// Fallback ICO for browsers that don't support SVG favicons
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				// Apple touch icon
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				// Web manifest (PWA / home screen install)
				{ tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
				// Open Graph
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://docs.syncbins.com/sbog.png' } },
				{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
				{ tag: 'meta', attrs: { property: 'og:site_name', content: 'SyncBins Docs' } },
				// Twitter / X card
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://docs.syncbins.com/sbog.png' } },
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/SyncBins' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Getting Started', slug: 'guides/getting-started' },
						{ label: 'Self-Hosting', slug: 'guides/self-hosting' },
						{ label: 'Pairing Devices', slug: 'guides/pairing-devices' },
						{ label: 'MCP Server', slug: 'guides/mcp-server' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'REST API', slug: 'reference/api' },
						{ label: 'Encryption & Security', slug: 'reference/encryption' },
						{ label: 'Content Types', slug: 'reference/content-types' },
						{ label: 'WebSocket Protocol', slug: 'reference/websocket' },
					],
				},
			],
		}),
	],
});
