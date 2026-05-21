---
title: REST API
description: Complete reference for the SyncBins HTTP API — items, blobs, devices, and account endpoints.
---

All endpoints are under `/api`. Every request must include a bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued during device pairing and are scoped to a single device session.

## Errors

All non-2xx responses use the same error envelope:

```json
{
  "error": {
    "code": "not_found",
    "message": "Item not found"
  }
}
```

**Error codes:**

| Code | HTTP status | Meaning |
|------|-------------|---------|
| `unauthorized` | 401 | Missing or invalid bearer token |
| `forbidden` | 403 | Token valid but action not permitted |
| `not_found` | 404 | Resource does not exist |
| `validation` | 400 | Request body failed schema validation |
| `conflict` | 409 | Duplicate ID or concurrent write conflict |
| `rate_limited` | 429 | Too many requests |
| `internal` | 500 | Unexpected server error |
| `pair_expired` | 400 | 6-word pair code has expired |
| `pair_invalid` | 400 | Pair code or attestation is wrong |

---

## Items

### `POST /api/items`

Write a new item. The payload must be encrypted on-device before this call.

**Request body:**

```ts
{
  id: string;           // ULID, client-generated
  binId: string;        // ULID of the destination bin
  type: ItemType;       // see Content Types
  ts: number;           // ms since epoch, client clock
  payloadEnc?: {        // for payloads <= 64 KB after encryption
    ct: string;         // base64url ciphertext (XChaCha20-Poly1305)
    nonce: string;      // base64url 24-byte nonce
    keys: {             // item key wrapped per device
      [deviceId: string]: string; // base64url crypto_box_seal output
    };
  };
  blobRef?: string;     // blob name for large payloads (mutually exclusive with payloadEnc)
  blobNonce?: string;   // base64url nonce used to encrypt the blob
  blobKeys?: {          // same structure as payloadEnc.keys, for the blob key
    [deviceId: string]: string;
  };
}
```

Exactly one of `payloadEnc` or `blobRef` must be set. For blobs, first request an upload URL via `POST /api/blobs/upload-url`, upload the encrypted bytes directly to storage, then call this endpoint with the returned `blobRef`.

**Response `200`:**

```json
{
  "id": "01HXXX...",
  "version": 42
}
```

`version` is a server-assigned monotonic integer used by the sync protocol.

---

### `GET /api/items?since=N`

Fetch items with a version greater than `N`. Used to catch up after being offline or on initial load.

**Query parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `since` | `0` | Return only items with `version > since` |
| `limit` | `500` | Max items per response (max `1000`) |

**Response `200`:**

```json
{
  "items": [
    {
      "id": "01HXXX...",
      "binId": "01HYYY...",
      "type": "link",
      "senderDevice": "01HZZZ...",
      "ts": 1716000000000,
      "version": 43,
      "deletedAt": null,
      "payloadEnc": { "ct": "...", "nonce": "...", "keys": { "...": "..." } },
      "blobRef": null,
      "blobNonce": null,
      "blobKeys": null
    }
  ],
  "nextSince": 43,
  "hasMore": false
}
```

When `hasMore` is `true`, call again with `since=nextSince` to page through the backlog.

---

### `DELETE /api/items/:id`

Soft-delete an item. Items are retained for 30 days, then hard-deleted by a nightly job.

**Response `200`:**

```json
{
  "id": "01HXXX...",
  "version": 44
}
```

---

## Blobs

Large items (images, files, audio, video) are uploaded directly to blob storage. The server issues a short-lived signed URL; the client uploads the encrypted bytes to that URL without routing them through the server.

### `POST /api/blobs/upload-url`

Request a pre-signed upload URL.

**Request body:**

```json
{
  "contentLength": 2097152,
  "contentType": "application/octet-stream"
}
```

**Response `200`:**

```json
{
  "blobRef": "01HXXX....bin",
  "url": "https://blob.example.com/syncbins/01HXXX....bin?sas=...",
  "expiresAt": 1716000900000
}
```

`url` is a user-delegated SAS URL (Azure) or pre-signed URL (S3/R2). Upload the encrypted ciphertext with a `PUT` to this URL before `expiresAt`. Then call `POST /api/items` with the `blobRef`.

---

### `GET /api/blobs/:ref/url`

Get a short-lived download URL for a blob.

**Response `200`:**

```json
{
  "url": "https://blob.example.com/syncbins/01HXXX....bin?sas=...",
  "expiresAt": 1716000600000
}
```

Clients should refresh the URL before `expiresAt`. A reasonable strategy is to refresh when less than 60 seconds remain.

---

## Devices

### `POST /api/devices/pair`

Complete the device pairing handshake. See [Pairing Devices](/guides/pairing-devices/) for the full protocol.

**Request body:**

```json
{
  "code": "apple banana cherry delta echo foxtrot",
  "pubkey": "<base64url Curve25519 public key>",
  "name": "My Laptop",
  "glyph": "laptop",
  "attestation": "<base64url HMAC-SHA256>"
}
```

`glyph` is one of `laptop`, `phone`, `tablet`, `globe`.

`attestation` = `HMAC-SHA256(sharedSecret, pubkey || ephemeralPubkey)` encoded as base64url. Proves the new device knows the pair code without revealing it.

**Response `200`:**

```json
{
  "device": {
    "id": "01HXXX...",
    "name": "My Laptop",
    "glyph": "laptop",
    "pubkey": "...",
    "pairedAt": 1716000000000
  },
  "token": "<bearer token>",
  "wrappedMasterKey": "<base64url crypto_box_seal output>"
}
```

Store `token` as the bearer token for future requests. `wrappedMasterKey` is the master key sealed to this device's public key — unseal it with the device's private key to get the master key.

---

## Account

### `GET /api/me`

Returns information about the current device and server.

**Response `200`:**

```json
{
  "device": {
    "id": "01HXXX...",
    "name": "My Laptop",
    "glyph": "laptop",
    "pairedAt": 1716000000000
  },
  "server": {
    "version": "1.2.3",
    "region": "eastus",
    "storageUsedBytes": 52428800,
    "storageCapBytes": 53687091200,
    "itemCount": 1247,
    "deviceCount": 4,
    "devicesOnline": 2
  }
}
```

---

## IDs

All resource IDs are [ULIDs](https://github.com/ulid/spec) — 26-character, lexicographically sortable, globally unique identifiers. Clients generate item IDs locally before writing; the server validates format but does not generate IDs for items.
