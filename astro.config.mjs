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
