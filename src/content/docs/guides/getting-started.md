# Getting Started

SyncBins is a personal sharing portal — a place to drop passwords, links, screenshots, code snippets, voice memos, and files from one device and pick them up on another. Everything is end-to-end encrypted: the server stores only ciphertext and can never read your content.

## Prerequisites

- A modern browser (Chrome, Firefox, Safari, Edge)
- A SyncBins account at [syncbins.com](https://syncbins.com), or a [self-hosted instance](/guides/self-hosting/)

## 1. Create an account

Open [syncbins.com](https://syncbins.com) and click **Get started**. The onboarding wizard walks you through:

1. **Choosing where it lives** — use the hosted service or point to your own server.
2. **Creating your account** — name and email only. No public profile, no tracking.
3. **Saving your recovery phrase** — 12 words generated on-device. **Write them down.** If you lose the phrase, your data is unrecoverable — the server has no way to decrypt it.
4. **Confirming the phrase** — you'll be asked for three specific words to make sure you've saved them.
5. **Creating your first bins** — pick from suggested bins (Work, Screenshots, Passwords, etc.) or make your own.
6. **Pairing this device** — your first device is paired automatically during signup.

## 2. Understand bins

A **bin** is a named, emoji-tagged collection. Each bin has:

- A **name** (encrypted — the server can't read it)
- An **emoji** and **hue** (stored in the clear for fast rendering)
- A **capacity** — a soft limit you set yourself

The "Everything" view in the sidebar shows all items across all bins, sorted by time.

## 3. Add your first item

Click in the composer at the bottom of the feed and start typing — or use the tool buttons on the left:

| Button | What it does |
|--------|-------------|
| Paste  | Paste text or an image from your clipboard |
| Upload | Upload a file from disk |
| Mic    | Record a voice memo |
| Password | Generate or save a password |

The composer auto-detects the content type as you type: URLs become `LINK` items, high-entropy strings become `PASSWORD` items, and so on.

Press **Enter** (or click the send arrow) to encrypt and save the item. A "syncing…" indicator shows while the item fans out to your other devices.

## 4. Pair more devices

Go to **Settings → Devices** on any paired device to get a 6-word pair code and QR code. On the new device, open SyncBins and enter the code during onboarding (or in Settings → Devices → "Pair this device").

See [Pairing Devices](/guides/pairing-devices/) for the full walkthrough.

## 5. Search

Press **⌘K** (or **Ctrl+K**) to open the search bar. Search runs entirely on-device across your decrypted items — the server never sees your query.

## Recovery phrase

Your recovery phrase is the **only** way to bootstrap a new device or recover your data. Store it somewhere safe — a password manager, printed paper in a safe, or a hardware key. Without it, nobody (including SyncBins) can recover your bins.
