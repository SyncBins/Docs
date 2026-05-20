---
layout: default
title: Encryption Protocol
parent: Security
nav_order: 1
---

# Encryption Protocol
{: .no_toc }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
- TOC
{:toc}
</details>

---

## Overview

SyncBins is an end-to-end encrypted (E2E) clipboard manager. All item content is encrypted on the sending device and can only be decrypted by devices that hold the correct keys. The server **never** possesses a decryption key and **never** sees plaintext payloads.

The cryptographic primitives come from [libsodium](https://doc.libsodium.org/) (`libsodium-wrappers-sumo` on both client and server). The client performs all encryption, decryption, key generation, and key wrapping. The server's cryptographic surface is limited to:

- **BLAKE2b** hashing (pair-code derivation, shared-secret derivation)
- **HMAC-SHA512-256** verification (`crypto_auth_verify` — pairing attestation)
- **Argon2id** string verification (`crypto_pwhash_str_verify` — optional password gate)
- **Constant-time comparison** (`sodium.memcmp` — token/verifier checks)

All binary values on the wire are encoded as **base64url without padding** (`sodium.base64_variants.URLSAFE_NO_PADDING`).

---

## Key hierarchy

```
BIP39 phrase (12 words, 128-bit entropy)
  │
  ├─ BIP39 seed (PBKDF2-HMAC-SHA512, 64 bytes)
  │    │
  │    └─ Argon2id(seed, salt="BLAKE2b('SyncBins/v1/master-salt')", t=3, m=64 MiB, p=1)
  │         │
  │         └─ Master Key (32 bytes)
  │              │
  │              ├─ Per-device Curve25519 keypair (crypto_box_keypair)
  │              │    ├─ Public key (pk, 32 bytes) — stored on server
  │              │    └─ Secret key (sk, 32 bytes) — encrypted at rest under Master Key
  │              │
  │              └─ Per-item random key K_item (32 bytes)
  │                   └─ Wrapped to each device pk via crypto_box_seal
```

| Key | Size | Lifetime | Storage |
|-----|------|----------|---------|
| BIP39 phrase | 12 words (128 bits + checksum) | Permanent | User's offline backup |
| Master key | 32 bytes | Permanent per account | Derived from phrase; never stored directly |
| Device keypair | Curve25519, 32 + 32 bytes | Per device | sk encrypted in IndexedDB (web) or `mcp.json` (MCP) |
| K_item | 32 bytes | Per item | Wrapped per device in the item envelope |

---

## Master key derivation

The master key is deterministically derived from the 12-word BIP39 recovery phrase:

1. **BIP39 seed**: `mnemonicToSeedSync(phrase)` → 64-byte seed (PBKDF2-HMAC-SHA512 with 2048 rounds, per BIP39 spec).
2. **Salt**: `BLAKE2b("SyncBins/v1/master-salt", output=16)` — a fixed, domain-tagged 16-byte salt. The salt is not per-user because at recovery time the phrase is the **only** input available. The version tag allows future KDF parameter changes without breaking existing wallets.
3. **KDF**: `crypto_pwhash(32, seed, salt, opslimit=3, memlimit=64 MiB, ALG_ARGON2ID13)` → 32-byte master key.

The same phrase always produces the same master key, allowing any device to independently derive it.

---

## Item encryption

Every item is encrypted with a fresh random key. The per-item key is then wrapped to each device that should be able to decrypt it.

### Encrypt

```
K_item  = randombytes_buf(32)
nonce   = randombytes_buf(24)                          // crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
aad     = UTF-8("${binId}|${type}|${ts}")
ct      = crypto_aead_xchacha20poly1305_ietf_encrypt(
            JSON.stringify(payload), aad, null, nonce, K_item)
```

For each non-revoked device with public key `pk_d`:

```
keys[deviceId] = base64url( crypto_box_seal(K_item, pk_d) )
```

The resulting `ItemEnvelope` sent to the server:

```json
{
  "ct":    "<base64url ciphertext>",
  "nonce": "<base64url 24-byte nonce>",
  "keys": {
    "<deviceId_A>": "<base64url sealed K_item for A>",
    "<deviceId_B>": "<base64url sealed K_item for B>"
  }
}
```

### Decrypt

```
sealed  = base64url_decode( envelope.keys[ourDeviceId] )
K_item  = crypto_box_seal_open(sealed, ourPublicKey, ourSecretKey)
ct      = base64url_decode( envelope.ct )
nonce   = base64url_decode( envelope.nonce )
aad     = UTF-8("${binId}|${type}|${ts}")
payload = crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct, aad, nonce, K_item)
result  = JSON.parse(payload)
```

If the AAD does not match (e.g., the server or an attacker swapped the item into a different bin), the Poly1305 authentication tag verification fails and decryption throws.

### AAD binding

The Additional Authenticated Data string `"${binId}|${type}|${ts}"` binds the ciphertext to the item's plaintext metadata columns. The server stores `binId`, `type`, and `ts` as queryable columns; the client re-derives the same AAD string on decryption. This prevents:

- **Bin-swap attacks**: moving an encrypted item from one bin to another.
- **Type-swap attacks**: re-labeling an item's type to cause the client to mishandle it.
- **Timestamp manipulation**: altering `ts` without detection.

### Algorithm details

| Parameter | Value |
|-----------|-------|
| AEAD cipher | XChaCha20-Poly1305 (IETF variant) |
| Key size | 256 bits (32 bytes) |
| Nonce size | 192 bits (24 bytes) |
| Auth tag | 128 bits (16 bytes, appended to ciphertext) |
| Key wrapping | `crypto_box_seal` (X25519 + XSalsa20-Poly1305 ephemeral) |

---

## Blob encryption

Large payloads (>64 KB) are encrypted identically to items but stored out-of-band in object storage. The envelope shape is `BlobEnvelope`:

```json
{
  "blobRef": "<storage reference>",
  "nonce":   "<base64url 24-byte nonce>",
  "keys": {
    "<deviceId_A>": "<base64url sealed K_item for A>"
  }
}
```

The ciphertext itself is uploaded to object storage separately; only the `blobRef` pointer is stored in the database. The same `K_item` / nonce / `crypto_box_seal` scheme applies — the key hierarchy and wrapping are identical to item encryption.

---

## Device pairing protocol

Pairing transfers the master key from an existing device to a new device over an authenticated channel, without ever exposing it to the server in plaintext.

### Actors

- **Existing device (E)**: already paired, holds the master key.
- **New device (N)**: wants to join, has no keys yet.
- **Server (S)**: relays messages, verifies the attestation HMAC, but never sees the master key.

### Protocol flow

```
E                              S                              N
│                              │                              │
│ 1. (epk, esk) = crypto_box_keypair()                       │
│                              │                              │
│ 2. POST /pair-init           │                              │
│    { ephemeralPubkey: epk }  │                              │
│    ─────────────────────────►│                              │
│                              │ stores (code → epk, TTL 5m)  │
│    ◄─────────────────────────│                              │
│    { code }                  │  code = 6 BIP39 words        │
│                              │  derived from BLAKE2b(epk)   │
│ 3. displays code / QR       │                              │
│                              │                              │
│                              │    4. user types/scans code  │
│                              │                              │
│                              │    5. GET /pair-fetch-epk    │
│                              │       ?code=…               │
│                              │    ◄─────────────────────────│
│                              │    ─────────────────────────►│
│                              │    { epk }                   │
│                              │                              │
│                              │    6. (npk, nsk) = crypto_box_keypair()
│                              │                              │
│                              │    7. sharedSecret =         │
│                              │       BLAKE2b(epk ‖ code, 32)│
│                              │                              │
│                              │    8. attestation =          │
│                              │       crypto_auth(           │
│                              │         npk ‖ epk,           │
│                              │         sharedSecret)        │
│                              │                              │
│ 9. POST /pair-wrap           │                              │
│    { code,                   │                              │
│      wrappedMasterKey:       │                              │
│        crypto_box_seal(      │                              │
│          masterKey, npk) }   │                              │
│    ─────────────────────────►│                              │
│                              │ buffers wrappedMasterKey     │
│                              │                              │
│                              │   10. POST /pair             │
│                              │       { code, pubkey: npk,   │
│                              │         name, glyph,         │
│                              │         attestation }        │
│                              │   ◄──────────────────────────│
│                              │                              │
│                              │ 11. verifies attestation:    │
│                              │   sharedSecret =             │
│                              │     BLAKE2b(epk ‖ code, 32)  │
│                              │   crypto_auth_verify(        │
│                              │     attestation,             │
│                              │     npk ‖ epk,               │
│                              │     sharedSecret)            │
│                              │                              │
│                              │ 12. inserts device row       │
│                              │     issues session token     │
│                              │   ──────────────────────────►│
│                              │   { device, token,           │
│                              │     wrappedMasterKey }       │
│                              │                              │
│                              │   13. masterKey =            │
│                              │       crypto_box_seal_open(  │
│                              │         wrappedMasterKey,    │
│                              │         npk, nsk)            │
```

### Step-by-step

1. **Existing device** generates an ephemeral Curve25519 keypair `(epk, esk)`.
2. **Existing device** sends `epk` to the server via `POST /devices/pair-init`.
3. **Server** derives a 6-word code from `BLAKE2b(epk, output=8 bytes)` by interpreting the digest as a bit stream and selecting BIP39 word indices (11 bits each, 6 words = 66 bits). The code is stored in an in-memory map keyed by code with a 5-minute TTL. The server returns the code to the existing device.
4. **Existing device** displays the code (or a QR encoding of it).
5. **New device** receives the code from the user and calls `GET /devices/pair-fetch-epk?code=…` to retrieve `epk`.
6. **New device** generates its own permanent Curve25519 keypair `(npk, nsk)`.
7. **New device** derives the shared secret: `sharedSecret = BLAKE2b(epk ‖ UTF-8(code), output=32)`. This value is known to both devices (the existing device can compute the same value from its `epk` and the code it displayed) and to the server (which has `epk` and `code`). It serves only as an HMAC key for attestation — it is **not** used to encrypt the master key.
8. **New device** computes an attestation tag: `crypto_auth(npk ‖ epk, sharedSecret)`. This is HMAC-SHA512-256 with the 32-byte shared secret as key. The message binds both public keys, preventing replay across parallel pairing sessions.
9. **Existing device** wraps the master key to the new device's public key: `crypto_box_seal(masterKey, npk)`. This is posted to `POST /devices/pair-wrap`. The server buffers it keyed by code.
10. **New device** sends `POST /devices/pair` with its `npk`, name, glyph, and the attestation tag.
11. **Server** re-derives `sharedSecret = BLAKE2b(epk ‖ code, 32)`, builds the attestation message `npk ‖ epk`, and calls `crypto_auth_verify(attestation, message, sharedSecret)`. If verification fails, the request is rejected.
12. **Server** inserts a device row (storing `npk` as the device's pubkey), issues a bearer session token, and returns the buffered `wrappedMasterKey` (waiting up to 60 seconds if the existing device hasn't posted it yet).
13. **New device** unseals the master key: `crypto_box_seal_open(wrappedMasterKey, npk, nsk)`.

### Pair code properties

- **6 BIP39 words**: human-readable, type-able, QR-encodable.
- **66 bits of entropy**: sufficient for a single-use code with a 5-minute TTL.
- **Deterministic**: derived from `BLAKE2b(epk)`, so the server doesn't need a separate RNG for code generation.
- **Single-use**: the server deletes the code after successful pairing via `consume(code)`.

### Timing

| Parameter | Default |
|-----------|---------|
| Pair code TTL | 5 minutes |
| Wrap delivery wait | 60 seconds |

If the existing device does not deliver the wrapped master key within 60 seconds of the new device's `POST /pair`, the handshake fails with `pair_expired`.

---

## Recovery phrase

SyncBins uses a **12-word BIP39 mnemonic** (128-bit entropy + checksum) as the account recovery mechanism.

### Generation

```
phrase = generateMnemonic(ENGLISH_WORDLIST, strength=128)   // 12 words
```

The phrase is generated once during initial account setup and displayed to the user for offline backup.

### Validation

Phrase validation checks word count (must be exactly 12), that every word is in the BIP39 English wordlist, and that the checksum is correct (`validateMnemonic`).

### Master key recovery

Given a valid 12-word phrase, the master key derivation is:

```
seed       = mnemonicToSeedSync(phrase)                        // 64 bytes, PBKDF2-HMAC-SHA512
salt       = BLAKE2b("SyncBins/v1/master-salt", output=16)    // crypto_pwhash_SALTBYTES
masterKey  = crypto_pwhash(
               keyLength = 32,
               password  = seed,
               salt      = salt,
               opslimit  = 3,
               memlimit  = 67108864,  // 64 MiB
               algorithm = crypto_pwhash_ALG_ARGON2ID13
             )
```

Because all parameters are fixed (not per-user), any device with the phrase can independently derive the identical master key without contacting the server.

---

## Device key storage

Each device holds a Curve25519 keypair. The **public key** is stored on the server (in the `devices.pubkey` column) so other devices can wrap per-item keys to it. The **secret key** never leaves the device.

### Web client (IndexedDB)

The secret key is encrypted at rest using the master key:

```
nonce = randombytes_buf(24)
ct    = crypto_aead_xchacha20poly1305_ietf_encrypt(sk, null, null, nonce, masterKey)
```

The stored record in IndexedDB (database `syncbins-keys`, object store `device-keys`, keyed by `deviceId`):

```json
{
  "deviceId": "<ULID>",
  "pkB64":    "<base64url Curve25519 public key>",
  "ctB64":    "<base64url XChaCha20-Poly1305 ciphertext of secret key>",
  "nonceB64": "<base64url 24-byte nonce>"
}
```

No AAD is used for the device key encryption (the `aad` parameter is `null`). The AEAD tag still provides tamper detection.

### Key loading

On app startup, the client reads the stored record and decrypts the secret key:

```
sk = crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct, null, nonce, masterKey)
```

If decryption fails (wrong master key or tampered store), the client surfaces an error and the user must re-enter their recovery phrase.

---

## Wire format

All cryptographic values are serialized as **base64url without padding** (RFC 4648 §5, no `=` padding characters). This is implemented via libsodium's `sodium.to_base64(bytes, base64_variants.URLSAFE_NO_PADDING)`.

| Value | Encoding | Typical size (bytes before encoding) |
|-------|----------|--------------------------------------|
| Ciphertext (ct) | base64url | Varies (plaintext + 16-byte tag) |
| Nonce | base64url | 24 bytes |
| Wrapped K_item | base64url | 48 bytes (`crypto_box_seal` output = 32 + 16 overhead) |
| Device public key | base64url | 32 bytes |
| Attestation tag | base64url | 32 bytes (`crypto_auth_BYTES`) |
| Ephemeral pubkey | base64url | 32 bytes |
| wrappedMasterKey | base64url | 48 bytes (`crypto_box_seal` output) |

---

## What the server can see

The server stores and can observe the following **plaintext metadata**:

| Field | Purpose |
|-------|---------|
| `binId` | Groups items into bins; used as a query/routing key |
| `type` | Item type label (e.g., `password`, `note`, `code`) |
| `ts` | Timestamp (milliseconds since epoch) |
| `version` | Monotonic version counter for conflict detection |
| Device IDs | ULID identifiers for each paired device |
| Device public keys | Curve25519 public keys (used for key wrapping, not confidential) |
| Device names & glyphs | User-chosen display names and emoji |
| `blobRef` | Object-storage reference for blobs |
| Ciphertext sizes | Observable from `ct` field length |
| Item count per bin | Observable from stored rows |

### What the server cannot see

| Data | Reason |
|------|--------|
| Item payload content | Encrypted with K_item under XChaCha20-Poly1305 |
| K_item values | Wrapped per-device with `crypto_box_seal`; server has no secret key |
| Master key | Derived client-side from the BIP39 phrase; during pairing it is wrapped with `crypto_box_seal` to the new device's pubkey before transit |
| Device secret keys | Encrypted at rest under the master key; never sent to the server |
| Bin names | Stored inside encrypted item payloads (future: dedicated encrypted bin-name field) |
| Recovery phrase | Generated and stored exclusively on the client |

### Server-side attestation verification

The server **does** participate in the pairing attestation (it verifies the HMAC tag), but the shared secret used for attestation (`BLAKE2b(epk ‖ code)`) is an authentication key — it is never used to encrypt the master key. The master key is wrapped with `crypto_box_seal` directly to the new device's Curve25519 public key, which the server cannot unseal because it does not possess the corresponding secret key.

---

## Threat model summary

| Threat | Mitigation |
|--------|------------|
| Server reads item content | E2E encryption — server only sees ciphertext |
| Server swaps items between bins | AAD binding (`binId\|type\|ts`) — Poly1305 tag fails on mismatch |
| MITM during pairing | Attestation HMAC binds both public keys to the shared secret derived from the 6-word code; code is transmitted out-of-band (displayed on screen, typed by user) |
| Compromised device secret key | Per-item random K_item limits blast radius; revoking the device's pubkey prevents future wrapping |
| Lost master key | BIP39 recovery phrase allows re-derivation on any device |
| Brute-force recovery phrase | 128-bit entropy (2¹²⁸ combinations); Argon2id KDF with 64 MiB memory cost |
| Tampered IndexedDB | AEAD tag on the encrypted device secret key detects modification |
| Replay of pairing attestation | Attestation message includes both `npk` and `epk`; code is single-use with 5-minute TTL |
