import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken, clerkClient } from "@clerk/express";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { User } from "../models/User";

// store online users in memory: userId -> socketId
export const onlineUsers: Map<string, string> = new Map();

// Track active WebRTC calls for call history logging
interface ActiveCall {
  callerId: string;
  receiverId: string;
  chatId?: string;
  isVideo: boolean;
  answered: boolean;
  startTime?: number;
}
const activeCalls = new Map<string, ActiveCall>();

// Voice Rooms (Drop-in audio channels per chat/group)
export interface VoiceRoomMember {
  userId: string;
  name: string;
  avatar: string;
  socketId: string;
  isMuted: boolean;
  isSpeaking: boolean;
}
const voiceRooms = new Map<string, Map<string, VoiceRoomMember>>(); // chatId -> (userId -> VoiceRoomMember)

function getCallKey(id1: string, id2: string) {
  return [id1, id2].sort().join(":");
}

function formatCallDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
    },
  });

  // verify socket connection - if the user is authenticated, we will store the user id in the socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token; // this is what user will send from client
    if (!token) {
      console.error("[Socket Auth] Error: No token provided in handshake");
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
      const clerkId = session.sub;

      let user = await User.findOne({ clerkId });
      if (!user) {
        console.log(`[Socket Auth] User not found in DB for clerkId ${clerkId}, fetching from Clerk...`);
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          user = await User.create({
            clerkId,
            name: clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
              : clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || "User",
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            avatar: clerkUser.imageUrl,
          });
          console.log(`[Socket Auth] Auto-created user ${user.name} (${user._id})`);
        } catch (fetchErr: any) {
          console.error("[Socket Auth] Failed to auto-create user:", fetchErr.message);
        }
      }

      if (!user) {
        console.error(`[Socket Auth] User still not found for clerkId ${clerkId}`);
        return next(new Error("User not found"));
      }

      socket.data.userId = user._id.toString();
      socket.data.userName = user.name || "User";
      socket.data.userAvatar = user.avatar || "";
      console.log(`[Socket Auth] ✅ Authenticated user ${user.name} (${socket.data.userId})`);
      next();
    } catch (error: any) {
      console.error("[Socket Auth] verifyToken failed:", error.message || error);
      next(new Error(error.message || "Authentication error"));
    }
  });

  // this "connection" event name is special and should be written like this
  // it's the event that is triggered when a new client connects to the server
  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] 🟢 User connected: ${userId} (socketId: ${socket.id})`);

    // store user in the onlineUsers map FIRST
    onlineUsers.set(userId, socket.id);

    // send list of currently online users to the newly connected client (including self)
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    // notify others that this current user is online
    socket.broadcast.emit("user-online", { userId });

    socket.join(`user:${userId}`);

    // Allow client to re-request online users list (e.g. after reconnect)
    socket.on("get-online-users", () => {
      socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });
    });

    socket.on("join-chat", async (chatId: string) => {
      console.log(`[Socket] User ${userId} joined room chat:${chatId}`);
      socket.join(`chat:${chatId}`);

      // Auto-mark unread messages as read when joining chat
      try {
        const result = await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, status: { $ne: "read" } },
          { $set: { status: "read" } }
        );
        if (result.modifiedCount > 0) {
          io.to(`chat:${chatId}`).emit("messages-read", { chatId, readerId: userId });
          console.log(`[Read Receipts] 👁️ ${result.modifiedCount} messages marked as read in chat ${chatId}`);
        }
      } catch (err: any) {
        console.error("[Read Receipts] Error auto-marking as read:", err.message);
      }
    });

    socket.on("mark-as-read", async (data: { chatId: string }) => {
      try {
        const { chatId } = data;
        const result = await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, status: { $ne: "read" } },
          { $set: { status: "read" } }
        );
        if (result.modifiedCount > 0) {
          io.to(`chat:${chatId}`).emit("messages-read", { chatId, readerId: userId });
          console.log(`[Read Receipts] 👁️ ${result.modifiedCount} messages marked as read via mark-as-read`);
        }
      } catch (err: any) {
        console.error("[Read Receipts] Error marking as read:", err.message);
      }
    });

    socket.on("react-message", async (data: { messageId: string; chatId: string; emoji: string }) => {
      try {
        const { messageId, chatId, emoji } = data;
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingReactionIndex = message.reactions.findIndex(
          (r: any) => r.user.toString() === userId && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
          // Toggle off
          message.reactions.splice(existingReactionIndex, 1);
        } else {
          // Replace prior reaction by this user
          const priorIndex = message.reactions.findIndex((r: any) => r.user.toString() === userId);
          if (priorIndex > -1) {
            message.reactions.splice(priorIndex, 1);
          }
          message.reactions.push({ user: userId as any, emoji });
        }

        await message.save();

        io.to(`chat:${chatId}`).emit("message-reacted", {
          messageId,
          chatId,
          reactions: message.reactions,
        });
        console.log(`[Reactions] 👍 Message ${messageId} reaction updated: ${emoji} by ${userId}`);
      } catch (err: any) {
        console.error("[Reactions] Error updating reaction:", err.message);
      }
    });

    socket.on("leave-chat", (chatId: string) => {
      console.log(`[Socket] User ${userId} left room chat:${chatId}`);
      socket.leave(`chat:${chatId}`);
    });

    socket.on("join-thread", (parentId: string) => {
      socket.join(`thread:${parentId}`);
    });

    socket.on("leave-thread", (parentId: string) => {
      socket.leave(`thread:${parentId}`);
    });

    socket.on("thread-typing", (data: { parentId: string; chatId: string; isTyping: boolean }) => {
      const threadTypingPayload = {
        userId,
        userName: socket.data.userName || "Someone",
        parentId: data.parentId,
        chatId: data.chatId,
        isTyping: data.isTyping,
      };
      socket.to(`thread:${data.parentId}`).emit("thread-typing", threadTypingPayload);
    });

    // handle sending messages
    socket.on(
      "send-message",
      async (data: {
        chatId: string;
        text?: string;
        messageType?: "text" | "image" | "file" | "audio" | "poll";
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        duration?: number;
        parentId?: string;
        isEncrypted?: boolean;
        encryptionIv?: string;
        poll?: { question: string; options: Array<{ id: string; text: string; votes: any[] }> };
        linkPreview?: { url: string; title?: string; description?: string; image?: string; domain?: string };
      }) => {
        try {
          const {
            chatId,
            text,
            messageType = "text",
            fileUrl,
            fileName,
            fileSize,
            duration,
            parentId,
            isEncrypted = false,
            encryptionIv = "",
            poll,
            linkPreview,
          } = data;
          console.log(`[Socket] 📩 send-message [${messageType}] from ${userId} to chat ${chatId}${parentId ? ` (thread: ${parentId})` : ""}${isEncrypted ? " [E2EE 🔒]" : ""}`);

          const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
          });

          if (!chat) {
            console.warn(`[Socket] ⚠️ Chat not found or user not participant: ${chatId}`);
            socket.emit("socket-error", { message: "Chat not found" });
            return;
          }

          const otherParticipant = chat.participants.find((p: any) => p.toString() !== userId);
          const isReceiverOnline = otherParticipant && onlineUsers.has(otherParticipant.toString());

          const message = await Message.create({
            chat: chatId,
            sender: userId,
            text: text || "",
            messageType,
            fileUrl: fileUrl || "",
            fileName: fileName || "",
            fileSize: fileSize || 0,
            duration: duration || 0,
            parentId: parentId || null,
            isEncrypted,
            encryptionIv,
            poll: poll || undefined,
            linkPreview: linkPreview || undefined,
            status: isReceiverOnline ? "delivered" : "sent",
          });

          // Only update chat's lastMessage for top-level messages
          if (!parentId) {
            chat.lastMessage = message._id;
            chat.lastMessageAt = new Date();
            await chat.save();
          } else {
            // Increment parent message's replyCount
            await Message.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } });
            // Notify chat that parent message's replyCount changed
            io.to(`chat:${chatId}`).emit("thread-reply-added", { parentId, replyCountDelta: 1 });
          }

          await message.populate("sender", "name avatar");
          console.log(`[Socket] ✅ Message saved ${message._id}. Broadcasting...`);

          // broadcast to chat room, thread room and all participants' personal rooms
          const targetRooms = [
            `chat:${chatId}`,
            ...(parentId ? [`thread:${parentId}`] : []),
            ...chat.participants.map((p: any) => `user:${p.toString()}`),
          ];
          io.to(targetRooms).emit("new-message", message);
        } catch (error: any) {
          console.error("[Socket] ❌ Failed to send message:", error.message || error);
          socket.emit("socket-error", { message: "Failed to send message" });
        }
      }
    );

    socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
      const typingPayload = {
        userId,
        userName: socket.data.userName || "Someone",
        chatId: data.chatId,
        isTyping: data.isTyping,
      };

      // emit to chat room (for users inside the chat)
      socket.to(`chat:${data.chatId}`).emit("typing", typingPayload);

      // also emit to other participant's personal room (for chat list view)
      try {
        const chat = await Chat.findById(data.chatId);
        if (chat) {
          const otherParticipantId = chat.participants.find((p: any) => p.toString() !== userId);
          if (otherParticipantId) {
            socket.to(`user:${otherParticipantId}`).emit("typing", typingPayload);
          }
        }
      } catch (error) {
        // silently fail - typing indicator is not critical
      }
    });

    // Delete message for everyone
    socket.on("delete-message", async (data: { messageId: string; chatId: string }) => {
      try {
        const { messageId, chatId } = data;
        const message = await Message.findOne({ _id: messageId, sender: userId });
        if (message) {
          message.isDeleted = true;
          message.text = "This message was deleted";
          await message.save();
          io.to(`chat:${chatId}`).emit("message-deleted", { messageId, chatId });
          console.log(`[Socket] 🗑️ Message deleted: ${messageId}`);
        }
      } catch (err: any) {
        console.error("[Socket] Error deleting message:", err.message);
      }
    });

    // Edit message
    socket.on("edit-message", async (data: { messageId: string; chatId: string; text: string }) => {
      try {
        const { messageId, chatId, text } = data;
        if (!text || !text.trim()) return;
        const message = await Message.findOne({ _id: messageId, sender: userId });
        if (message && !message.isDeleted) {
          message.text = text.trim();
          message.isEdited = true;
          await message.save();
          io.to(`chat:${chatId}`).emit("message-edited", { messageId, chatId, text: message.text, isEdited: true });
          console.log(`[Socket] ✏️ Message edited: ${messageId}`);
        }
      } catch (err: any) {
        console.error("[Socket] Error editing message:", err.message);
      }
    });

    // Pin / Unpin message
    socket.on("pin-message", async (data: { messageId: string; chatId: string; isPinned: boolean }) => {
      try {
        const { messageId, chatId, isPinned } = data;
        const message = await Message.findByIdAndUpdate(messageId, { isPinned }, { new: true }).populate("sender", "name avatar");
        if (message) {
          io.to(`chat:${chatId}`).emit("message-pinned", { messageId, chatId, isPinned, message });
          console.log(`[Socket] 📌 Message pinned status updated: ${messageId} -> ${isPinned}`);
        }
      } catch (err: any) {
        console.error("[Socket] Error pinning message:", err.message);
      }
    });

    // Vote on a Poll
    socket.on("vote-poll", async (data: { messageId: string; chatId: string; optionId: string }) => {
      try {
        const { messageId, chatId, optionId } = data;
        const message = await Message.findById(messageId);
        if (message && message.poll && Array.isArray(message.poll.options)) {
          // Single-choice voting: remove userId from all options
          message.poll.options.forEach((opt: any) => {
            opt.votes = (opt.votes || []).filter((vId: any) => vId.toString() !== userId);
          });
          // Add userId to chosen option
          const target = message.poll.options.find((opt: any) => opt.id === optionId);
          if (target) {
            target.votes.push(userId as any);
          }
          await message.save();
          io.to(`chat:${chatId}`).emit("poll-updated", { messageId, chatId, poll: message.poll });
          console.log(`[Socket] 📊 Poll voted on: ${messageId} -> option ${optionId}`);
        }
      } catch (err: any) {
        console.error("[Socket] Error voting on poll:", err.message);
      }
    });

    // Helper to record call history in database
    async function recordCallHistory(
      call: ActiveCall,
      status: "completed" | "missed" | "declined",
      duration: number = 0
    ) {
      try {
        let chatId = call.chatId;
        if (!chatId) {
          const foundChat = await Chat.findOne({
            participants: { $all: [call.callerId, call.receiverId] },
          });
          chatId = foundChat?._id?.toString();
        }

        if (!chatId) {
          console.warn("[Call History] Could not find chat between", call.callerId, call.receiverId);
          return;
        }

        const isVideo = call.isVideo;
        let text = "";
        if (status === "completed") {
          text = isVideo
            ? `Video call (${formatCallDuration(duration)})`
            : `Voice call (${formatCallDuration(duration)})`;
        } else if (status === "missed") {
          text = isVideo ? "Missed video call" : "Missed voice call";
        } else {
          text = isVideo ? "Declined video call" : "Declined voice call";
        }

        const message = await Message.create({
          chat: chatId,
          sender: call.callerId,
          messageType: "call",
          callType: isVideo ? "video" : "audio",
          callStatus: status,
          duration: Math.round(duration),
          text,
        });

        await message.populate("sender", "name avatar");

        // Update last message in chat
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.lastMessage = message._id as any;
          chat.lastMessageAt = new Date();
          await chat.save();
        }

        const targetRooms = [`chat:${chatId}`, `user:${call.callerId}`, `user:${call.receiverId}`];
        io.to(targetRooms).emit("new-message", message);
        console.log(`[Call History] 📝 Logged ${status} call in chat ${chatId}: ${text}`);
      } catch (err: any) {
        console.error("[Call History] ❌ Error recording call history:", err.message);
      }
    }

    // ==========================================
    // 📞 WebRTC Audio & Video Calling Signaling
    // ==========================================
    socket.on(
      "call-user",
      async (data: { userToCall: string; offer: any; isVideo: boolean; chatId?: string; callRoomId?: string }) => {
        try {
          const { userToCall, offer, isVideo, chatId } = data;
          const callRoomId = data.callRoomId || `room-${getCallKey(userId, userToCall)}`;
          socket.join(`call-room:${callRoomId}`);

          console.log(`[Call] 📞 Call initiated from ${userId} to ${userToCall} (room: ${callRoomId}, video: ${isVideo})`);

          const callKey = getCallKey(userId, userToCall);
          activeCalls.set(callKey, {
            callerId: userId,
            receiverId: userToCall,
            chatId,
            isVideo,
            answered: false,
          });

          const callerUser = await User.findById(userId).select("name avatar");
          io.to(`user:${userToCall}`).emit("incoming-call", {
            from: userId,
            caller: {
              _id: userId,
              name: callerUser?.name || "Caller",
              avatar: callerUser?.avatar || "",
            },
            offer,
            isVideo,
            chatId,
            callRoomId,
          });
        } catch (err: any) {
          console.error("[Call] Error initiating call:", err.message);
        }
      }
    );

    socket.on("answer-call", (data: { to: string; answer: any; callRoomId?: string }) => {
      console.log(`[Call] 🟢 Call answered by ${userId} for ${data.to}`);
      const callRoomId = data.callRoomId || `room-${getCallKey(userId, data.to)}`;
      socket.join(`call-room:${callRoomId}`);

      const callKey = getCallKey(userId, data.to);
      const call = activeCalls.get(callKey);
      if (call) {
        call.answered = true;
        call.startTime = Date.now();
      }

      io.to(`user:${data.to}`).emit("call-answered", {
        from: userId,
        answer: data.answer,
        callRoomId,
      });
    });

    socket.on("ice-candidate", (data: { to: string; candidate: any }) => {
      io.to(`user:${data.to}`).emit("ice-candidate", {
        from: userId,
        candidate: data.candidate,
      });
    });

    socket.on("reject-call", async (data: { to: string }) => {
      console.log(`[Call] 🔴 Call rejected by ${userId} for ${data.to}`);
      const callKey = getCallKey(userId, data.to);
      const call = activeCalls.get(callKey);
      if (call) {
        await recordCallHistory(call, "declined", 0);
        activeCalls.delete(callKey);
      }

      io.to(`user:${data.to}`).emit("call-rejected", { from: userId });
    });

    socket.on("end-call", async (data: { to: string; duration?: number; callRoomId?: string }) => {
      console.log(`[Call] ⏹️ Call ended by ${userId} for ${data.to}`);
      if (data.callRoomId) {
        socket.leave(`call-room:${data.callRoomId}`);
        socket.to(`call-room:${data.callRoomId}`).emit("peer-left", { peerId: userId });
      }

      const callKey = getCallKey(userId, data.to);
      const call = activeCalls.get(callKey);
      if (call) {
        if (call.answered) {
          const dur =
            data.duration ||
            (call.startTime ? Math.max(1, Math.round((Date.now() - call.startTime) / 1000)) : 0);
          await recordCallHistory(call, "completed", dur);
        } else {
          const status = userId === call.callerId ? "missed" : "declined";
          await recordCallHistory(call, status, 0);
        }
        activeCalls.delete(callKey);
      }

      io.to(`user:${data.to}`).emit("call-ended", { from: userId });
    });

    // ------------------------------------
    // 👥 Group / Multi-User Calling Signaling
    // ------------------------------------
    socket.on("invite-to-call", async (data: { userToInvite: string; callRoomId: string; isVideo: boolean; chatId?: string }) => {
      try {
        const { userToInvite, callRoomId, isVideo, chatId } = data;
        const callerUser = await User.findById(userId).select("name avatar");
        console.log(`[Group Call] 👥 ${callerUser?.name} invited ${userToInvite} to room ${callRoomId}`);

        io.to(`user:${userToInvite}`).emit("incoming-call", {
          from: userId,
          caller: {
            _id: userId,
            name: callerUser?.name || "Caller",
            avatar: callerUser?.avatar || "",
          },
          isVideo,
          callRoomId,
          chatId,
          isGroup: true,
        });
      } catch (err: any) {
        console.error("[Group Call] Error inviting user:", err.message);
      }
    });

    socket.on("join-group-call", async (data: { callRoomId: string }) => {
      try {
        const { callRoomId } = data;
        socket.join(`call-room:${callRoomId}`);
        const joiningUser = await User.findById(userId).select("name avatar");

        console.log(`[Group Call] 🟢 ${joiningUser?.name} joined group call room ${callRoomId}`);

        // Notify other participants in the room that a new peer joined
        socket.to(`call-room:${callRoomId}`).emit("new-peer-joined", {
          peerId: userId,
          peerUser: {
            _id: userId,
            name: joiningUser?.name || "User",
            avatar: joiningUser?.avatar || "",
          },
        });
      } catch (err: any) {
        console.error("[Group Call] Error joining room:", err.message);
      }
    });

    socket.on("group-peer-offer", (data: { to: string; offer: any; fromUser: any }) => {
      io.to(`user:${data.to}`).emit("group-peer-offer", {
        from: userId,
        offer: data.offer,
        fromUser: data.fromUser,
      });
    });

    socket.on("group-peer-answer", (data: { to: string; answer: any }) => {
      io.to(`user:${data.to}`).emit("group-peer-answer", {
        from: userId,
        answer: data.answer,
      });
    });

    socket.on("group-ice-candidate", (data: { to: string; candidate: any }) => {
      io.to(`user:${data.to}`).emit("group-ice-candidate", {
        from: userId,
        candidate: data.candidate,
      });
    });

    socket.on("leave-group-call", (data: { callRoomId: string }) => {
      socket.leave(`call-room:${data.callRoomId}`);
      socket.to(`call-room:${data.callRoomId}`).emit("peer-left", { peerId: userId });
      console.log(`[Group Call] 🔴 ${userId} left group call ${data.callRoomId}`);
    });

    // ==========================================
    // 🔊 VOICE ROOMS (Drop-in audio like Discord)
    // ==========================================
    socket.on("get-voice-room", (data: { chatId: string }) => {
      const room = voiceRooms.get(data.chatId);
      const participants = room ? Array.from(room.values()) : [];
      socket.emit("voice-room-state", { chatId: data.chatId, participants });
    });

    socket.on("join-voice-room", async (data: { chatId: string }) => {
      try {
        const { chatId } = data;
        let room = voiceRooms.get(chatId);
        if (!room) {
          room = new Map();
          voiceRooms.set(chatId, room);
        }

        const userDoc = await User.findById(userId).select("name avatar");
        const member: VoiceRoomMember = {
          userId,
          name: userDoc?.name || socket.data.userName || "User",
          avatar: userDoc?.avatar || socket.data.userAvatar || "",
          socketId: socket.id,
          isMuted: false,
          isSpeaking: false,
        };

        room.set(userId, member);
        socket.join(`voice-room:${chatId}`);

        console.log(`[Voice Room] 🔊 ${member.name} joined voice room in chat ${chatId}`);

        const participants = Array.from(room.values());

        // Send current members to the joining user
        socket.emit("voice-room-joined", { chatId, participants });

        // Notify other room members about the new peer
        socket.to(`voice-room:${chatId}`).emit("voice-peer-joined", {
          chatId,
          member,
        });

        // Broadcast active voice room state to everyone in chat room (for banner/widget)
        io.to(`chat:${chatId}`).emit("voice-room-state", {
          chatId,
          participants,
        });
      } catch (err: any) {
        console.error("[Voice Room] Error joining voice room:", err.message);
      }
    });

    socket.on("leave-voice-room", (data: { chatId: string }) => {
      const { chatId } = data;
      const room = voiceRooms.get(chatId);
      if (room && room.has(userId)) {
        room.delete(userId);
        socket.leave(`voice-room:${chatId}`);

        console.log(`[Voice Room] 🔴 ${userId} left voice room in chat ${chatId}`);

        const participants = Array.from(room.values());
        socket.to(`voice-room:${chatId}`).emit("voice-peer-left", { chatId, peerId: userId });
        io.to(`chat:${chatId}`).emit("voice-room-state", { chatId, participants });

        if (room.size === 0) {
          voiceRooms.delete(chatId);
        }
      }
    });

    socket.on("voice-state-update", (data: { chatId: string; isMuted: boolean; isSpeaking: boolean }) => {
      const { chatId, isMuted, isSpeaking } = data;
      const room = voiceRooms.get(chatId);
      if (room && room.has(userId)) {
        const member = room.get(userId)!;
        member.isMuted = !!isMuted;
        member.isSpeaking = !!isSpeaking;
        socket.to(`voice-room:${chatId}`).emit("voice-member-updated", {
          chatId,
          userId,
          isMuted,
          isSpeaking,
        });
      }
    });

    // ==========================================
    // 📋 TASKS SOCKET SYNC
    // ==========================================
    socket.on("task-created", (data: { chatId: string; task: any }) => {
      socket.to(`chat:${data.chatId}`).emit("task-created", data);
    });

    socket.on("task-updated", (data: { chatId: string; task: any }) => {
      socket.to(`chat:${data.chatId}`).emit("task-updated", data);
    });

    socket.on("task-deleted", (data: { chatId: string; taskId: string }) => {
      socket.to(`chat:${data.chatId}`).emit("task-deleted", data);
    });

    socket.on("disconnect", async () => {
      console.log(`[Socket] 🔴 User disconnected: ${userId}`);
      onlineUsers.delete(userId);

      // Clean up any voice rooms user was in
      for (const [chatId, room] of voiceRooms.entries()) {
        if (room.has(userId)) {
          room.delete(userId);
          const participants = Array.from(room.values());
          io.to(`voice-room:${chatId}`).emit("voice-peer-left", { chatId, peerId: userId });
          io.to(`chat:${chatId}`).emit("voice-room-state", { chatId, participants });
          if (room.size === 0) voiceRooms.delete(chatId);
        }
      }

      // Clean up any active call this user was participating in
      for (const [key, call] of activeCalls.entries()) {
        if (call.callerId === userId || call.receiverId === userId) {
          const otherId = call.callerId === userId ? call.receiverId : call.callerId;
          io.to(`user:${otherId}`).emit("call-ended", { from: userId });
          const status = call.answered ? "completed" : "missed";
          const dur = call.startTime ? Math.max(1, Math.round((Date.now() - call.startTime) / 1000)) : 0;
          await recordCallHistory(call, status, dur);
          activeCalls.delete(key);
        }
      }

      // notify others
      socket.broadcast.emit("user-offline", { userId });
    });
  });

  return io;
};
