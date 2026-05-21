# MCP Server

`@syncbins/mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI agents — Cursor, Claude Desktop, or anything else that speaks MCP — read and write items in your SyncBins. It pairs as a regular device, holds the master key locally, and handles all encryption itself. The SyncBins server never sees plaintext.

## Why this is useful

Agents need somewhere to keep long-lived state — persona files, memories, reference documents, scratch notes — that survives across chats, syncs across your devices, and isn't owned by an LLM vendor. SyncBins is a natural fit: single-user, end-to-end encrypted, with native apps on every platform.

## Prerequisites

- Node.js 20 or later
- A SyncBins account with at least one paired device
- A 6-word pair code from **Settings → Devices → "Pair a new device"**

## Install and pair

```bash
npx -y @syncbins/mcp pair --host https://syncbins.com
```

The CLI will:

1. Prompt for your 6-word pair code.
2. Generate a local Curve25519 keypair and complete the handshake.
3. Unwrap the master key and save everything to `~/.syncbins/mcp.json` (`chmod 600`).

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `--host <url>` | `$SYNCBINS_HOST` or prompt | Hosted or self-hosted base URL |
| `--name <name>` | `MCP (<hostname>)` | How this device appears in the UI |
| `--code <code>` | prompt | Skip the interactive code prompt |
| `--force` | off | Overwrite an existing pairing |

For a self-hosted instance:

```bash
npx -y @syncbins/mcp pair --host https://syncbins.example.com
```

## Wire into your agent

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

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

Restart the agent. Four `syncbins.*` tools will appear.

## Available tools

| Tool | Description |
|------|-------------|
| `list_bins` | Discover bins and their item counts |
| `read_bin` | Fetch decrypted items from a bin; supports incremental polling via `since` |
| `write_item` | Encrypt a payload and write it to a bin |
| `search` | Plaintext substring search across all decrypted items (runs locally) |

### `write_item` example

```json
{
  "binId": "01HXXX...",
  "type": "note",
  "payload": {
    "text": "# persona.md\n\nI prefer concise, direct responses..."
  }
}
```

Pass a stable `id` (ULID) if you want idempotent overwrites of the same logical item. Omit `id` to append a new item each call.

### `read_bin` with polling

```json
{
  "binId": "01HXXX...",
  "since": 42
}
```

`since` is a version number — the server returns only items with a version greater than `N`. Store the returned `nextSince` and pass it on subsequent calls to avoid fetching the full history each time.

### `search` example

```json
{
  "query": "postgres connection string"
}
```

Search runs entirely in-process. The SyncBins server never receives the query string.

## Common usage patterns

**Agent memory.** Create a dedicated bin (e.g. "Agent memory") and use `write_item` with `type: "note"` to persist persona files, project notes, and memories across sessions. Use `read_bin` at the start of each session to load context.

**Shared scratch pad.** Drop a note from your phone, read it in Cursor. The MCP syncs in real time alongside your other devices.

**Credential store.** Use `type: "password"` items in a "Passwords" bin. The agent can look up credentials on demand via `search`.

## Security model

`~/.syncbins/mcp.json` contains your **unwrapped master key**. Anyone who reads the file can decrypt every item in your SyncBins. Treat it like an SSH private key:

- Don't sync the file to a cloud drive (Dropbox, iCloud, OneDrive).
- Don't commit it to a repository, even a private one.
- Revoke the device from **Settings → Devices** the moment a machine is lost, stolen, or shared.

If you need passphrase protection, set `SYNCBINS_MCP_CONFIG` to a path on an encrypted volume and keep the key off the main drive.

The MCP deliberately stores the key in plaintext on disk (vs. prompting at launch) because passphrase prompts block MCP startup and are hostile to automated agent workflows.

## Re-pairing and un-pairing

**Re-pair:** `npx -y @syncbins/mcp pair --force`. The old session remains valid on the server until revoked from another device.

**Un-pair:** Revoke the device in **Settings → Devices** on another device, then delete `~/.syncbins/mcp.json`.

## Troubleshooting

**`no pairing config found`** — run `npx -y @syncbins/mcp pair` first.

**`/api/devices failed: unauthorized`** — this device was revoked. Re-pair with a fresh code.

**`envelope has no wrapped key for this device`** — the item was written before this MCP was paired. Items are encrypted to the device list at write time; older items cannot be re-wrapped from the MCP side. This is surfaced as a partial-decryption result.

**`pair-fetch-epk failed`** — the 6-word code expired (5-minute window) or was mis-typed. Get a fresh code from Settings → Devices.

## Current limitations

- No live WebSocket subscriptions — use `since`-based polling with `read_bin`.
- Blob-backed items (large images, files, audio, video) are not yet supported.
- Bin names are not yet decrypted (the server API for `/api/bins` is pending).
- Item deletion is not yet exposed as a tool.
