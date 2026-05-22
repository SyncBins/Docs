# SyncBins Documentation Site — Knowledge Base

> A complete brief for redesigning the SyncBins docs site (`docs.syncbins.com`).
> Hand this file to a designer or LLM and they should have everything they need:
> what the product is, who it's for, what content exists today, what's missing,
> and how the site is built. No need to read the codebase first.

---

## Table of contents

1. [What SyncBins is](#1-what-syncbins-is)
2. [Who reads these docs](#2-who-reads-these-docs)
3. [Brand, voice, visual language](#3-brand-voice-visual-language)
4. [Current site — what's live today](#4-current-site--whats-live-today)
5. [Information architecture (current + proposed)](#5-information-architecture)
6. [Page-by-page content inventory](#6-page-by-page-content-inventory)
7. [Reference material the site depends on](#7-reference-material-the-site-depends-on)
8. [Content gaps + suggested new pages](#8-content-gaps--suggested-new-pages)
9. [Technical stack + hosting](#9-technical-stack--hosting)
10. [Design system notes](#10-design-system-notes)
11. [Open questions for the redesign](#11-open-questions-for-the-redesign)

---

## 1. What SyncBins is

**One-sentence pitch:** A personal sharing portal — drop anything from one device, pick it up on another. End-to-end encrypted, self-hostable, real-time across all your devices.

**Longer pitch:** SyncBins is "Telegram Saved Messages with proper bins and self-hosting." A single-user place to drop passwords, links, screenshots, code snippets, voice memos, files, contacts, locations, anything you want to hand from one device to another. The server stores only ciphertext; the master key is derived from a 12-word recovery phrase that never leaves the device.

**Core promises:**
- **For one user.** No teams, no collaborators, no public sharing. Future-you is the only audience.
- **End-to-end encrypted.** Master key derived from a 12-word phrase via Argon2id. Items wrapped with XChaCha20-Poly1305 + Curve25519. Server stores ciphertext only.
- **Self-hostable.** Single Docker container, BYO storage (S3 / Azure Blob / R2 / local).
- **Multi-device sync.** Real-time WebSocket fanout to all paired devices.
- **Ten content types.** Each with a custom renderer.
- **AI-agent ready.** `@syncbins/mcp` exposes the same store to Cursor, Claude Desktop, and any other MCP client as a paired device.

**Hosted offering:** `syncbins.com` (commercial).
**Open-source server:** github.com/SyncBins/App, MIT.
**Docs site:** `docs.syncbins.com` (this redesign).

---

## 2. Who reads these docs

Three personas, in roughly decreasing order of traffic:

### Persona A — "Just want to use it"
- Found syncbins.com, signed up, wants to get going.
- Cares about: account setup, pairing devices, what kinds of things they can store, recovery phrase, what to do if they lose a device.
- Does NOT care about: crypto algorithms, the WebSocket protocol, server internals.
- Reading level: friendly, jargon-free, lots of pictures, "show me, don't explain."

### Persona B — "Self-hoster / homelabber"
- Has a VPS, Synology, or home server. Wants to run SyncBins themselves.
- Cares about: Docker compose, environment variables, storage backends, TLS setup, backups, upgrades, troubleshooting.
- Comfortable with: command line, env files, DNS, Docker, reverse proxies.
- Wants explicit working examples they can copy-paste, not "consult your distribution's documentation."

### Persona C — "Developer / agent builder"
- Building a client, an MCP integration, a browser extension, or auditing the security model.
- Cares about: REST endpoints with full request/response shapes, WebSocket protocol, encryption primitives, threat model, MCP tool list.
- Wants: terse, complete, machine-readable reference. Code blocks with types. No marketing copy.

A good redesign should make it instantly clear which "lane" you're in. Today the sidebar splits Guides vs Reference which already roughly maps to A+B vs C — but Persona A and Persona B should probably split too: getting-started is short, self-hosting is long and dense.

---

## 3. Brand, voice, visual language

### Voice
- **Direct.** Active verbs. Second person. Short sentences.
- **Honest about trade-offs.** Don't oversell. If a feature has a sharp edge, name it.
- **No emoji in body copy** (the wider Syncbins brand is restrained).
- **Code examples first** in reference pages; prose around them, not the other way around.

### Visual language (from the product UI — match it where reasonable)
- **Dark theme primary.** Warm-tinted dark with a near-black background.
- **Accent: cyan** by default (user-customizable in-app: cyan / amber / green / magenta).
- **Type:** Geist (sans) for UI, Geist Mono for code, timestamps, server names, keys, type labels.
- **Mono labels are uppercase with positive letter-spacing** (mirror this for code-type chips on the docs).
- **Soft, deep shadows** rather than hard borders.

### Existing OG image
`docs.syncbins.com/sbog.png` — already deployed and referenced from `astro.config.mjs`. Has the SyncBins wordmark + product line. Use as the source-of-truth for color and logo treatment.

### Logo
- Wordmark "SyncBins" in Geist, cyan accent on "Sync" (or all-cyan).
- Bin emoji / 3D bin illustration is used in the product UI for empty states and onboarding. Could be referenced for hero illustrations on the docs.

---

## 4. Current site — what's live today

**URL:** `docs.syncbins.com` (custom domain, CNAME + GitHub Pages).
**Status:** Live but minimal — Astro Starlight default template with content swapped for SyncBins content. No custom styling yet.

**What exists:**
- Landing page (`index.mdx`) — splash hero, 6-card feature grid.
- Sidebar with two sections: **Guides** (4 pages) and **Reference** (4 pages).
- Favicon, OG image (`sbog.png`), and PWA manifest are wired in via `head[]` injections in `astro.config.mjs`.
- Deployed automatically via GitHub Actions on push to `main`.

**What's missing:**
- Search (Starlight has built-in pagefind support; not enabled).
- Versioning (there's only one version of the docs).
- Code-block copy buttons, language tabs (Starlight defaults are basic).
- Custom theme — currently using Starlight's stock dark theme. Doesn't match the SyncBins warm-dark palette.
- Hero illustrations / diagrams on the landing page.
- Per-persona entry points ("I want to use it / host it / build on it").
- A real "what's new" / changelog page.
- Status / system health link (the hosted SyncBins.com presumably has an SLA story to tell eventually).

---

## 5. Information architecture

### Current sidebar (live today)

```
Guides
├── Getting Started
├── Self-Hosting
├── Pairing Devices
└── MCP Server

Reference
├── REST API
├── Encryption & Security
├── Content Types
└── WebSocket Protocol
```

### Proposed sidebar (recommended for redesign)

Split Guides into two persona-aligned sections, add a Concepts section, and reserve a future spot for Changelog.

```
Get Started                          (Persona A — new user, just signed up)
├── Welcome
├── First-time setup
├── Adding your first item
├── Pairing more devices
└── Recovery & backup

Self-Hosting                         (Persona B — running their own server)
├── Quick start (Docker compose)
├── Choosing storage (Azure Blob / S3 / R2 / local)
├── TLS & domains
├── Backups
├── Upgrades
├── Configuration reference
└── Troubleshooting

Integrations
├── MCP Server (Cursor, Claude Desktop, agents)
├── Browser extension     [future]
├── Mobile apps           [future]
└── Native desktop apps   [future]

Concepts                             (the "why" — links into Reference for "how")
├── How encryption works
├── How sync works
├── The device model (pairing, revocation, recovery)
└── Multi-tenant vs single-tenant

Reference                            (Persona C — terse, complete)
├── REST API
├── WebSocket Protocol
├── Encryption envelope
├── Content types
└── Error codes

Project
├── Changelog              [future]
├── Roadmap                [future]
├── License & contributing [future]
└── Status                 [future, external]
```

### Why split this way?

- **Get Started** vs **Self-Hosting** is the biggest UX win. Today, both target audiences land on the same "Guides" list. New users don't need to scroll past Docker compose to find "how do I add an item." Self-hosters don't want to read about composing items before reading about TLS.
- **Integrations** is a real category now (MCP) and will keep growing (extension, mobile, desktop). Even with empty stubs it signals direction.
- **Concepts** sits between guides and reference. Good for "how does the encryption actually work" without forcing the reader through a dense API page first.
- **Project** is housekeeping. Optional for the redesign — but worth reserving the spot.

---

## 6. Page-by-page content inventory

Below is every page that currently exists, with a one-line summary, source file, and notes for the redesign.

### Landing page

**File:** `src/content/docs/index.mdx`
**Layout:** Starlight `splash` template.
**Content:** Hero with tagline + "Get Started" / "Self-Host" buttons; 6-card grid (encrypted / self-hostable / real-time / 10 types / MCP / single-user); short closing paragraph about hosted vs self-hosted.
**Redesign notes:**
- Add a screenshot/illustration of the product (current page is text-only).
- Consider three-up "I want to..." cards directing to Get Started / Self-Host / Build (Persona A/B/C).
- The 6-card feature grid is fine but could be visually richer — small illustrations or animated SVGs per feature.

### Guides — Getting Started

**File:** `src/content/docs/guides/getting-started.md`
**Length:** ~70 lines.
**Content:** Account creation, onboarding wizard walkthrough (server choice → account → recovery phrase → confirm phrase → first bins → first device paired), understanding bins, adding the first item, pairing more devices, search, recovery phrase importance.
**Redesign notes:**
- This is currently a single long page; break into 4-5 short pages under "Get Started."
- Add screenshots of each onboarding screen. The current text describes them but a returning user would scan visuals faster.
- The "ten content types" detail belongs in Reference; the guide should just say "10 types, see reference" with one example.

### Guides — Self-Hosting

**File:** `src/content/docs/guides/self-hosting.md`
**Length:** ~140 lines.
**Content:** Prerequisites, Docker compose with Caddy, env vars, storage options (Azure Blob primary, S3/R2/local), upgrades, backups, hardware sizing.
**Redesign notes:**
- This is the densest existing page. Split into 5-7 sub-pages under "Self-Hosting" (quick start / storage / TLS / backups / upgrades / config reference / troubleshooting).
- Add a "what you'll have at the end" outcome at the top of the quick start.
- Storage section currently treats Azure Blob as the recommendation; in practice most homelabbers will want local disk or R2 (cheap). Re-evaluate the recommendation hierarchy.
- Missing: how to configure the master domain when using multi-tenant mode (`TENANT_MODE=multi` with subdomain routing). The server supports it but it's not documented.
- Missing: Stripe billing setup for anyone running a paid-tier self-host (the server has a full Stripe webhook integration).

### Guides — Pairing Devices

**File:** `src/content/docs/guides/pairing-devices.md`
**Length:** ~70 lines.
**Content:** How to generate a pair code, QR vs 6-word entry, what syncs to a new device, managing devices (revoke / "this device"), MCP pairing pointer, troubleshooting.
**Redesign notes:**
- Solid as-is. Move under "Get Started" → "Pairing more devices".
- Add a sequence diagram for the handshake (currently described in Reference > Encryption only).
- Add a screenshot of the Devices settings pane.

### Guides — MCP Server

**File:** `src/content/docs/guides/mcp-server.md`
**Length:** ~170 lines. Largest guide page.
**Content:** Install + pair CLI, Cursor + Claude Desktop config, all four MCP tools with examples, suggested usage patterns (agent memory, scratchpad, credential store), security model, re-pair / un-pair, troubleshooting, current limitations.
**Redesign notes:**
- Move under "Integrations" → "MCP Server" (it's not really a Guide, it's an integration reference).
- The "Suggested usage patterns" subsection is genuinely useful — keep it prominent. Could become a separate "Recipes" page if it grows.
- Missing: GIF/video showing an agent actually using the tools. High-value content for this audience.

### Reference — REST API

**File:** `src/content/docs/reference/api.md`
**Length:** ~250 lines.
**Content:** Every endpoint with full request/response shape: items (PUT/GET/DELETE), blobs (upload-url/download-url), devices (pair), me. Error envelope and error codes. ID format note.
**Redesign notes:**
- Currently complete and accurate. Source of truth is `App/shared/src/api.ts` (zod schemas).
- Three endpoints are documented but more exist in the actual server:
  - `POST /api/devices/pair-init`, `pair-fetch-epk`, `pair-fetch-npk`, `pair-wrap` (the multi-step pair handshake; current docs collapse this into a single `POST /pair`).
  - `POST /api/devices/bootstrap` + `bootstrap/restart` (first device on empty tenant).
  - `POST /api/password/set`, `verify`, `exists`.
  - `GET /api/syncbin/status` (public configured check).
  - `POST /api/signup`, `GET /api/tls-check` (multi-tenant onboarding).
  - `POST /api/billing/webhook`, `GET /api/billing/portal` (Stripe).
- Either extend the page or split into sub-pages by tag (Items / Blobs / Devices / Auth / Billing / Tenancy).

### Reference — Encryption & Security

**File:** `src/content/docs/reference/encryption.md`
**Length:** ~150 lines.
**Content:** Primitives table, master key derivation (Argon2id from BIP39 seed), per-device keypair, item encryption flow (K_item + AAD), blob encryption, pairing handshake step-by-step, what the server can see, recovery, key rotation, threat model.
**Redesign notes:**
- Excellent content. Add visual diagrams:
  - Item encryption flow (4-step boxes).
  - Pairing handshake (sequence diagram).
  - "What the server can see" table is already there — could be visualized as a layered diagram (plaintext / wrapped / ciphertext columns).
- Cross-reference the new quick-unlock PIN feature (added to the client side). PIN doesn't change the threat model but is worth a short callout under "Recovery."
- Add a section on the master-key fingerprint shown in Settings → Encryption (helps users verify which SyncBin they're signed into).

### Reference — Content Types

**File:** `src/content/docs/reference/content-types.md`
**Length:** ~150 lines.
**Content:** All 10 types (password, link, text, note, code, image, video, file, audio, contact, location) with TypeScript payload shapes and rendering notes. Summary table at the end.
**Redesign notes:**
- Source of truth: `App/shared/src/types.ts`.
- Could pair each type with a screenshot of the rendered item. Big visual lift for low effort.
- The composer auto-detects type from input — document the detection rules per type (currently mentioned but not specified).

### Reference — WebSocket Protocol

**File:** `src/content/docs/reference/websocket.md`
**Length:** ~140 lines.
**Content:** Connection setup, message format (client → server: hello, ping; server → client: item, delete, caught_up, pong, error). Session lifecycle, version numbers, fanout behaviour, reconnection guidance, MCP polling note.
**Redesign notes:**
- Source of truth: `App/shared/src/ws.ts` (zod schemas + `WS_PING_INTERVAL_MS`, `WS_PONG_GRACE_MS` constants).
- Heartbeat constants are wrong in the current page — should be 30s ping / 90s grace (two missed pongs), not 30s flat.
- Add a sequence diagram for the handshake flow.
- The `error` server message is documented but not actually defined in `WsServerMessageSchema` — verify in code before publishing.

---

## 7. Reference material the site depends on

These files in the App repo are the **source of truth**. If they change, the docs change.

| Doc page | Source file(s) |
|----------|----------------|
| `reference/api.md` | `App/shared/src/api.ts` |
| `reference/websocket.md` | `App/shared/src/ws.ts` |
| `reference/encryption.md` | `App/shared/src/envelope.ts`, `App/web/src/crypto/*.ts` |
| `reference/content-types.md` | `App/shared/src/types.ts` |
| `guides/mcp-server.md` | `MCPServer/README.md`, `MCPServer/src/tools/*.ts` |
| `guides/self-hosting.md` | `App/docker/docker-compose.yml`, `App/docker/Caddyfile`, `App/server/src/config.ts` |

Consider adding a CI step (or pre-commit hook) that warns when these source files change so the docs can be reviewed for drift.

---

## 8. Content gaps + suggested new pages

In rough priority order. Items marked **[stub today]** exist but are placeholders; **[missing]** doesn't exist at all.

### High priority

1. **Quick-unlock PIN** [missing] — A feature was just added: 6+ digit PIN that wraps the master key locally with Argon2id so the user doesn't have to retype the 12-word phrase every time the browser locks. Needs a section under "Get Started" or "Concepts."
2. **Recovery scenarios walkthrough** [missing] — "I lost my phone / I cleared my browser / I forgot my PIN / All my devices are gone / I'm starting fresh on a new server" — five real scenarios, what to do in each. This is the question users will Google.
3. **Storage backend deep-dive** [missing] — Self-hosting page mentions Azure / S3 / R2 / local but doesn't compare them. Cost per GB, latency, durability, ease of setup. Useful for a homelabber on day one.
4. **Multi-tenant mode** [missing] — The server supports a hosted multi-tenant mode with subdomain routing, Stripe billing, on-demand TLS via Caddy. None of this is documented. Audience is the small number of people who want to run their own SyncBins-as-a-service.
5. **Error code reference** [missing] — REST API page lists error codes in a table but doesn't say what causes each one or how to recover. A dedicated reference page indexed by error code would be searchable.

### Medium priority

6. **Browser extension** [stub today] — The `Extension` repo is empty. When it ships, a guide page is needed.
7. **Mobile apps** [stub today] — Same as above for `Mobile`.
8. **Native desktop apps** [stub today] — Same.
9. **Architecture overview** [missing] — One page with a system diagram (browser ↔ server ↔ storage ↔ other devices). Currently scattered across multiple reference pages.
10. **Performance & scaling** [missing] — How many items / devices / bytes can SyncBins handle? Real numbers from running instances would help homelabbers plan.

### Low priority

11. **Changelog** [missing] — Per-release notes.
12. **Migration guides** [missing] — From other tools (Notion, Apple Notes, raw text files). Speculative but useful for adoption.
13. **API client libraries** [missing] — If/when official JS/Python clients ship.
14. **Security audit results** [missing] — When the project gets a third-party audit.
15. **Glossary** [missing] — Bin, device, envelope, pair code, master key, recovery phrase. Could be a single page or inline tooltips.

---

## 9. Technical stack + hosting

### Stack

- **Framework:** Astro 5.x
- **Theme:** Starlight (Astro's official docs theme)
- **Language:** MDX (Markdown + JSX components)
- **Search:** Pagefind (built into Starlight, **not yet enabled**)
- **Diagrams:** None yet — Mermaid via `@astrojs/starlight-mermaid` is the obvious choice.

### Hosting

- **GitHub Pages** with custom domain `docs.syncbins.com`.
- **CI/CD:** GitHub Actions workflow at `Docs/.github/workflows/deploy.yml`.
  - Triggers on push to `main` and on manual dispatch.
  - Uses Node 22, runs `npm ci && npm run build`, uploads `dist/` as a Pages artifact, deploys.
- **DNS:** `docs.syncbins.com` CNAME → `syncbins.github.io`.
- **TLS:** GitHub Pages auto-provisions Let's Encrypt with "Enforce HTTPS" enabled.

### Where files live

```
Docs/
├── astro.config.mjs              ← site config, sidebar, OG tags
├── package.json
├── public/                       ← static assets copied verbatim to dist root
│   ├── CNAME
│   ├── favicon.svg / favicon.ico / favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── icon-192.png / icon-512.png
│   ├── sbog.png                  ← OG image
│   └── site.webmanifest
├── src/
│   └── content/
│       └── docs/
│           ├── index.mdx
│           ├── guides/
│           │   ├── getting-started.md
│           │   ├── self-hosting.md
│           │   ├── pairing-devices.md
│           │   └── mcp-server.md
│           └── reference/
│               ├── api.md
│               ├── encryption.md
│               ├── content-types.md
│               └── websocket.md
└── .github/workflows/deploy.yml  ← Pages deployment
```

### Local dev

```bash
cd Docs
npm install
npm run dev   # localhost:4321
npm run build # outputs to dist/
```

---

## 10. Design system notes

### Tokens that should travel from the product UI into the docs

Pulled from `App/web/src/styles/tokens.css` (the product's design tokens). These define the SyncBins "look" — match them where possible.

```css
/* Background */
--bg-0: #0c0b0e;   /* page */
--bg-1: #100f13;
--bg-2: #17161b;   /* primary card surface */
--bg-3: #1d1c22;   /* nested surface, chips */
--bg-4: #25232b;   /* hover state */

/* Lines & dividers */
--line-1: #25232d;
--line-2: #322f3b;

/* Ink (text) */
--ink-0: #f5f3f7;  /* headings */
--ink-1: #dcd9e1;  /* body */
--ink-2: #a09ca8;  /* secondary, uppercase mono labels */
--ink-3: #706c79;  /* hints */
--ink-4: #4a4753;  /* disabled */

/* Accent (cyan by default; user-switchable in product) */
--acc:     #7dd3fc;
--acc-ink: #0a3145;
--acc-h:   215;    /* hue used in oklch gradients */

/* Status */
--ok:   #5dd5a8;
--warn: #fbbf24;
--bad:  #f87171;

/* Radii */
--r-s:  6px;
--r-m:  10px;
--r-l:  14px;
--r-xl: 20px;

/* Shadow */
--shadow: 0 12px 32px -8px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.04) inset;
```

### Typography

- **Body:** Geist Sans, sizes 14–16px, line-height 1.6.
- **Headings:** Geist Sans, weight 600–700, letter-spacing -0.01 to -0.028em.
- **Uppercase labels:** Geist Mono, letter-spacing +0.05 to +0.12em (for "REST API", "WEBSOCKET", chip labels).
- **Code:** Geist Mono.
- Both Geist variants loaded from Google Fonts in the product; `@fontsource/geist-sans` + `@fontsource/geist-mono` work equally well for self-hosting.

### Starlight overrides

Starlight exposes CSS custom properties you can override in a single CSS file (`src/styles/custom.css`, then registered in `astro.config.mjs`). Mapping the SyncBins tokens onto Starlight's:

```css
:root {
  --sl-color-accent: #7dd3fc;
  --sl-color-bg: #0c0b0e;
  --sl-color-bg-nav: #100f13;
  --sl-color-bg-sidebar: #100f13;
  --sl-color-text: #dcd9e1;
  --sl-color-text-accent: #7dd3fc;
  /* ...etc */
  --sl-font: 'Geist', system-ui, sans-serif;
  --sl-font-mono: 'Geist Mono', ui-monospace, monospace;
}
```

Starlight ships with both light and dark themes. SyncBins is dark-only in the product, so the docs should either ship dark-only or have a thoughtful light theme that doesn't betray the brand.

---

## 11. Open questions for the redesign

Decisions that need a human to make before the design lands:

1. **Light theme?** Product is dark-only. Docs traffic is more diverse — some readers prefer light for long-form. Three options: dark-only, dark default with light option, system-preference default.
2. **Search infrastructure.** Pagefind (free, client-side, no external service) vs Algolia DocSearch (free for OSS, server-side, much better relevance). Pagefind is the "just enable it" answer; DocSearch is the "professional docs site" answer.
3. **Versioning.** SyncBins is pre-1.0. Do we want versioned docs from the start (so when 1.0 ships, old API docs are still findable) or wait until breaking changes happen?
4. **Code-block tabs.** Reference pages often want to show the same thing in JS / Python / curl. Worth investing in tabbed code blocks now, or stay single-language (JSON/TS) for v1?
5. **Interactive elements.** Should the encryption page have an animated diagram? Should the REST API page have a "try it" button? Probably no for both in v1 (high cost, low payoff vs writing missing pages) — but worth deciding.
6. **In-app docs link.** The SyncBins app could deep-link to relevant docs pages (e.g., "Learn more about pairing" → `docs.syncbins.com/get-started/pairing/`). Worth coordinating page URLs to be stable before launching links.
7. **Community / support channel.** Discord? GitHub Discussions? Both? Need a "Get help" link from the docs that goes somewhere active.

---

## Cheat sheet — give this to an LLM designer

> **You're redesigning the SyncBins documentation site.** SyncBins is a single-user, end-to-end encrypted, self-hostable personal sharing portal that syncs to all your devices in real time. The docs serve three audiences: new end-users, homelab self-hosters, and developers building integrations.
>
> **Tech stack:** Astro + Starlight, deployed to GitHub Pages at `docs.syncbins.com`. Source in the `Docs/` repo.
>
> **Brand:** Warm-dark theme, cyan accent (#7dd3fc), Geist + Geist Mono. Direct, honest voice. No emoji in body copy.
>
> **Current state:** Live with 8 content pages + landing. Default Starlight theme (no customization yet). Sidebar splits Guides vs Reference, but should split by persona (Get Started / Self-Hosting / Integrations / Concepts / Reference / Project).
>
> **Source of truth for the API/protocol reference pages is the App repo's `shared/src/*.ts` zod schemas** — don't invent fields.
>
> **The biggest content gaps** are: recovery scenarios walkthrough, quick-unlock PIN docs, multi-tenant mode setup, storage backend deep-dive, and error code reference.
>
> Read `Docs/KNOWLEDGE-BASE.md` (this file) before starting.
