# Pairing Devices

SyncBins can sync to any number of your devices. Each device holds its own Curve25519 keypair and a copy of the master key, wrapped specifically for that device. Adding a new device proves it knows the pair code without the server ever seeing the master key.

## Generating a pair code

On any **already-paired** device:

1. Open **Settings → Devices**.
2. Click **"Pair a new device"**.
3. A 6-word code and QR code appear. They expire after **5 minutes**.

The 6 words are derived from the SHA-256 of an ephemeral public key — they are the out-of-band channel that makes the handshake secure. Anyone who reads the code in those 5 minutes could intercept the pairing, so don't display it on a shared screen.

## Pairing the new device

### Via QR code (fastest)

On the new device, open SyncBins (or the onboarding flow). When prompted, tap **"Scan QR code"** and point the camera at the existing device's screen.

### Via 6-word code

On the new device, choose **"Enter code manually"** and type the six words exactly as shown, separated by spaces or hyphens.

The new device will:

1. Fetch the ephemeral public key from the server using the code as a lookup.
2. Generate its own Curve25519 keypair.
3. Send its public key + an HMAC attestation proving it knows the shared secret.
4. Receive the master key, wrapped to its public key by the existing device.

The server forwards messages but never sees the master key.

## What gets synced to the new device

Once paired, the new device receives all future items in real time via WebSocket. **Historical items written before pairing are not re-wrapped** — the encryption envelope for each item contains a key wrapped only for the devices that existed when it was written. This is by design: you can't retroactively grant access to an item without decrypting and re-encrypting it on an existing device.

## Managing devices

In **Settings → Devices** you can see:

- All paired devices (name, glyph, paired date, last seen, online/offline status)
- How many items each device has pushed
- A **Revoke** button for each device

### Revoking a device

Revoking immediately invalidates the device's session token. It can no longer fetch new items or write to the server. However, the revoked device retains any items it already downloaded locally — revocation does not remotely wipe a device.

If a device is lost or stolen, revoke it immediately from any other paired device.

### This device

The currently active device is labelled **"this device"** and cannot be self-revoked. To remove it, revoke it from another device.

## Pairing the MCP server

The AI agent integration (`@syncbins/mcp`) pairs as a regular device using the same 6-word handshake. See [MCP Server](/guides/mcp-server/) for the full setup.

## Troubleshooting

**Code expired** — pair codes are valid for 5 minutes. Generate a new one on the existing device.

**"Attestation invalid"** — the code was entered incorrectly. Double-check the six words (order matters) and try again.

**New device shows items as unreadable** — items written before the device was paired cannot be decrypted by the new device. This is expected behaviour. New items will decrypt normally.

**Pairing hangs at "waiting for existing device"** — the existing device that generated the code must be online and connected when the handshake completes. Make sure it has an active session, then try again.
