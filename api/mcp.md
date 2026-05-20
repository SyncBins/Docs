---
layout: default
title: "MCP Server"
parent: "API Reference"
nav_order: 3
---

# MCP Server

The `@syncbins/mcp` package is a [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI agents (Claude Desktop, Cursor, ChatGPT desktop, or anything that speaks MCP) read and write items in your end-to-end encrypted SyncBins.

The MCP server pairs to your account as **a device** — just like your phone or laptop. It generates a local Curve25519 keypair, completes the standard 6-word pairing handshake, and holds the unwrapped master key on disk. From that point on it encrypts items before they leave your machine and decrypts items it pulls from the server. The SyncBins server never sees plaintext.

---

## Overview

Agents need somewhere to put long-lived state — persona files, memories, reference documents, scratch notes — that survives across chats, syncs across your devices, and isn't owned by an LLM vendor. The MCP server exposes your encrypted store as four tools.

---

## Tools

| Tool | Description |
| --- | --- |
| `list_bins` | Discover the bins the user has and how many items are in each. |
| `read_bin` | Fetch decrypted items in a bin. Supports incremental polling via the `since` parameter. |
| `write_item` | Encrypt a payload to all paired devices and write it (e.g. `memories.md`). |
| `search` | Plaintext substring search across decrypted items. Runs locally — no data leaves your machine. |

---

## Installation and pairing

**Prerequisites:** Node 20+ and a SyncBins account (or self-hosted instance) with at least one device already paired.

```bash
npx -y @syncbins/mcp pair --host https://syncbins.com
```

The CLI will:

1. Prompt for a 6-word pair code (grab one from an existing device: **Settings → Devices → "Pair a new device"**).
2. Generate a Curve25519 keypair, complete the handshake, and unwrap the master key.
3. Save everything to `~/.syncbins/mcp.json` with mode `600`.

### Optional flags

| Flag | Default | Notes |
| --- | --- | --- |
| `--host <url>` | `$SYNCBINS_HOST` or prompt | e.g. `https://syncbins.com` or `yourname.syncbins.com` |
| `--name <name>` | `MCP (<hostname>)` | What this device shows up as in the UI |
| `--code <code>` | prompt | Skip the interactive prompt |
| `--force` | off | Overwrite an existing pairing without asking |

### Self-hosting

Point `--host` at your self-hosted instance:

```bash
npx -y @syncbins/mcp pair --host https://syncbins.example.com
```

Everything else works the same.

### Re-pairing and un-pairing

- **Re-pair:** run `npx -y @syncbins/mcp pair --force`. The old session remains valid on the server until you revoke it from another device.
- **Un-pair:** revoke from another device's **Settings → Devices**, then delete `~/.syncbins/mcp.json`.

---

## Agent configuration

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "syncbins": {
      "command": "npx",
      "args": ["-y", "@syncbins/mcp"]
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "syncbins": {
      "command": "npx",
      "args": ["-y", "@syncbins/mcp"]
    }
  }
}
```

After restarting the agent you should see four `syncbins.*` tools available.

---

## Usage patterns

### Agent persona and memory files

Use `write_item` with `type: "note"` to persist persona or memory files:

```json
{
  "binId": "01HXXX...",
  "type": "note",
  "payload": { "text": "# persona.md\n\nI prefer terse responses..." }
}
```

A single bin can hold many notes (`persona.md`, `memories.md`, per-project notes, etc.). Supply a unique `id` for idempotent overwrites; otherwise a new ULID is generated each call.

### Pulling context

`read_bin` returns plaintext payloads keyed by item ID. Agents can shape this into their context window however they like. Use the `since` parameter to keep polling cheap when an agent runs continuously.

### Search

`search` performs a plaintext substring match over decrypted items. It runs in-process inside the MCP — the server never sees the query.

---

## Security model

The MCP holds your **unwrapped master key** on disk in `~/.syncbins/mcp.json` (mode `600` on POSIX; user-only ACL on Windows). Anyone who can read that file can decrypt every item in your SyncBins.

Treat it like an SSH private key:

- Don't sync the file to a cloud drive (Dropbox, iCloud, OneDrive).
- Don't commit it to a repo (even a private one).
- Revoke the device from SyncBins (**Settings → Devices**) the moment your machine is lost, stolen, or shared.

Plaintext-on-disk was chosen over passphrase-on-launch because passphrase prompts block MCP startup — every agent restart would wait for input. If you need passphrase protection, set the `SYNCBINS_MCP_CONFIG` environment variable to a path on an encrypted volume.

---

## Troubleshooting

| Error | Cause | Fix |
| --- | --- | --- |
| `no pairing config found` | You haven't run `pair` yet. | Run the pairing command above. |
| `/api/devices failed: unauthorized` | The bearer token is gone (device was revoked). | Re-pair. |
| `envelope has no wrapped key for this device` | The item was written before this MCP was paired. SyncBins encrypts to the device list at write time; older items aren't re-wrapped. | Surface as a partial-decryption result. Cannot be fixed from the MCP side. |
| `pair-fetch-epk failed` | The 6-word code expired or was wrong (codes are valid for a few minutes). | Get a fresh code from an existing device. |

---

## Limitations (v1)

The following are not yet supported:

- **Live WebSocket subscriptions** — use `since`-based polling instead.
- **Blob-backed items** (large images, files, audio, video) — these require a separate upload-URL flow not yet ported.
- **Remote/hosted MCP transport** — would defeat the local-keypair security model.
- **Bin name decryption** — the server doesn't yet expose `/api/bins`.
- **Item deletion** — read and write only.
