---
title: Self-Hosting
description: Run SyncBins on your own server with Docker and your choice of blob storage.
---

SyncBins ships as a single Docker image. You can run it on any Linux VPS, a home server, or a cloud VM. The server never sees plaintext — everything is encrypted on-device before it leaves — so a $4/mo machine is all you need.

## Prerequisites

- A server with Docker and Docker Compose
- A domain name with DNS pointing at the server
- Blob storage: Azure Blob Storage, AWS S3, Cloudflare R2, or a local path

## 1. Clone the compose file

```bash
mkdir syncbins && cd syncbins
curl -O https://raw.githubusercontent.com/SyncBins/App/main/docker/docker-compose.yml
curl -O https://raw.githubusercontent.com/SyncBins/App/main/docker/Caddyfile
```

Or copy them from the `docker/` directory in the App repo.

## 2. Configure environment variables

Create a `.env` file next to `docker-compose.yml`:

```dotenv
# Required
DOMAIN=syncbins.example.com
JWT_SECRET_FILE=/data/jwt.secret   # auto-generated on first boot if absent

# Azure Blob Storage (recommended)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_BLOB_CONTAINER=syncbins

# Or: AWS S3 / Cloudflare R2
# S3_ENDPOINT=https://...
# S3_BUCKET=syncbins
# S3_REGION=auto
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...

# Or: local disk (not recommended for production)
# LOCAL_BLOB_DIR=/data/blobs
```

## 3. The compose file

The default `docker-compose.yml` runs two containers: the SyncBins server and Caddy as a TLS-terminating reverse proxy.

```yaml
services:
  syncbins:
    image: ghcr.io/syncbins/app:latest
    restart: unless-stopped
    volumes:
      - ./data:/data
    env_file: .env
    expose: ["8080"]

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports: ["443:443", "80:80"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on: [syncbins]

volumes:
  caddy_data:
  caddy_config:
```

The `Caddyfile` provisions a Let's Encrypt certificate automatically:

```
syncbins.example.com {
  reverse_proxy syncbins:8080
}
```

## 4. Start it

```bash
docker compose up -d
docker compose logs -f
```

On first boot the server creates `data/jwt.secret` and runs the database migration. Open `https://syncbins.example.com` — you should see the onboarding flow.

## 5. Point the app at your server

During onboarding, choose **"Self-host on your own box"** and enter your domain. The app will connect to `https://syncbins.example.com/api`.

Existing devices can switch servers in **Settings → Server**.

## Storage options

### Azure Blob Storage (recommended)

Use the **Hot** access tier — Cool/Archive will cause noticeable latency for images and files. SyncBins generates short-lived user-delegated SAS URLs for uploads and downloads; the client talks directly to Azure, reducing bandwidth through your VPS.

Set a lifecycle policy to hard-delete orphaned blobs (items deleted more than 30 days ago):

```json
{
  "rules": [{
    "name": "orphan-cleanup",
    "type": "Lifecycle",
    "definition": {
      "filters": { "blobTypes": ["blockBlob"] },
      "actions": { "baseBlob": { "delete": { "daysAfterModificationGreaterThan": 30 } } }
    }
  }]
}
```

### Local disk

```dotenv
LOCAL_BLOB_DIR=/data/blobs
```

Suitable for testing or single-VPS installs where you manage your own backups. Mount the volume to persist across restarts.

## Upgrades

```bash
docker compose pull
docker compose up -d
```

The server runs database migrations automatically on boot. Check the changelog before upgrading major versions.

## Backups

The SQLite database lives at `data/syncbins.db`. Back it up with:

```bash
sqlite3 data/syncbins.db ".backup data/syncbins.db.bak"
```

For blob storage, rely on the provider's built-in redundancy and versioning. If you use local disk, include `data/blobs/` in your backup routine.

## Hardware requirements

SyncBins is intentionally lightweight. A 1-vCPU / 512 MB RAM VPS handles a single user comfortably. The $4/mo hosting cost dominates over Azure Blob at ~$0.02/GB-mo — 50 GB of content costs about $1/mo in storage.

**Raspberry Pi:** Pi 4 or 5 with **64-bit** Raspberry Pi OS and Docker. Published GHCR images include `linux/arm64`. See the dedicated guide: [Raspberry Pi](/self-hosting/raspberry-pi/).
