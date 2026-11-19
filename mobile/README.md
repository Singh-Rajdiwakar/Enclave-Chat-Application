# Enclave — Mobile App

> Expo SDK 54 + React Native mobile client with real-time messaging, E2EE, voice rooms, and NativeWind styling.

---

## 🏗️ Project Structure

```
mobile/
├── app/
│   ├── (auth)/
│   │   └── index.tsx       # Login / Sign-up screen (Clerk)
│   ├── (tabs)/
│   │   ├── index.tsx       # Chat list tab
│   │   └── profile.tsx     # Profile / settings tab
│   ├── chat/
│   │   └── [id].tsx        # Individual chat screen
│   └── _layout.tsx         # Root Expo Router layout + Clerk provider
├── components/
│   ├── MessageBubble.tsx   # Message rendering (text, image, audio, poll)
│   ├── ChatListItem.tsx    # Chat list row
│   ├── VoiceRoom.tsx       # Drop-in voice room UI
│   └── ...
├── lib/
│   ├── axios.ts            # Axios instance with Clerk token
│   └── socket.ts           # Socket.IO client + event handling
├── hooks/
│   ├── useChats.ts
│   ├── useMessages.ts
│   └── useCurrentUser.ts
├── app.json                # Expo config (name: Enclave, slug: enclave)
├── package.json
├── tailwind.config.js      # NativeWind config
└── .env.example
```

---

## ⚙️ Environment Variables

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

> Use `EXPO_PUBLIC_` prefix — these are bundled into the app at build time.

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone, OR Android Studio / Xcode for emulators

### Start

```bash
npm install
npx expo start
```

Then press:
- `a` — open Android emulator
- `i` — open iOS simulator
- `w` — open in browser (web mode)
- Scan QR code with **Expo Go** app on your phone

---

## 📱 App Config (`app.json`)

| Field | Value |
|---|---|
| `name` | `Enclave` |
| `slug` | `enclave` |
| `scheme` | `enclave` |
| `bundleIdentifier` | `com.enclave.app` |
| `package` | `com.enclave.app` |

---

## 🔧 Key Dependencies

| Package | Purpose |
|---|---|
| `expo` ~54 | Core Expo SDK |
| `expo-router` | File-based navigation |
| `@clerk/clerk-expo` | Authentication |
| `socket.io-client` | Real-time messaging |
| `axios` | REST API calls |
| `nativewind` v4 | Tailwind CSS for React Native |
| `expo-av` | Audio recording & playback |
| `expo-image-picker` | Photo/video selection |
| `expo-document-picker` | File selection |
| `@react-native-async-storage/async-storage` | Local key-value storage |

---

## 🏛️ Navigation Structure

```
(auth)/
  └── index          → Login screen (redirects to tabs when authenticated)

(tabs)/
  ├── index          → Chat list
  └── profile        → User profile

chat/
  └── [id]           → Active chat screen
      ├── MessageList
      ├── ThreadPanel (slide-over)
      ├── VoiceRoom (bottom bar)
      └── ChatInput
```

---

## 🔌 Socket Connection (`lib/socket.ts`)

```typescript
// Connects with Clerk JWT
const socket = io(SOCKET_URL, {
  auth: { token: await getToken() },
  reconnection: true,
  reconnectionAttempts: 10,
});
```

The socket module handles:
- `new-message` — append to message list
- `typing` — show typing indicator
- `user-online/offline` — online status dots
- `message-reacted` — live reaction badges
- `message-deleted` / `message-edited` — in-place updates

---

## 🏗️ Building for Production

### Android APK / AAB
```bash
npx expo build:android   # classic build
# or
eas build --platform android
```

### iOS IPA
```bash
eas build --platform ios
```

### Over-the-Air Update
```bash
eas update --channel production
```

---

## 🎨 Styling (NativeWind v4)

Enclave Mobile uses **NativeWind 4** which compiles Tailwind classes to React Native StyleSheet at build time.

```typescript
<View className="flex-1 bg-[#0A0B10]">
  <Text className="text-white font-semibold text-sm">Hello</Text>
</View>
```

Custom colors are defined in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      enclave: {
        bg: '#0A0B10',
        surface: '#11131A',
        accent: '#6366f1',
      }
    }
  }
}
```

---

## 📄 License

MIT — Built by **Singh Rajdiwakar**.
