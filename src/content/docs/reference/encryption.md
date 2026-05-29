---
title: Encryption & Security
description: The full cryptographic model behind SyncBins — primitives, key derivation, item encryption, and the pairing handshake.
---

SyncBins is end-to-end encrypted. The server stores only ciphertext and can never read your content — not even bin names. This page describes the full cryptographic model.

## Primitives

All cryptography uses [libsodium](https://doc.libsodium.org/) (NaCl). No custom crypto, no home-grown algorithms.

| Primitive | Algorithm | Purpose |
|-----------|-----------|---------|
| Symmetric encryption | XChaCha20-Poly1305 (`crypto_aead_xchacha20poly1305_ietf`) | Encrypting item payloads |
| Asymmetric key exchange | Curve25519 + XSalsa20-Poly1305 (`crypto_box_seal`) | Wrapping item keys per device |
| Key derivation | Argon2id (`crypto_pwhash`) | Master key from recovery phrase; PIN/passphrase wrapping |
| Pair attestation | `crypto_auth` (HMAC-SHA-512-256) | Proving the new device read the pair code |
| Item authentication | `crypto_auth` (HMAC-SHA-512-256), master-key-derived key | The per-item `sig` tag (forgery/relabel resistance) |

## Master key

The master key is a 32-byte secret derived from your **12-word recovery phrase**:

```
phrase → BIP39 seed → Argon2id(seed, fixed-salt, t=3, m=64MB, p=1) → 32-byte master key
```

The master key never leaves the device. It is used for:

1. **Device pairing** — wrapping each device's private key for recovery.
2. **Recovery** — bootstrapping a new device when no existing paired device is available.

It is **not** used directly to encrypt items (see per-item keys below).

## Per-device keypairs

Each device generates a Curve25519 keypair on first setup:

- The **public key** is registered with the server and visible to all other paired devices.
- The **private key** is encrypted to the master key and stored locally. It never leaves the device in plaintext.

## Item encryption

Every item is encrypted with its own random key:

1. **Generate** a random 32-byte item key `K_item` and a random 24-byte nonce.
2. **Encrypt** the plaintext payload with XChaCha20-Poly1305:
   ```
   ciphertext = AEAD_Encrypt(K_item, nonce, plaintext, AAD)
   ```
   AAD (additional authenticated data) = `type || ts`. `binId` is deliberately **not** in the AAD (so an item can move bins without re-encrypting its body) — instead it is covered by the authentication tag below.
3. **Wrap** `K_item` for each non-revoked device using `crypto_box_seal`, and also to the master key (`secretbox`) so any device holding MK can decrypt:
   ```
   wrappedKey[deviceId] = crypto_box_seal(K_item, device.pubkey)
   master             = secretbox(K_item, masterKey)
   ```
4. **Authenticate** the item with a MAC the server cannot compute:
   ```
   K_mac = BLAKE2b(masterKey, "syncbins-item-mac-v1", 32)
   sig   = crypto_auth(K_mac, canonical(id, binId, type, ts, ciphertext, nonce
                                        [, blobRef, blobNonce, blobKeys]))
   ```
5. **Send** `{ ciphertext, nonce, wrappedKeys, master, sig }` to the server as `payloadEnc`.

The server stores everything opaquely; it has no private keys and no master key, so it can neither unwrap `K_item` nor forge a valid `sig`.

### Decryption

On the receiving device:

1. **Verify `sig`** with `K_mac` over the same canonical fields. Reject the item on mismatch — this is how a forged or relabelled item (a malicious server moving it between bins, or changing its id/type/timestamp, or swapping its attachment) is caught.
2. Recover `K_item` via the `master` wrap (`secretbox_open` with MK) or this device's entry in `wrappedKeys` (`crypto_box_seal_open`).
3. Decrypt: `plaintext = AEAD_Decrypt(K_item, nonce, ciphertext, AAD)`.

Because `sig` binds `binId`, moving an item between bins recomputes it on the moving device (which holds the master key); a server cannot move items itself.

### Large items (blobs)

For payloads larger than 64 KB (images, files, audio, video):

1. Encrypt the bytes locally with the same XChaCha20-Poly1305 scheme.
2. Request a short-lived upload URL from `POST /api/blobs/upload-url`.
3. Upload the **encrypted** ciphertext directly to blob storage (Azure Blob / S3 / R2).
4. Write the item to the server with `blobRef`, `blobNonce`, and `blobKeys` instead of `payloadEnc`.

The server and storage provider see only ciphertext blobs. Blob names are opaque ULIDs — `{itemId}.bin` — with no PII in the path.

## Device pairing handshake

The 6-word pair code is a secure out-of-band channel:

1. **Existing device** generates an ephemeral X25519 keypair `(epk, esk)` and derives 6 words from `BIP39(SHA256(epk)[0:4])`. Registers `epk` with the server under the code.
2. **New device** resolves the code to `epk`. Generates its own keypair `(npk, nsk)`. Computes:
   ```
   sharedSecret = X25519(nsk, epk)
   attestation = HMAC-SHA256(sharedSecret, npk || epk)
   ```
   Sends `{ code, npk, name, glyph, attestation }` to the server.
3. **Both devices** display a 6-digit **verification code** = `BLAKE2b(epk || npk) mod 1e6`. The user confirms they match and **approves on the existing device**. Because the code is bound to the *actual* joining public key, an attacker who only photographed the QR (and so knows the pair code) produces a different code and is rejected.
4. **Existing device** (after approval) verifies the attestation and wraps the master key to `npk`:
   ```
   wrappedMasterKey = crypto_box_seal(masterKey, npk)
   ```
   Sends the wrapped key back through the server to the new device.
5. **New device** unseals: `masterKey = crypto_box_seal_open(wrappedMasterKey, npk, nsk)`.

The server never sees `esk`, `nsk`, or the master key. The 6 words are valid for 5 minutes.

## What the server can see

| Data | Visible to server? |
|------|--------------------|
| Item ciphertext | Yes (but unreadable) |
| Item type (`link`, `password`, etc.) | **Yes** — stored in the clear |
| Timestamp | **Yes** — stored in the clear |
| Bin emoji, hue, capacity | **Yes** — stored in the clear for fast rendering |
| Bin name | No — encrypted |
| Item payload | No — encrypted |
| Device public keys | **Yes** — necessary for key wrapping |
| Master key | No — never sent to the server |
| Recovery phrase | No — never leaves the device |

Leaking `type` and `timestamp` is an intentional trade-off: hiding them would make the sync protocol significantly more complex, and for a single-user app the risk model is acceptable.

## Recovery

If all your devices are lost but you have your recovery phrase:

1. Install SyncBins on a new device.
2. Choose **"I have a recovery phrase"** during onboarding.
3. Enter the 12 words. The master key is re-derived on-device.
4. Your device private key is regenerated. A new pairing is completed against the server (using the server password as the second factor, if configured).

Because every item's `K_item` is wrapped to each device's public key individually, recovering the master key alone does not decrypt historical items. However, from the recovered device you can:

- Write new items (fully encrypted to your new keypair)
- Re-download and re-wrap historical items on any future paired device

## Key rotation

There is currently no automated key rotation. Manual re-encryption of all items with a new keypair is planned as a future feature.

## Threat model

SyncBins protects against:

- **Compromised server** — the server database contains only ciphertext. It also cannot **forge or relabel** items: every item carries a master-key-derived `sig` it can't compute, verified on receipt.
- **Compromised storage** — blobs are ciphertext blobs with opaque names; the item `sig` binds the blob reference and keys, so a swapped blob is rejected.
- **Network interception** — all traffic is TLS; payloads are additionally E2E encrypted.
- **Revoked device** — revocation invalidates the session token; the revoked device cannot pull new items.

SyncBins does **not** protect against:

- **Compromised device** — if an attacker has shell access to your device, they can read the decrypted items in memory or on disk.
- **Lost recovery phrase** — there is no server-side recovery path.
- **Metadata analysis** — item type, timestamps, and bin metadata (emoji/hue/capacity) are stored in the clear.
