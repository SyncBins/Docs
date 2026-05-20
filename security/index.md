---
layout: default
title: Security
nav_order: 5
has_children: true
---

# Security

SyncBins uses **end-to-end encryption** — the server only ever sees ciphertext. All encryption and decryption happens on the client using [libsodium](https://doc.libsodium.org/) (XChaCha20-Poly1305, Curve25519, BLAKE2b).

This section documents the cryptographic protocol, the device-pairing handshake, and the threat model so that security auditors can verify the implementation against a written spec.

- [Encryption Protocol](encryption.md) — full specification of the key hierarchy, item/blob encryption, device pairing, recovery phrase, and server visibility.
