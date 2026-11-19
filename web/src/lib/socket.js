import { create } from "zustand";
import { io } from "socket.io-client";

const defaultSocketUrl = import.meta.env.DEV
  ? "http://localhost:3000"
  : typeof window !== "undefined"
  ? window.location.origin
  : "";

const SOCKET_URL = (import.meta.env.VITE_API_URL || defaultSocketUrl).replace(/\/api\/?$/, "");

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  typingUsers: new Map(), // chatId -> { userId, userName }
  threadTypingUsers: new Map(), // parentId -> { userId, userName }
  queryClient: null,

  connect: (tokenOrGetToken, queryClient) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected || !queryClient) return;

    if (existingSocket) existingSocket.disconnect();

    const isFunction = typeof tokenOrGetToken === "function";
    const authOption = isFunction
      ? (cb) => {
          tokenOrGetToken()
            .then((token) => cb({ token }))
            .catch(() => cb({ token: null }));
        }
      : { token: tokenOrGetToken };

    const socket = io(SOCKET_URL, {
      auth: authOption,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
    });

    socket.on("connect_error", async (error) => {
      console.warn("⚠️ Socket connection error:", error.message);
      if (isFunction) {
        try {
          const freshToken = await tokenOrGetToken({ skipCache: true });
          socket.auth = { token: freshToken };
          socket.connect();
        } catch (e) {
          // ignore
        }
      }
    });

    socket.on("socket-error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("online-users", ({ userIds }) => {
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("user-online", ({ userId }) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId]),
      }));
    });

    socket.on("user-offline", ({ userId }) => {
      set((state) => {
        const onlineUsers = new Set(state.onlineUsers);
        onlineUsers.delete(userId);
        return { onlineUsers };
      });
    });

    socket.on("typing", ({ userId, userName, chatId, isTyping }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        if (isTyping) typingUsers.set(chatId, { userId, userName: userName || "Someone" });
        else typingUsers.delete(chatId);
        return { typingUsers };
      });
    });

    // 🧵 Thread-specific typing indicator
    socket.on("thread-typing", ({ userId, userName, parentId, isTyping }) => {
      set((state) => {
        const threadTypingUsers = new Map(state.threadTypingUsers);
        if (isTyping) threadTypingUsers.set(parentId, { userId, userName: userName || "Someone" });
        else threadTypingUsers.delete(parentId);
        return { threadTypingUsers };
      });
    });

    socket.on("new-message", (message) => {
      const senderId = message.sender?._id;

      // If this is a thread reply (parentId set), only update thread cache — NOT main chat
      if (message.parentId) {
        // Update thread replies cache — remove optimistic temp reply and avoid duplicates
        queryClient.setQueryData(["thread", message.parentId], (old) => {
          if (!old) return { parent: null, replies: [message] };
          const filtered = (old.replies || []).filter((r) => !r._id.startsWith("temp-"));
          const exists = filtered.some((r) => r._id === message._id);
          return exists ? { ...old, replies: filtered } : { ...old, replies: [...filtered, message] };
        });

        // Clear thread typing indicator
        set((state) => {
          const threadTypingUsers = new Map(state.threadTypingUsers);
          threadTypingUsers.delete(message.parentId);
          return { threadTypingUsers };
        });

        // Also update replyCount on the parent message in main chat cache
        queryClient.setQueryData(["messages", message.chat], (old) => {
          if (!old) return old;
          return old.map((m) => {
            if (m._id === message.parentId) {
              return { ...m, replyCount: (m.replyCount || 0) + 1 };
            }
            return m;
          });
        });
        return; // stop here — do NOT add thread replies to main chat list
      }

      // Top-level message → update main chat message list
      queryClient.setQueryData(["messages", message.chat], (old) => {
        if (!old) return [message];
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));
        const exists = filtered.some((m) => m._id === message._id);
        return exists ? filtered : [...filtered, message];
      });

      // update chat's lastMessage
      queryClient.setQueryData(["chats"], (oldChats) => {
        return oldChats?.map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: {
                _id: message._id,
                text: message.text,
                messageType: message.messageType,
                fileName: message.fileName,
                sender: senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
            };
          }
          return chat;
        });
      });

      // clear typing indicator
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(message.chat);
        return { typingUsers };
      });
    });

    // 🧵 Thread reply count updated from server (backend sends this alongside new-message)
    // We already handle replyCount increment in new-message handler above, so just ignore duplicates here
    socket.on("thread-reply-added", ({ parentId, replyCountDelta }) => {
      // Already handled in new-message event — no-op to prevent double increment
    });

    socket.on("messages-read", ({ chatId, readerId }) => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return old;
        return old.map((m) => {
          const senderId = m.sender?._id || m.sender;
          if (senderId !== readerId) {
            return { ...m, status: "read" };
          }
          return m;
        });
      });
    });

    socket.on("message-reacted", ({ messageId, chatId, reactions }) => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return old;
        return old.map((m) => {
          if (m._id === messageId) {
            return { ...m, reactions };
          }
          return m;
        });
      });
    });

    // 🗑️ Message deleted for everyone
    socket.on("message-deleted", ({ messageId, chatId }) => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return old;
        return old.map((m) => {
          if (m._id === messageId) {
            return { ...m, isDeleted: true, text: "This message was deleted" };
          }
          return m;
        });
      });
    });

    // ✏️ Message edited
    socket.on("message-edited", ({ messageId, chatId, text, isEdited }) => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return old;
        return old.map((m) => {
          if (m._id === messageId) {
            return { ...m, text, isEdited: true };
          }
          return m;
        });
      });
    });

    // 📌 Message pinned / unpinned
    socket.on("message-pinned", ({ messageId, chatId, isPinned, message }) => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return old;
        return old.map((m) => {
          if (m._id === messageId) {
            return { ...m, isPinned };
          }
          return m;
        });
      });
      queryClient.invalidateQueries({ queryKey: ["pinned", chatId] });
    });

    // 📊 Poll updated
    socket.on("poll-updated", ({ messageId, chatId, poll }) => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return old;
        return old.map((m) => {
          if (m._id === messageId) {
            return { ...m, poll };
          }
          return m;
        });
      });
    });

    // 📋 Task real-time updates
    socket.on("task-created", ({ chatId, task }) => {
      queryClient.setQueryData(["tasks", chatId], (old = []) => {
        if (old.some((t) => t._id === task._id)) return old;
        return [task, ...old];
      });
    });

    socket.on("task-updated", ({ chatId, task }) => {
      queryClient.setQueryData(["tasks", chatId], (old = []) =>
        old.map((t) => (t._id === task._id ? task : t))
      );
    });

    socket.on("task-deleted", ({ chatId, taskId }) => {
      queryClient.setQueryData(["tasks", chatId], (old = []) =>
        old.filter((t) => t._id !== taskId)
      );
    });

    set({ socket, queryClient });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        onlineUsers: new Set(),
        typingUsers: new Map(),
        threadTypingUsers: new Map(),
        queryClient: null,
      });
    }
  },

  joinChat: (chatId) => {
    get().socket?.emit("join-chat", chatId);
  },

  leaveChat: (chatId) => {
    get().socket?.emit("leave-chat", chatId);
  },

  sendMessage: (chatId, payload, currentUser) => {
    const { socket, queryClient } = get();
    if (!socket?.connected || !queryClient) {
      console.error("[Socket] Cannot send message - socket not connected or no queryClient");
      return null;
    }

    const data = typeof payload === "string" ? { text: payload, messageType: "text" } : payload;
    const {
      text = "",
      messageType = "text",
      fileUrl = "",
      fileName = "",
      fileSize = 0,
      duration = 0,
      poll = undefined,
      linkPreview = undefined,
      parentId = undefined,
      isEncrypted = undefined,
      encryptionIv = undefined,
    } = data;

    // create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      chat: chatId,
      sender: {
        _id: currentUser._id,
        name: currentUser.name || currentUser.fullName || currentUser.firstName || "You",
        email: currentUser.email || currentUser.primaryEmailAddress?.emailAddress || "",
        avatar: currentUser.avatar || currentUser.imageUrl,
      },
      text,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      duration,
      poll,
      linkPreview,
      parentId,
      isEncrypted,
      encryptionIv,
      status: "sent",
      createdAt: new Date().toISOString(),
    };

    // add optimistic message immediately (only if not a thread reply, or let thread handle it)
    if (!parentId) {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return [optimisticMessage];
        return [...old, optimisticMessage];
      });
    }

    // emit to server
    socket.emit("send-message", {
      chatId,
      text,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      duration,
      poll,
      linkPreview,
      parentId,
      isEncrypted,
      encryptionIv,
    });

    // handle errors
    socket.once("socket-error", () => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return [];
        return old.filter((m) => m._id !== tempId);
      });
    });

    return tempId;
  },

  deleteMessage: (messageId, chatId) => {
    get().socket?.emit("delete-message", { messageId, chatId });
  },

  editMessage: (messageId, chatId, text) => {
    get().socket?.emit("edit-message", { messageId, chatId, text });
  },

  pinMessage: (messageId, chatId, isPinned) => {
    get().socket?.emit("pin-message", { messageId, chatId, isPinned });
  },

  votePoll: (messageId, chatId, optionId) => {
    get().socket?.emit("vote-poll", { messageId, chatId, optionId });
  },

  setTyping: (chatId, isTyping) => {
    get().socket?.emit("typing", { chatId, isTyping });
  },

  setThreadTyping: (parentId, chatId, isTyping) => {
    get().socket?.emit("thread-typing", { parentId, chatId, isTyping });
  },

  markAsRead: (chatId) => {
    get().socket?.emit("mark-as-read", { chatId });
  },

  reactMessage: (messageId, chatId, emoji) => {
    get().socket?.emit("react-message", { messageId, chatId, emoji });
  },
}));
