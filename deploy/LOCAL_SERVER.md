# 🏠 Local Server Reference (`local-server`)

This document serves as the **Single Source of Truth** for the local on-premise server (Raspberry Pi) and its integration with the Cloud server (`160.250.204.219`).

---

## 🖥️ Server Specifications

| Property | Value |
| :--- | :--- |
| **Hostname** | `zenkar` |
| **Architecture** | `aarch64` (ARM64) - Raspberry Pi 5 / Ubuntu 24.04 LTS |
| **Local LAN IP** | `192.168.68.115` |
| **SSH User** | `zenkar` (`ssh zenkar@192.168.68.115`) |
| **Authentication** | Passwordless SSH key authentication |
| **Sudo Access** | Passwordless sudo configured in `/etc/sudoers.d/zenkar` |
| **Systemd Lingering** | Enabled (`loginctl enable-linger zenkar`) for background user services |

---

## 🚇 Reverse SSH Tunnel Architecture

Since the local server is behind a private NAT/LAN (`192.168.68.115`), it cannot accept direct inbound connections from the internet. Instead, it maintains a persistent, self-healing **Reverse SSH Tunnel** to the cloud server.

### 1. Connection Map

```
┌──────────────────────────────────────┐                ┌──────────────────────────────────────┐
│       Local Server (Raspberry Pi)    │                │       Cloud Server (Public)          │
│       192.168.68.115                 │                │       160.250.204.219                │
│                                      │  Reverse SSH   │                                      │
│  SSH Server (:22)                    │ ─────────────> │  127.0.0.1:2222 (Tunnel to Local 22) │
│  Local Uptime Kuma (:3001)           │ ─────────────> │  127.0.0.1:3006 (Tunnel to Kuma 3001)│
└──────────────────────────────────────┘                └──────────────────────────────────────┘
```

### 2. Service Definition
* **Unit File**: `~/.config/systemd/user/reverse-tunnel.service` on the local server.
* **ExecStart Command**:
  ```bash
  /usr/bin/ssh -NT \
      -o ServerAliveInterval=30 \
      -o ServerAliveCountMax=3 \
      -o ExitOnForwardFailure=yes \
      -o StrictHostKeyChecking=accept-new \
      -o TCPKeepAlive=yes \
      -R 2222:localhost:22 \
      -R 3006:localhost:3001 \
      -i /home/zenkar/.ssh/id_ed25519 \
      vishwa@160.250.204.219
  ```
* **Auto-restart**: Enabled (`Restart=always`, `RestartSec=10`).
* **Lingering**: Systemd user manager starts this service automatically on boot without interactive login.

### 3. How to SSH from Cloud to Local Server
From `vishwa@160.250.204.219`, run:
```bash
ssh local-server
# or
ssh zenkar-local
```
*(Configured in `~/.ssh/config` on the cloud server using `IdentityFile ~/.ssh/id_ed25519` and port `2222`).*

---

## 📊 Uptime Kuma Cross-Monitoring Setup

Both servers run **Uptime Kuma v2** in Docker to watch each other.

