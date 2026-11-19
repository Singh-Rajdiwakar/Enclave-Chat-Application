# Enclave — Web App

> React 19 + Vite 6 + Tailwind CSS v4 frontend with real-time Socket.IO, Zustand state management, and browser-native E2EE.

---

## 🏗️ Project Structure

```
web/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── CallModal.jsx           # Outgoing WebRTC call UI
│   │   ├── ChatHeader.jsx          # Chat top bar (E2EE, Tasks, Calls, Back btn)
│   │   ├── ChatInput.jsx           # Message input with slash command menu
│   │   ├── ChatListItem.jsx        # Sidebar chat row (name, preview, unread)
│   │   ├── ChatThemeModal.jsx      # 6-theme neon accent picker
│   │   ├── CommandPalette.jsx      # Ctrl+K global search / navigation
│   │   ├── CreateGroupModal.jsx    # New group creation flow
│   │   ├── CreatePollModal.jsx     # Poll question + options builder
│   │   ├── IncomingCallModal.jsx   # Incoming call accept/reject UI
│   │   ├── MessageBubble.jsx       # All message types + reactions + thread link
│   │   ├── NewChatModal.jsx        # Start a new 1:1 chat
│   │   ├── SlashCommandMenu.jsx    # Floating slash command picker
│   │   ├── TasksPanel.jsx          # Slide-over panel: per-chat tasks
│   │   ├── ThreadPanel.jsx         # Slide-over panel: threaded replies
│   │   └── VoiceRoomBar.jsx        # Discord-style drop-in voice room bar
│   ├── hooks/
│   │   ├── useChats.js             # TanStack Query: chat list, pinned messages
│   │   ├── useCurrentUser.js       # Current logged-in user
│   │   ├── useMessages.js          # Messages + thread messages queries
│   │   ├── useSocketConnection.js  # Connect socket on mount, join/leave chat
│   │   └── useTasks.js             # CRUD hooks for tasks
│   ├── lib/
│   │   ├── axios.js                # Axios instance with Clerk token injection
│   │   ├── callStore.js            # Zustand: WebRTC call state machine
│   │   ├── crypto.js               # E2EE: ECDH keygen, AES-GCM encrypt/decrypt
│   │   ├── socket.js               # Zustand: Socket.IO store + all event handlers
│   │   ├── utils.js                # formatTime, cn(), etc.
│   │   └── voiceRoomStore.js       # Zustand: Voice room members + WebRTC mesh
│   ├── pages/
│   │   ├── ChatPage.jsx            # Main chat layout (sidebar + chat + panels)
│   │   └── HomePage.jsx            # Landing page with feature showcase
│   ├── index.css                   # Tailwind v4 theme + CSS variables + animations
│   └── main.jsx                    # React root, Clerk + QueryClient providers
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

---

## ⚙️ Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
VITE_CLERK_PUBLISHABLE_KEY=
```

---

## 🚀 Running Locally

```bash
npm install
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## 🎨 Design System

### Theme Variables (CSS custom properties)

```css
/* Set via data-tech-theme attribute on <html> */
--accent          /* Primary neon color */
--accent-2        /* Secondary gradient stop */
--accent-glow     /* rgba for glow effects */
--text            /* Primary text */
--muted           /* Muted/secondary text */
```

### Available Themes
| Theme | Accent |
|---|---|
| `indigo` (default) | Cyber Indigo `#6366f1` |
| `green` | Neon Green `#22c55e` |
| `cyan` | Electric Cyan `#06b6d4` |
| `rose` | Neon Rose `#f43f5e` |
| `amber` | Amber `#f59e0b` |
| `purple` | Deep Purple `#a855f7` |

### Key CSS Classes
- `.msg-me` — sender bubble (gradient, right-aligned)
- `.msg-them` — receiver bubble (glass, left-aligned)
- `.msg-animate` — slide-in animation for new messages
- `.meta-mono` — monospace metadata text (time, status)
- `.send-btn` — gradient send button
- `.tech-grid-pattern` — subtle grid background for chat area

---

## 🧠 State Management

### `socket.js` — Zustand Store (Primary)

| State | Type | Description |
|---|---|---|
| `socket` | `Socket \| null` | Socket.IO client instance |
| `onlineUsers` | `Set<string>` | Currently online user IDs |
| `typingUsers` | `Map<chatId, {userId, userName}>` | Typing indicators per chat |
| `threadTypingUsers` | `Map<parentId, {userId, userName}>` | Thread typing indicators |

Key actions: `connect()`, `sendMessage()`, `setTyping()`, `setThreadTyping()`, `reactMessage()`, `pinMessage()`, `deleteMessage()`, `editMessage()`, `markAsRead()`

### `callStore.js` — WebRTC Call State

States: `idle` → `calling` → `ringing` / `incoming` → `active` → `idle`

### `voiceRoomStore.js` — Voice Room (WebRTC Mesh)

Manages: room member list, peer connections, audio streams, mute state

---

## 🔐 E2EE Implementation

```
web/src/lib/crypto.js
```

| Function | Description |
|---|---|
| `getOrCreateKeyPair()` | Generate or load ECDH P-256 key pair from IndexedDB |
| `importPublicKey(jwk)` | Import a partner's JWK public key |
| `getDerivedAESKey(myPriv, theirPub, context)` | ECDH derive → HKDF → AES-GCM 256 key |
| `encryptText(text, aesKey)` | AES-GCM encrypt → `{ ciphertext, iv }` |
| `decryptText(cipher, iv, aesKey)` | AES-GCM decrypt → plaintext |

Keys are stored in `IndexedDB` as non-extractable CryptoKey objects. The server only ever sees the **public key** JWK and the **encrypted ciphertext** — never plaintext or the private key.

---

## ⚡ Slash Commands

Handled in `ChatPage.jsx → handleSend()`:

```
/poll    → opens CreatePollModal
/remind  → creates a Task + sends reminder message
/split   → formats a bill split message
/task    → creates a Task in the chat
/code    → sends formatted code block message
/shrug   → ¯\_(ツ)_/¯
/tableflip → (╯°□°)╯︵ ┻━┻
```

---

## 📱 Responsive Layout

| Breakpoint | Behavior |
|---|---|
| `< md` (mobile) | Sidebar shown OR chat shown — never both. Back button `←` in `ChatHeader` to return to sidebar |
| `≥ md` (desktop) | Fixed `w-80 shrink-0` sidebar + flex-1 chat area side by side |

Panels (`ThreadPanel`, `TasksPanel`) appear as full overlays on mobile, right slide-overs on desktop.

---

## 📄 License

MIT — Built by **Singh Rajdiwakar**.
