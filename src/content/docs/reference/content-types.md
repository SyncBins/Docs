---
title: Content Types
description: Reference for all ten SyncBins content types and their payload shapes.
---

SyncBins supports ten content types. The `type` field is stored in the clear on the server (so the sync protocol can route items without decrypting them), but the `payload` is always encrypted.

The composer auto-detects the type as you type — URLs become `link`, high-entropy strings become `password`, and so on. You can also select a type explicitly from the toolbar.

---

## `password`

A stored credential.

```ts
{
  service: string;  // e.g. "GitHub"
  user: string;     // username or email
  secret: string;   // the password or token
}
```

The `secret` field is hidden by default in the UI; an eye toggle reveals it. A copy button copies the secret to the clipboard without revealing it on screen.

---

## `link`

A URL with optional metadata.

```ts
{
  url: string;    // the full URL
  title: string;  // page title
  desc: string;   // meta description
  site: string;   // domain name, e.g. "github.com"
}
```

The UI renders a thumbnail tile with the title, description, and site name. `title`, `desc`, and `site` are populated automatically when the link is saved (the server fetches Open Graph metadata on the client's behalf — no URL content is stored, only the metadata).

---

## `text` / `note`

Plain text or a longer note. Both types share the same payload shape.

```ts
{
  text: string;  // the full text, newlines preserved
}
```

Rendered as `white-space: pre-wrap` to preserve formatting. Use `note` for longer, structured content and `text` for quick snippets — the distinction is cosmetic only.

---

## `code`

A code snippet with language tagging.

```ts
{
  lang: string;   // language identifier, e.g. "typescript", "bash", "sql"
  label: string;  // optional human-readable label
  text: string;   // the source code
}
```

Rendered with a monospaced font on a dark background, a language tag chip, and a copy button. Syntax highlighting is applied client-side based on `lang`.

---

## `image`

An image file.

```ts
{
  w: number;       // pixel width
  h: number;       // pixel height
  label: string;   // alt text / caption
  tone: number;    // dominant hue (0–360) for placeholder tinting
  blobRef?: string; // set when the image is stored in blob storage
}
```

Images larger than 64 KB are stored in blob storage. The client encrypts the image bytes locally, uploads the ciphertext via a pre-signed URL, and stores the `blobRef` alongside the metadata. The server never sees the raw image.

---

## `video`

A video file or link.

```ts
{
  url: string;       // source URL (for linked videos)
  title: string;     // video title
  desc: string;      // description
  duration: string;  // human-readable, e.g. "4:32"
  tone: number;      // dominant hue for placeholder
}
```

Rendered as a thumbnail with a play overlay and duration chip. Like images, large video files are blob-backed.

---

## `file`

An arbitrary file.

```ts
{
  name: string;     // original filename
  size: string;     // human-readable size, e.g. "2.4 MB"
  kind: string;     // MIME type or type label, e.g. "PDF", "ZIP"
  blobRef?: string; // set for files > 64 KB
}
```

Rendered as an icon tile with the filename, size, and a download button. The file bytes are encrypted before leaving the device.

---

## `audio`

A voice memo or audio clip.

```ts
{
  duration: number;   // length in seconds
  label: string;      // caption or transcript excerpt
  wave: number[];     // waveform amplitude samples (0–1), for visualisation
  blobRef?: string;   // set for audio stored in blob storage
}
```

Rendered with a play button, an animated waveform bar chart, and the label. The `wave` array contains ~80 amplitude samples used to draw the waveform without decrypting the audio file.

---

## `contact`

A saved contact card.

```ts
{
  name: string;   // full name
  role: string;   // job title or relationship
  email: string;
  phone: string;
}
```

Rendered as an initials avatar with the name, role, and contact lines.

---

## `location`

A geographic point of interest.

```ts
{
  name: string;  // place name
  addr: string;  // street address or description
  lat: number;   // latitude (WGS84)
  lng: number;   // longitude (WGS84)
}
```

Rendered as a static mini-map with a pin, the place name, and the address. The map is rendered client-side using the lat/lng — no external tile service is contacted at render time.

---

## Type summary

| Type | Server-visible `type` value | Blob-backed |
|------|-----------------------------|-------------|
| Password | `password` | No |
| Link | `link` | No |
| Text | `text` | No |
| Note | `note` | No |
| Code | `code` | No |
| Image | `image` | Yes (> 64 KB) |
| Video | `video` | Yes |
| File | `file` | Yes (> 64 KB) |
| Audio | `audio` | Yes |
| Contact | `contact` | No |
| Location | `location` | No |

The `type` value is always stored unencrypted on the server so the sync protocol can operate without decrypting payloads. All other fields are part of the encrypted payload.
