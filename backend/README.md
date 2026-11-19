# Enclave — Backend

> Node.js + Express 5 + Socket.IO real-time backend with Clerk authentication and MongoDB persistence.

---

## 🏗️ Architecture

```
backend/
├── src/
│   ├── app.ts                # Express app setup, CORS, middleware
│   ├── config/
│   │   └── database.ts       # Mongoose connection
│   ├── controllers/
│   │   ├── authController.ts     # Clerk webhook sync
│   │   ├── chatController.ts     # Chat CRUD
│   │   ├── messageController.ts  # Message history, threads, pinned
│   │   ├── taskController.ts     # Per-chat task management
│   │   └── userController.ts     # User profile, public key exchange
│   ├── middleware/
│   │   ├── auth.ts           # Clerk JWT verification middleware
│   │   └── errorHandler.ts   # Global async error handler
│   ├── models/
│   │   ├── Chat.ts           # Chat schema (participants, lastMessage)
│   │   ├── Message.ts        # Message schema (all types + E2EE fields)
│   │   ├── Task.ts           # Task schema (title, status, dueDate)
│   │   └── User.ts           # User schema (clerkId, publicKey for E2EE)
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── chatRoutes.ts
│   │   ├── messageRoutes.ts
│   │   ├── taskRoutes.ts
│   │   ├── uploadRoutes.ts
│   │   └── userRoutes.ts
│   └── utils/
│       └── socket.ts         # Socket.IO server, all real-time event handlers
├── index.ts                  # HTTP server entry point
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=3000
MONGODB_URI=            # MongoDB connection string
CLERK_SECRET_KEY=       # From Clerk dashboard → API Keys
CLERK_PUBLISHABLE_KEY=  # From Clerk dashboard → API Keys
CLIENT_URL=             # Frontend URL (e.g. http://localhost:5173)
```

> ⚠️ Never commit `.env`. The `.env.example` file contains only key names with empty values.

---

## 🚀 Running Locally

```bash
npm install
npm run dev      # ts-node-dev with hot reload → http://localhost:3000
```

For production:
```bash
npm run build    # tsc → dist/
npm start        # node dist/index.js
```

---

## 🐳 Docker

```bash
docker build -t enclave-backend .
docker run -p 3000:3000 --env-file .env enclave-backend
```

---

## 📡 REST API Reference

All routes (except `/auth`) require a valid Clerk JWT in the `Authorization: Bearer <token>` header.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/sync` | Sync Clerk user to MongoDB (called on first login) |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/search?q=` | Search users by name/email |
| POST | `/api/users/public-key` | Register E2EE public key |
| GET | `/api/users/:id/public-key` | Fetch a user's public key for key exchange |

### Chats
| Method | Path | Description |
|---|---|---|
| GET | `/api/chats` | List all chats for current user |
| POST | `/api/chats` | Get or create a 1:1 chat |
| POST | `/api/chats/self` | Get or create "Saved Messages" self-chat |
| POST | `/api/chats/group` | Create a group chat |

### Messages
| Method | Path | Description |
|---|---|---|
| GET | `/api/messages/:chatId` | Paginated message history |
| GET | `/api/messages/:chatId/pinned` | Pinned messages in a chat |
| GET | `/api/messages/thread/:parentId` | Thread replies for a parent message |

### Tasks
| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks/:chatId` | List tasks for a chat |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update task (status, title, dueDate) |
| DELETE | `/api/tasks/:id` | Delete a task |

### Uploads
| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Upload file (image/document/audio) → returns `fileUrl` |

---

## 🔌 Socket.IO Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-chat` | `chatId` | Subscribe to a chat room |
| `leave-chat` | `chatId` | Unsubscribe from a chat room |
| `send-message` | `{ chatId, text, messageType, parentId?, poll?, isEncrypted?, ... }` | Send message |
| `typing` | `{ chatId, isTyping }` | Broadcast typing status |
| `thread-typing` | `{ parentId, chatId, isTyping }` | Broadcast typing inside a thread |
| `join-thread` | `parentId` | Subscribe to a thread room |
| `leave-thread` | `parentId` | Unsubscribe from a thread room |
| `react-message` | `{ messageId, chatId, emoji }` | Add/toggle emoji reaction |
| `pin-message` | `{ messageId, chatId, isPinned }` | Pin or unpin a message |
| `delete-message` | `{ messageId, chatId }` | Delete for everyone |
| `edit-message` | `{ messageId, chatId, text }` | Edit message text |
| `mark-as-read` | `{ chatId }` | Mark all messages as read |
| `vote-poll` | `{ messageId, chatId, optionId }` | Vote on a poll option |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `new-message` | `Message` | New or thread reply message |
| `typing` | `{ userId, userName, chatId, isTyping }` | Typing indicator |
| `thread-typing` | `{ userId, userName, parentId, isTyping }` | Thread typing indicator |
| `message-deleted` | `{ messageId, chatId }` | Message deleted |
| `message-edited` | `{ messageId, chatId, text, isEdited }` | Message edited |
| `message-reacted` | `{ messageId, chatId, reactions }` | Reactions updated |
| `message-pinned` | `{ messageId, chatId, isPinned }` | Pin status changed |
| `messages-read` | `{ chatId, readerId }` | Read receipts updated |
| `online-users` | `{ userIds }` | Initial online user list |
| `user-online` | `{ userId }` | User came online |
| `user-offline` | `{ userId }` | User went offline |
| `poll-updated` | `{ messageId, chatId, poll }` | Poll vote received |
| `thread-reply-added` | `{ parentId, replyCountDelta }` | Thread reply count updated |

---

## 🗄️ Data Models

### Message
```typescript
{
  chat: ObjectId,
  sender: ObjectId,
  text: string,
  messageType: 'text' | 'image' | 'file' | 'audio' | 'poll' | 'call',
  fileUrl?: string,
  fileName?: string,
  fileSize?: number,
  duration?: number,          // audio duration in seconds
  parentId?: ObjectId,        // set for thread replies
  replyCount: number,
  isEncrypted: boolean,
  encryptionIv?: string,      // AES-GCM IV (base64)
  isPinned: boolean,
  isDeleted: boolean,
  isEdited: boolean,
  reactions: [{ user: ObjectId, emoji: string }],
  poll?: { question, options: [{ id, text, votes: [ObjectId] }] },
  status: 'sent' | 'delivered' | 'read',
}
```

### User
```typescript
{
  clerkId: string,            // Clerk user ID
  name: string,
  email: string,
  avatar: string,             // Clerk imageUrl
  publicKey?: string,         // ECDH P-256 public key JWK (for E2EE)
}
```

---

## 📄 License

MIT — Built by **Singh Rajdiwakar**.
