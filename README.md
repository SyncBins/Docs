# SyncBins Docs

Documentation site for [SyncBins](https://syncbins.com) — the personal sharing portal.

**Live:** [docs.syncbins.com](https://docs.syncbins.com)
**Stack:** [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) → GitHub Pages
**Source of truth for protocol pages:** the App repo's `shared/src/*.ts` zod schemas.

---

## Quick start

```bash
npm install
npm run dev          # → http://localhost:4321
npm run build        # → dist/
npm run preview      # serve dist/ locally
```

Node 22 LTS recommended (matches the deploy workflow).

---

## Project layout

```
Docs/
├── astro.config.mjs                  ← sidebar IA, theme, head injections
├── package.json
├── tsconfig.json
├── public/                           ← copied verbatim to dist root
│   ├── CNAME                         ← docs.syncbins.com
│   ├── favicon.svg / favicon-96x96.png / apple-touch-icon.png
│   ├── sbog.png                      ← OG image
│   ├── syncbins-hero.png             ← landing hero illustration
│   └── site.webmanifest
├── src/
│   ├── assets/logo.svg               ← site logo (Starlight resolves via config)
│   ├── content.config.ts             ← Starlight content collection
│   ├── styles/custom.css             ← SyncBins theme: tokens → Starlight vars
│   ├── components/
│   │   ├── Endpoint.astro            ← REST API endpoint card
│   │   ├── Lens.astro                ← "what the server can see" 3-col table
│   │   └── PersonaCard.astro         ← landing-page hero card
│   └── content/docs/
│       ├── index.mdx                 ← landing (splash template)
│       ├── get-started/              ← Persona A (new users)
│       │   ├── welcome.mdx
│       │   ├── first-setup.mdx
│       │   ├── first-item.mdx
│       │   ├── pairing.mdx
│       │   ├── quick-unlock.mdx      ★ NEW (gap from KB)
│       │   └── recovery.mdx          ★ NEW (gap from KB)
│       ├── self-hosting/             ← Persona B (homelabbers)
│       │   ├── quickstart.mdx
│       │   ├── storage.mdx           ★ NEW (gap)
│       │   ├── tls.mdx
│       │   ├── backups.mdx
│       │   ├── upgrades.mdx
│       │   ├── config.mdx
│       │   ├── multi-tenant.mdx      ★ NEW (gap)
│       │   └── troubleshooting.mdx
│       ├── integrations/
│       │   ├── mcp.mdx
│       │   ├── extension.mdx         (stub — feature shipping later)
│       │   ├── mobile.mdx            (stub)
│       │   └── desktop.mdx           (stub)
│       ├── concepts/
│       │   ├── encryption.mdx        ← inline SVG diagrams
│       │   ├── sync.mdx
│       │   ├── devices.mdx
│       │   └── tenancy.mdx
│       ├── reference/                ← Persona C (developers)
│       │   ├── rest.mdx              ← uses <Endpoint> component
│       │   ├── ws.mdx
│       │   ├── envelope.mdx
│       │   ├── types.mdx
│       │   └── errors.mdx            ★ NEW (gap)
│       └── project/
│           ├── changelog.mdx
│           ├── roadmap.mdx
│           └── license.mdx
└── .github/workflows/deploy.yml      ← Pages deployment on push to main
```

★ = pages drafted from scratch to fill gaps identified in `KNOWLEDGE-BASE.md` §8.
Stubs have a "Coming soon" admonition + a one-line lede so the sidebar resolves cleanly.

---

## Authoring

The site uses standard Starlight MDX. Pages live under `src/content/docs/`; the route is the file path minus `.mdx`. Frontmatter:

```mdx
---
title: Page title
description: One-line summary that becomes the meta description + OG.
sidebar:
  order: 1
  badge:
    text: New      # optional pill
    variant: tip
---
```

### Components in use

| What you want | Reach for | Lives in |
|---|---|---|
| Note / tip / warning / danger | `<Aside type="…">` | Starlight built-in |
| Tabbed code blocks | `<Tabs>` + `<TabItem>` | Starlight built-in |
| Stepped list | `<Steps>` (wrap `<ol>`) | Starlight built-in |
| Feature grid | `<CardGrid>` + `<Card>` | Starlight built-in |
| Link card | `<LinkCard>` | Starlight built-in |
| File tree | `<FileTree>` | Starlight built-in |
| REST endpoint card | `<Endpoint method path tag desc>` | `src/components/Endpoint.astro` |
| 3-col "server sees" | `<Lens>` with `ok` / `mid` / `no` slots | `src/components/Lens.astro` |
| Landing persona card | `<PersonaCard eyebrow title description href>` | `src/components/PersonaCard.astro` |

Code blocks use Astro/Starlight's [Expressive Code](https://expressive-code.com) — syntax highlighting, title bars, copy buttons, frame styles all work out of the box. Just fence with the language and add `title="…"` if needed:

````md
```ts title="client/crypto/envelope.ts"
const K_item = randomBytes(32);
```
````

### Theme tokens

Defined in `src/styles/custom.css` as `--sb-*` and mapped onto Starlight's `--sl-color-*` / `--sl-font-*` variables. To change the accent color globally, edit `--sb-acc` and `--sb-acc-h` (the hue used in `oklch()` gradients). Both light and dark themes are styled.

### Updating the sidebar

Edit the `sidebar:` array in `astro.config.mjs`. Slugs must match file paths under `src/content/docs/`. Badges:

```js
{ label: 'Quick-unlock PIN', slug: 'get-started/quick-unlock', badge: { text: 'New', variant: 'tip' } }
```

---

## Deployment

GitHub Pages, deployed by `.github/workflows/deploy.yml` on every push to `main`.

One-time setup in the repo settings:

1. Settings → Pages → **Source: GitHub Actions**
2. Settings → Pages → **Custom domain: docs.syncbins.com** (CNAME is already in `public/`)
3. Settings → Pages → **Enforce HTTPS** (Let's Encrypt auto-provisioned)

DNS:

- `docs.syncbins.com` CNAME → `<org>.github.io`

---

## Updating from the App repo

These pages are downstream of `App/shared/src/*.ts`:

| Doc page | Source file |
|---|---|
| `reference/rest.mdx` | `App/shared/src/api.ts` |
| `reference/ws.mdx` | `App/shared/src/ws.ts` |
| `reference/envelope.mdx` | `App/shared/src/envelope.ts` |
| `reference/types.mdx` | `App/shared/src/types.ts` |
| `concepts/encryption.mdx` | `App/web/src/crypto/*.ts` |
| `integrations/mcp.mdx` | `MCPServer/README.md`, `MCPServer/src/tools/*.ts` |
| `self-hosting/quickstart.mdx` | `App/docker/docker-compose.yml`, `App/docker/Caddyfile` |
| `self-hosting/config.mdx` | `App/server/src/config.ts` |

When any of those change, the docs should be reviewed for drift. Worth a CI guard.

---

## Search

Pagefind (Starlight's default) runs at build time and indexes everything. No extra config needed — it'll appear in the top nav search box on the deployed site. For better relevance on a popular site, consider Algolia DocSearch later.

---

## Visual reference

The design that informed this Starlight build lives at `../SyncBins Docs.html` (the prototype) in this same repo. Open it for a pixel-accurate target when tweaking `custom.css`. The prototype is **not** shipped — it's design-time only.

---

## License

MIT.