| Component | Cloud Instance | Local Instance (Pi) |
| :--- | :--- | :--- |
| **URL** | [http://160.250.204.219:3005](http://160.250.204.219:3005) *(or http://status.zenkar.in)* | [http://192.168.68.115:3001](http://192.168.68.115:3001) |
| **Docker Tag** | `louislam/uptime-kuma:2` | `louislam/uptime-kuma:2` |
| **Container Port** | `--network host` (`UPTIME_KUMA_PORT=3005`) | `3001:3001` (forwarded to Cloud `3006`) |
| **Database Storage** | `/var/lib/docker/volumes/uptime-kuma/_data/kuma.db` | `/var/lib/docker/volumes/uptime-kuma/_data/kuma.db` |

### Cross-Monitoring Matrix

* **Cloud Server watches Local Server**:
  * `http://127.0.0.1:3006` *(Local Uptime Kuma HTTP)*
  * `127.0.0.1:2222` *(Local SSH Reverse Tunnel TCP)*
* **Local Server watches Cloud Server**:
  * `http://160.250.204.219:3005` *(Cloud Uptime Kuma HTTP)*
  * `160.250.204.219:22` *(Cloud SSH TCP)*
  * `https://order.zenkar.in` *(Production Frontend)*

---

## 💾 Production Database Backups Stored on Local Server

The local server stores offline/cold backups of the cloud production database (`order_book`).

* **Local Storage Directory**: `/home/zenkar/backups/production/`
* **Format**: SQL text (`.sql`) and compressed gzip (`.sql.gz`)

### Pulling a Fresh Production Dump from Cloud to Local Server
Run this from the local server or your local machine:
```bash
# Stream dump directly over SSH into a gzipped file:
ssh vishwa@160.250.204.219 "sudo docker exec zenkar-db-prod pg_dump -U postgres order_book" | gzip > ~/backups/production/backup_production_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restoring a Backup Locally
If testing locally in a Postgres Docker container:
```bash
# Decompress and restore:
gunzip -c ~/backups/production/backup_production_<TIMESTAMP>.sql.gz | docker exec -i <local-postgres-container> psql -U postgres -d order_book
```

---

## 🛠️ Maintenance & Useful Commands

### 1. Reverse SSH Tunnel Management (on Local Server)
```bash
# Check status
systemctl --user status reverse-tunnel.service

# Restart tunnel
systemctl --user restart reverse-tunnel.service

# View live tunnel logs
journalctl --user -u reverse-tunnel.service -f
```

### 2. Local Uptime Kuma Management (on Local Server)
```bash
# Check container status
sudo docker ps | grep uptime-kuma

# View logs
sudo docker logs -f uptime-kuma

# Restart container
sudo docker restart uptime-kuma
```

### 3. Cloud sshd KeepAlive Check (on Cloud Server)
KeepAlive configuration is placed in `/etc/ssh/sshd_config.d/60-tunnel.conf`:
```
ClientAliveInterval 30
ClientAliveCountMax 3
```
If sshd is modified, reload with:
```bash
sudo systemctl reload ssh
```

---

## 📋 Raspberry Pi 5 Homeserver To-Do List & Services Roadmap

This roadmap tracks candidate self-hosted services and features for the local server.

### Current Status
- [x] **Reverse SSH Tunnel**: Persistent, self-healing tunnel to cloud server (`160.250.204.219`)
- [x] **Cross-Server Monitoring**: Uptime Kuma v2 bidirectional health checks
- [x] **Production DB Cold Backups**: Automated/manual Postgres dumps from cloud to local storage

---

### 🛡️ Network, Security & Remote Access
- [ ] **AdGuard Home / Pi-hole**: Network-wide ad, tracker, and malicious domain blocking via local DNS sinkhole.
- [ ] **Tailscale / WireGuard**: Secure mesh VPN for remote phone/laptop access into home network without opening router ports.
- [ ] **Cloudflare Tunnels**: Expose designated local dashboards securely over HTTPS with Zero Trust authentication.
- [ ] **Nginx Proxy Manager / Caddy**: Local reverse proxy providing clean local domain names (e.g., `http://kuma.home`, `http://photos.home`) with automated Let's Encrypt certificates.

### ☁️ Cloud Storage & Photos (Mobile-First Backup)
- [ ] **Immich**: High-performance Google Photos alternative with iOS/Android auto-backup, facial recognition, and machine learning search.
- [ ] **Nextcloud**: Full personal cloud suite for documents, calendar, contacts, and mobile auto-sync.
- [ ] **Syncthing**: Continuous, peer-to-peer folder synchronization across phones, laptops, and Pi.
- [ ] **Samba / OpenMediaVault**: Network Attached Storage (NAS) over local LAN for attached storage.

### 🔑 Credentials & Privacy
- [ ] **Vaultwarden**: Lightweight Rust implementation of Bitwarden backend for secure self-hosted passwords, 2FA, and passkeys across mobile and browser extensions.

### 🏡 Smart Home & Automation
- [ ] **Home Assistant**: Unified smart home automation platform integrating Zigbee, Matter, HomeKit, and Google Home devices with mobile companion apps.
- [ ] **n8n**: Self-hosted workflow automation platform (open-source Zapier alternative) to connect webhooks, scheduled tasks, and alert pipelines.

### 🍿 Media & Entertainment Streaming
- [ ] **Jellyfin / Plex**: Media server for movies and TV shows (utilizing Pi 5 1080p/4K Direct Play).
- [ ] **Audiobookshelf**: Self-hosted audiobook and podcast server with progress tracking and mobile apps.
- [ ] **Navidrome**: Lightweight personal music streaming server compatible with Subsonic mobile players.
- [ ] **Arr Suite (*Arr) + Download Client**: Automated media management (Sonarr, Radarr, Prowlarr) paired with qBittorrent/Transmission.

### 💻 Productivity & Homelab Tools
- [ ] **CasaOS / Portainer / Umbrel**: Web-based container dashboard for 1-click app installs and container lifecycle management.
- [ ] **Paperless-ngx**: Automated document archiving, OCR indexing, and searchable database for receipts, invoices, and warranties.
- [ ] **Forgejo / Gitea**: Lightweight self-hosted Git service for private repositories and webhooks.
- [ ] **Local AI / Ollama**: Run small quantized language models (e.g., Qwen 2.5 1.5B/3B, Llama 3.2 1B/3B) locally on the Pi 5 ARM64 CPU.

### ⚡ Power & Hardware Reliability
- [ ] **Mains Grid Outage Detection (UPS Running)**: Mechanism to detect grid power cut while the Pi stays powered by UPS.
  - Detect outage via USB (NUT / `apcupsd`), LAN ping to a non-UPS device/socket, or 5V GPIO optocoupler.
  - Send instant alerts (Telegram / Pushover / Uptime Kuma push).
  - Execute graceful auto-shutdown before battery exhausts.

### 🏭 Company Staff & Multi-User Interfaces (Mobile-First)
- [ ] **Workshop & Production Floor Interface**:
  - Simplified, touch-optimized mobile interface for factory staff.
  - Wood cutting & door frame job status tracking (Pending → In Progress → Ready).
  - Daily labour work logs & piece-rate carving entry.
- [ ] **Role-Based Access Control (RBAC)**: Dedicated tailored views for Admin, Workshop Supervisors, Sales, and Accounts.


