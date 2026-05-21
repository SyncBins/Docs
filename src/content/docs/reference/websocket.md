---
title: WebSocket Protocol
description: Wire protocol for the SyncBins real-time sync WebSocket at /ws.
---

SyncBins uses a WebSocket connection at `/ws` to push new items to connected devices in real time. This page describes the wire protocol for clients and third-party integrations.

## Connection

Connect to `/ws` with a standard WebSocket handshake. Include the bearer token in the `Authorization` header or as a query parameter:

```
wss://syncbins.example.com/ws?token=<bearer>
```

The server authenticates the token before accepting the upgrade. An invalid or expired token results in a `401` HTTP response before the WebSocket is established.

## Message format

All messages are JSON objects with a `type` discriminant. The server and client both send and receive JSON text frames.

---

## Client → Server

### `hello`

The first message a client must send after connecting. Tells the server where the client's sync cursor is.

```json
{
  "type": "hello",
  "since": 42
}
```

`since` is the version number of the last item the client successfully processed. Use `0` for a fresh connection with no local state.

The server responds by replaying all items with `version > since` as a backlog of `item` and `delete` messages, then sends `caught_up`.

### `ping`

Optional heartbeat from the client. The server responds with `pong`.

```json
{ "type": "ping" }
```

---

## Server → Client

### `item`

A new or updated item is available. The payload is encrypted — decrypt it on-device using the wrapped key for this device (see [Encryption & Security](/reference/encryption/)).

```json
{
  "type": "item",
  "id": "01HXXX...",
  "binId": "01HYYY...",
  "itemType": "link",
  "senderDevice": "01HZZZ...",
  "ts": 1716000000000,
  "version": 43,
  "deletedAt": null,
  "payloadEnc": {
    "ct": "<base64url ciphertext>",
    "nonce": "<base64url 24-byte nonce>",
    "keys": {
      "01HAAA...": "<base64url wrapped key>",
      "01HBBB...": "<base64url wrapped key>"
    }
  },
  "blobRef": null,
  "blobNonce": null,
  "blobKeys": null
}
```

For blob-backed items, `payloadEnc` is `null` and `blobRef`, `blobNonce`, and `blobKeys` are set instead. Fetch the blob download URL from `GET /api/blobs/:ref/url` before decrypting.

### `delete`

An item was soft-deleted.

```json
{
  "type": "delete",
  "id": "01HXXX...",
  "version": 44
}
```

### `caught_up`

Sent after the server finishes replaying the backlog triggered by `hello`. After this message, all subsequent `item` and `delete` messages are real-time pushes from other devices.

```json
{ "type": "caught_up" }
```

### `pong`

Response to a client `ping`.

```json
{ "type": "pong" }
```

### `error`

The server encountered a problem processing a client message.

```json
{
  "type": "error",
  "code": "unauthorized",
  "message": "Session expired"
}
```

The connection is closed after a fatal error.

---

## Session lifecycle

1. Client connects and sends `hello` with its current `since` version.
2. Server replays backlog (`item` / `delete` messages) in version order.
3. Server sends `caught_up`.
4. Server pushes new `item` and `delete` messages as they arrive from other devices.
5. Client and server exchange `ping` / `pong` every **30 seconds**. A missed ping causes the server to close the connection.
6. On reconnect, the client sends `hello` again with its latest stored `since`. The server replays any items missed during the disconnection.

## Version numbers

`version` is a server-assigned monotonic integer. It is global across all items — not per-bin. The sync protocol is deliberately simple: "give me everything after version N". There is no CRDT or operational transform. Since SyncBins is single-user, last-write-wins by version is sufficient.

## Fanout

When a device writes an item via `POST /api/items`, the server:

1. Assigns a `version` and persists the item.
2. Appends a record to the `sync_log` table.
3. Fans out an `item` message to all other currently-connected devices.

The writing device does not receive its own item back over WebSocket — it already has the item locally.

## Reconnection

Clients should implement exponential backoff with jitter starting at ~1 second and capping at ~60 seconds. On reconnect, always send `hello` with the last successfully processed `version`. The server replay ensures no items are missed during disconnection.

## MCP and polling

The MCP server (`@syncbins/mcp`) does not maintain a persistent WebSocket connection. Instead, it uses `since`-based polling via `GET /api/items?since=N`. This is less efficient but avoids the complexity of keeping a long-lived connection alive from a serverless or occasionally-invoked process. See [MCP Server](/guides/mcp-server/) for details.
