# Enclave — Real-Time Secure Messaging Platform

> A full-stack, production-ready messaging application with end-to-end encryption, voice rooms, threads, tasks, slash commands, and real-time collaboration — built for modern teams.

<div align="center">

![Tech Stack](https://img.shields.io/badge/Stack-Node%20%7C%20React%20%7C%20Expo-6366f1?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![E2EE](https://img.shields.io/badge/Encryption-AES--GCM%20256-emerald?style=flat-square)

</div>

---

## ✨ Feature Overview

| Feature | Description |
|---|---|
| 💬 **Real-Time Messaging** | Socket.IO-powered instant messaging with read receipts |
| 🔐 **End-to-End Encryption** | ECDH key exchange + AES-GCM 256-bit per chat |
| 🧵 **Threaded Replies** | Slack-style threads on any message |
| 🎙️ **Voice Rooms** | Discord-style drop-in audio (WebRTC mesh, no ring) |
| 📹 **Video & Audio Calls** | 1:1 WebRTC calls with incoming call UI |
| 📌 **Pinned Messages** | Pin any message; click banner to jump to it with glow |
| 📋 **Chat Tasks** | Per-chat task list with assignee, due date, status |
| 📊 **Polls** | Create polls with `/poll` or the toolbar; live vote results |
| ⚡ **Slash Commands** | `/poll`, `/remind`, `/split`, `/task`, `/code`, `/shrug`, `/tableflip` |
| 👁️ **Typing Indicators** | Real-time typing dots in chat and inside threads |
| 😄 **Reactions** | Quick emoji reactions per message |
| 📎 **File & Media Sharing** | Images, documents, audio — with preview |
| 🎤 **Voice Messages** | Record and send audio with auto-transcription |
| 🔗 **Link Previews** | Auto-detect URLs and show domain card |
| ✏️ **Edit & Delete** | Edit messages in-place; delete for everyone |
| ⏳ **Undo Send** | 5-second undo window after sending |
| 🎨 **Themes** | 6 neon accent themes (Cyber Indigo, Neon Green, etc.) |
| 🌐 **Groups** | Group chats with member count and group badge |
| 💾 **Saved Messages** | "Saved Messages" self-chat for notes |
| ⌨️ **Command Palette** | `Ctrl+K` global search and navigation |
| 📱 **Mobile Responsive** | Full mobile layout with back navigation |

---

## 🏗️ Architecture

```
enclave/
├── backend/        # Node.js + Express 5 + Socket.IO + MongoDB
├── web/            # React 19 + Vite 6 + Tailwind v4 + Zustand
└── mobile/         # Expo SDK 54 + React Native + NativeWind
```

```
┌─────────────┐     WebSocket (Socket.IO)     ┌──────────────────┐
│  Web / Mobile│ ◄─────────────────────────── │  Backend (Node)   │
│  React / RN  │ ──── REST API (Express) ────► │  Socket.IO Server │
└─────────────┘                               └────────┬─────────┘
                                                       │
                                               ┌───────▼──────┐
                                               │   MongoDB     │
                                               │  (Mongoose)   │
                                               └──────────────┘
```

**Auth:** Clerk (JWT) → verified on every socket handshake and REST request  
**E2EE:** Browser-native `window.crypto` (ECDH P-256 + AES-GCM 256) — keys never leave client  
**WebRTC:** Peer-to-peer via Socket.IO signaling; mesh topology for voice rooms (≤ 5 peers)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ or Bun 1.x
- MongoDB 7+ (local or Atlas)
- [Clerk](https://clerk.com) account (free tier works)

### 1. Clone & install

```bash
git clone <repo-url> enclave && cd enclave

# Backend
cd backend && npm install

# Web
cd ../web && npm install

# Mobile
cd ../mobile && npm install
```

### 2. Configure environment variables

Each sub-package has a `.env.example` — copy and fill in:

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env
cp mobile/.env.example mobile/.env
```

See each sub-package README for the full variable list.

### 3. Run in development

```bash
# Terminal 1 — backend
cd backend && npm run dev      # http://localhost:3000

# Terminal 2 — web
cd web && npm run dev          # http://localhost:5173

# Terminal 3 — mobile (optional)
cd mobile && npx expo start
```

---

## 🔐 End-to-End Encryption

Enclave uses the **Web Crypto API** for true E2EE — the server never sees plaintext:

1. On first login, each user generates an **ECDH P-256 key pair** (stored in IndexedDB).
2. The **public key** is uploaded to the server.
3. When E2EE is toggled ON, both sides fetch each other's public key and derive a **shared AES-GCM 256-bit key** using ECDH.
4. Messages are encrypted client-side before transmission and decrypted client-side on receipt.
5. The derived key is **deterministic** (same for both parties) and never stored on the server.

---

## ⚡ Slash Commands

Type `/` in the message box to open the command menu:

| Command | Example | Action |
|---|---|---|
| `/poll` | `/poll What for lunch?` | Create a live poll |
| `/remind` | `/remind 2h Call Priya` | Set a reminder task |
| `/split` | `/split 1200 @Amit @Priya` | Split a bill equally |
| `/task` | `/task Review PR by Friday` | Create a chat task |
| `/code` | `/code js const x = 1` | Send a code snippet |
| `/shrug` | `/shrug` | ¯\\_(ツ)\_/¯ |
| `/tableflip` | `/tableflip` | (╯°□°)╯︵ ┻━┻ |

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20 / Bun 1.x
- **Framework:** Express 5 (async-native)
- **Real-time:** Socket.IO 4
- **Database:** MongoDB + Mongoose 8
- **Auth:** Clerk (JWT verification)
- **File Upload:** Multer → local disk (or swap for S3)

### Web
- **UI:** React 19
- **Build:** Vite 6
- **Styling:** Tailwind CSS v4 (CSS-first config)
- **State:** Zustand (socket store, call store, voice room store)
- **Data fetching:** TanStack Query v5
- **Auth:** `@clerk/clerk-react`
- **Icons:** Lucide React

### Mobile
- **Framework:** Expo SDK 54
- **Navigation:** Expo Router (file-based)
- **Styling:** NativeWind 4 (Tailwind for React Native)
- **HTTP:** Axios
- **Auth:** `@clerk/clerk-expo`

---

## 📡 Key Socket Events

| Event | Direction | Description |
|---|---|---|
| `send-message` | Client → Server | Send a message or thread reply |
| `new-message` | Server → Client | New message broadcast |
| `typing` | Client → Server | Typing indicator |
| `thread-typing` | Client → Server | Typing indicator inside a thread |
| `join-chat` / `leave-chat` | Client → Server | Join/leave a chat room |
| `join-thread` / `leave-thread` | Client → Server | Join/leave a thread room |
| `react-message` | Client → Server | Add/toggle an emoji reaction |
| `pin-message` | Client → Server | Pin or unpin a message |
| `delete-message` | Client → Server | Delete a message for everyone |
| `edit-message` | Client → Server | Edit a message text |
| `voice-room-join/leave` | Client ↔ Server | Drop-in voice room signaling |
| `webrtc-offer/answer/ice` | Client ↔ Server | 1:1 WebRTC call signaling |

---

## 📄 License

MIT — see [LICENSE](./LICENSE). Built by **Singh Rajdiwakar**.
