---
layout: default
title: Home
nav_order: 1
---

# SyncBins

A personal, end-to-end encrypted clipboard and snippet manager that syncs across all your devices. One bin per topic. Single-user. Self-hostable.

---

## Quick links

- [Getting Started](guides/getting-started.md)
- [REST API Reference](api/rest.md)
- [WebSocket Protocol](api/websocket.md)
- [MCP Server](api/mcp.md)
- [Self-hosting with Docker](self-hosting/docker.md)
- [Encryption & Security](security/encryption.md)

---

## What is SyncBins?

SyncBins gives you a fast, private way to move text, credentials, code, and files between your devices without trusting a third party with your data.

### Bins

Bins are topic-organized containers. You might have bins for work credentials, project notes, code snippets, or quick links. Each bin holds a collection of related items.

### Items

Items are the individual pieces of content inside a bin. They are typed — passwords, links, notes, code blocks, files, and more — so clients can render and handle them appropriately.

### End-to-end encryption

All item content is encrypted client-side with XChaCha20-Poly1305 before it leaves your device. The server never sees plaintext. New devices are onboarded via a device-pairing flow that shares a master key over a verified channel.

### Real-time sync

Devices stay in sync via a persistent WebSocket connection. Changes propagate immediately to all connected clients; offline devices catch up on reconnect through the REST API.

---

## Private beta

SyncBins is currently in private beta. First invites go out August 2026.
