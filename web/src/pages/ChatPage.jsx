import { UserButton } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useSocketStore } from "../lib/socket";
import { useSocketConnection } from "../hooks/useSocketConnection";
import {
  SparklesIcon,
  MessageSquareIcon,
  PlusIcon,
  UsersIcon,
  PaletteIcon,
  BookmarkIcon,
  PinIcon,
  PinOffIcon,
  Undo2Icon,
  CommandIcon,
} from "lucide-react";

import { useChats, useGetOrCreateChat, useCreateSelfChat, usePinnedMessages } from "../hooks/useChats";
import { useMessages } from "../hooks/useMessages";
import { ChatListItem } from "../components/ChatListItem";
import { ChatHeader } from "../components/ChatHeader";
import { MessageBubble } from "../components/MessageBubble";
import { ChatInput } from "../components/ChatInput";
import { ThreadPanel } from "../components/ThreadPanel";
import { TasksPanel } from "../components/TasksPanel";
import { VoiceRoomBar } from "../components/VoiceRoomBar";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useCreateTask } from "../hooks/useTasks";
import { useVoiceRoomStore } from "../lib/voiceRoomStore";
import { NewChatModal } from "../components/NewChatModal";
import { CreateGroupModal } from "../components/CreateGroupModal";
import { ChatThemeModal } from "../components/ChatThemeModal";
import { CreatePollModal } from "../components/CreatePollModal";
import { CommandPalette } from "../components/CommandPalette";
import { IncomingCallModal } from "../components/IncomingCallModal";
import { CallModal } from "../components/CallModal";
import { useCallStore } from "../lib/callStore";
import { getOrCreateKeyPair, importPublicKey, getDerivedAESKey, encryptText } from "../lib/crypto";
import api from "../lib/axios";

function ChatPage() {
  const { data: currentUser } = useCurrentUser();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get("chat");

  const [messageInput, setMessageInput] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // 📋 Chat Tasks slide-over state
  const [isTasksOpen, setIsTasksOpen] = useState(false);

  // 🧵 Slack-style Thread panel state
  const [activeThread, setActiveThread] = useState(null);

  // 📌 Pinned Message Jump state
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const highlightTimerRef = useRef(null);

  // 🔐 E2EE Secret Chat state
  const [isE2EEActive, setIsE2EEActive] = useState(false);
  const [sharedAesKey, setSharedAesKey] = useState(null);
  const [myKeyPair, setMyKeyPair] = useState(null);

  // Message Editing state
  const [editingMessage, setEditingMessage] = useState(null);

  // 5-second Undo Send state
  const [undoState, setUndoState] = useState(null);
  const undoTimerRef = useRef(null);

  // Initialize theme from storage
  useEffect(() => {
    const savedTheme = localStorage.getItem("enclave_tech_theme") || "indigo";
    document.documentElement.setAttribute("data-tech-theme", savedTheme);
  }, []);

  // Clear thread when active chat changes
  useEffect(() => {
    setActiveThread(null);
  }, [activeChatId]);

  // 1. Initialize user's E2EE Keypair and register public key with server
  useEffect(() => {
    if (!currentUser) return;
    getOrCreateKeyPair().then(async (res) => {
      if (res) {
        setMyKeyPair(res.keyPair);
        try {
          await api.post("/users/public-key", {
            publicKey: JSON.stringify(res.publicJwk),
          });
        } catch (e) {
          console.warn("Could not sync public key with server:", e);
        }
      }
    });
  }, [currentUser]);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { socket, setTyping, sendMessage, markAsRead, typingUsers, deleteMessage, editMessage, pinMessage } =
    useSocketStore();
  const { initCallListeners, startCall, callStatus } = useCallStore();
  const { initVoiceRoomListeners, pollRoomState } = useVoiceRoomStore();

  useSocketConnection(activeChatId);

  useEffect(() => {
    if (socket) {
      initCallListeners();
      initVoiceRoomListeners();
    }
  }, [socket, initCallListeners, initVoiceRoomListeners]);

  useEffect(() => {
    if (activeChatId) {
      pollRoomState(activeChatId);
    }
  }, [activeChatId, pollRoomState]);

  const { data: chats = [], isLoading: chatsLoading } = useChats();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(activeChatId);
  const { data: pinnedMessages = [] } = usePinnedMessages(activeChatId);

  const startChatMutation = useGetOrCreateChat();
  const createSelfChatMutation = useCreateSelfChat();
  const createTaskMutation = useCreateTask(activeChatId);

  const handleMakeTask = (message) => {
    setIsTasksOpen(true);
    const title = message.text
      ? (message.text.length > 70 ? message.text.slice(0, 70) + "..." : message.text)
      : (message.fileName ? `Review file: ${message.fileName}` : "Task from chat");
    createTaskMutation.mutate({
      chatId: activeChatId,
      title,
      fromMessage: message._id,
    });
  };

  // Mark messages as read when chat is open or new messages arrive
  useEffect(() => {
    if (activeChatId && socket?.connected) {
      markAsRead(activeChatId);
    }
  }, [activeChatId, messages.length, socket?.connected, markAsRead]);

  // scroll to bottom when chat or messages changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, messages]);

  const handleStartChat = (participantId) => {
    startChatMutation.mutate(participantId, {
      onSuccess: (chat) => setSearchParams({ chat: chat._id }),
    });
  };

  const handleOpenSavedMessages = () => {
    createSelfChatMutation.mutate(undefined, {
      onSuccess: (chat) => setSearchParams({ chat: chat._id }),
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;

    if (!currentUser) return;
    if (!socket?.connected) return;

    // Handle Edit submission
    if (editingMessage) {
      editMessage(editingMessage._id, activeChatId, messageInput.trim());
      setEditingMessage(null);
      setMessageInput("");
      setTyping(activeChatId, false);
      return;
    }

    let text = messageInput.trim();

    // ⚡ Slash Commands Interceptor (/split, /remind, /task, /shrug, /tableflip)
    if (text.startsWith("/split ")) {
      const parts = text.slice(7).trim().split(/\s+/);
      const amount = parseFloat(parts[0]) || 0;
      const mentions = parts.slice(1);
      const memberCount = Math.max(mentions.length + 1, 2);
      const perPerson = amount > 0 ? (amount / memberCount).toFixed(0) : 0;
      text = `💸 Bill Split: ₹${amount}\n👥 With: ${mentions.length > 0 ? mentions.join(", ") : "Everyone"} (${memberCount} people)\n👉 ₹${perPerson} per person`;
    } else if (text.startsWith("/remind ")) {
      const rest = text.slice(8).trim();
      const firstSpace = rest.indexOf(" ");
      const duration = firstSpace > 0 ? rest.slice(0, firstSpace) : "soon";
      const note = firstSpace > 0 ? rest.slice(firstSpace + 1) : rest;
      text = `⏰ Reminder (${duration}): ${note}`;
      createTaskMutation.mutate({
        chatId: activeChatId,
        title: `Reminder: ${note} (${duration})`,
      });
    } else if (text.startsWith("/task ")) {
      const taskTitle = text.slice(6).trim();
      createTaskMutation.mutate({
        chatId: activeChatId,
        title: taskTitle,
      });
      text = `📋 New Task: ${taskTitle}`;
    } else if (text === "/shrug") {
      text = "¯\\_(ツ)_/¯";
    } else if (text === "/tableflip") {
      text = "(╯°□°)╯︵ ┻━┻";
    }

    let payload = { text, messageType: "text" };

    // Encrypt with shared AES key if E2EE mode is ON
    if (isE2EEActive && sharedAesKey) {
      const enc = await encryptText(text, sharedAesKey);
      if (enc) {
        payload = {
          text: enc.ciphertext,
          messageType: "text",
          isEncrypted: true,
          encryptionIv: enc.iv,
        };
      }
    }

    const tempId = sendMessage(activeChatId, payload, currentUser);
    setMessageInput("");
    setTyping(activeChatId, false);

    // Trigger 5-second Undo Send Toast
    if (tempId) {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      let countdown = 5;
      setUndoState({ messageId: tempId, chatId: activeChatId, countdown });

      undoTimerRef.current = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(undoTimerRef.current);
          setUndoState(null);
        } else {
          setUndoState((prev) => (prev ? { ...prev, countdown } : null));
        }
      }, 1000);
    }
  };

  const handleUndoSend = () => {
    if (undoState) {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      deleteMessage(undoState.messageId, undoState.chatId);
      setUndoState(null);
    }
  };

  const handleSendCustom = (payload) => {
    if (!activeChatId || !currentUser || !socket?.connected) return;
    sendMessage(activeChatId, payload, currentUser);
  };

  const handleCreatePoll = (pollData) => {
    if (!activeChatId || !currentUser || !socket?.connected) return;
    sendMessage(
      activeChatId,
      {
        messageType: "poll",
        text: `📊 Poll: ${pollData.question}`,
        poll: pollData,
      },
      currentUser
    );
  };

  const handleStartEdit = (message) => {
    setEditingMessage(message);
    setMessageInput(message.text || "");
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageInput("");
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (!activeChatId) return;

    setTyping(activeChatId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(activeChatId, false);
    }, 2000);
  };

  const activeChat = chats.find((c) => c._id === activeChatId);

  // 📌 Jump to pinned message with smooth scroll + glow highlight
  const handleJumpToMessage = (messageId) => {
    const el = document.getElementById("msg-" + messageId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => setHighlightedMessageId(null), 2500);
    }
  };

  // 📱 Mobile back button — clears active chat
  const handleBack = () => setSearchParams({});

  // 2. Derive shared AES key with partner when active chat changes
  useEffect(() => {
    if (!activeChat || activeChat.participant?.isGroup || !myKeyPair) {
      setSharedAesKey(null);
      return;
    }

    const partnerId = activeChat.participant?._id;
    if (!partnerId) return;

    api
      .get(`/users/${partnerId}/public-key`)
      .then(async (res) => {
        if (res.data?.publicKey) {
          const partnerPub = await importPublicKey(res.data.publicKey);
          if (partnerPub) {
            const aes = await getDerivedAESKey(myKeyPair.privateKey, partnerPub, partnerId);
            setSharedAesKey(aes);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch partner public key for E2EE:", err);
      });
  }, [activeChatId, activeChat?.participant?._id, myKeyPair]);

  // Check if other participant is typing in this chat
  // Use string comparison to avoid ObjectId vs string mismatch causing self-typing leak
  const typingUser = typingUsers.get(activeChatId);
  const myIdStr = currentUser?._id?.toString();
  const isOtherTyping = typingUser && typingUser.userId?.toString() !== myIdStr;

  // Active pinned message (latest one)
  const activePinnedMessage = pinnedMessages[0];

  return (
    <div className="h-screen bg-[#0A0B10] text-[#E6E8EF] flex overflow-hidden">
      {/* Sidebar — fixed width, shrink-0 prevents squish; hidden on mobile when chat open */}
      <div
        className={`w-80 shrink-0 border-r border-white/[0.08] flex flex-col bg-[#11131A] transition-transform duration-200 ${
          activeChatId ? "hidden md:flex" : "flex w-full md:w-80"
        }`}
      >
        {/* HEADER */}
        <div className="p-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-3.5">
            <Link to="/chat" className="flex items-center gap-2 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-xs transition duration-150 group-hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                }}
              >
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-base tracking-tight text-[var(--text)]">Enclave</span>
            </Link>

            <div className="flex items-center gap-1.5">
              {/* Command Palette Button (Ctrl+K) */}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="h-7 px-2 rounded-lg flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--text)] border border-white/[0.06] transition cursor-pointer text-[10px] font-mono"
                title="Command Palette (Ctrl+K)"
              >
                <CommandIcon className="w-3 h-3" />
                <span>K</span>
              </button>

              {/* Theme Palette */}
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--accent)] border border-white/[0.06] transition cursor-pointer"
                title="Theme Palette"
              >
                <PaletteIcon className="w-3.5 h-3.5" />
              </button>
              <UserButton />
            </div>
          </div>

          {/* Saved Messages (Note to self) Shortcut Button */}
          <button
            type="button"
            onClick={handleOpenSavedMessages}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-[var(--text)] transition cursor-pointer mb-2.5 group"
          >
            <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center group-hover:scale-105 transition">
              <BookmarkIcon className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="flex-1 text-left font-medium">Saved Messages</span>
            <span className="meta-mono text-[10px] text-[var(--muted)]">Self</span>
          </button>

          {/* Action buttons: New Chat + New Group */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-[var(--text)] border border-white/[0.08] transition cursor-pointer active:scale-95"
            >
              <PlusIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>New Chat</span>
            </button>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium bg-white/[0.03] hover:bg-white/[0.07] text-[var(--muted)] hover:text-[var(--text)] border border-white/[0.06] transition cursor-pointer active:scale-95"
            >
              <UsersIcon className="w-3.5 h-3.5" />
              <span>New Group</span>
            </button>
          </div>
        </div>

        {/* chat list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {chatsLoading && (
            <div className="flex items-center justify-center py-10">
              <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-[var(--accent)] animate-spin" />
            </div>
          )}

          {chats.length === 0 && !chatsLoading && <NoConversationsUI />}

          <div className="flex flex-col gap-1">
            {chats.map((chat) => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                isActive={activeChatId === chat._id}
                onClick={() => setSearchParams({ chat: chat._id })}
                currentUserId={currentUser?._id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* main chat area — full width on mobile when chat open */}
      <div className={`flex-1 flex flex-col relative tech-grid-pattern bg-[#0A0B10] min-w-0 ${activeChatId ? "flex" : "hidden md:flex"}`}>
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none z-0 transition-colors duration-500"
          style={{ background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)" }}
        />

        {activeChatId && activeChat ? (
          <>
            <ChatHeader
              participant={activeChat.participant}
              chatId={activeChatId}
              onOpenTheme={() => setIsThemeModalOpen(true)}
              isE2EEActive={isE2EEActive}
              onToggleE2EE={() => setIsE2EEActive((prev) => !prev)}
              onToggleTasks={() => setIsTasksOpen((prev) => !prev)}
              isTyping={isOtherTyping}
              onBack={handleBack}
            />

            {/* 🎙️ DISCORD-STYLE DROP-IN VOICE ROOM BAR */}
            <VoiceRoomBar
              chatId={activeChatId}
              currentUser={currentUser}
              isGroup={activeChat.participant?.isGroup}
            />

            {/* 📌 PINNED MESSAGE BANNER — click to jump to that message */}
            {activePinnedMessage && (
              <div className="h-10 px-4 bg-[#11131A]/95 border-b border-white/[0.08] backdrop-blur-md flex items-center justify-between text-xs text-[var(--text)] z-20">
                <button
                  type="button"
                  onClick={() => handleJumpToMessage(activePinnedMessage._id)}
                  className="flex items-center gap-2 truncate pr-2 hover:opacity-80 transition cursor-pointer flex-1 min-w-0 text-left group"
                  title="Click to jump to pinned message"
                >
                  <PinIcon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 fill-current" />
                  <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider shrink-0">
                    PINNED:
                  </span>
                  <span className="truncate text-white/90 group-hover:text-white transition">
                    {activePinnedMessage.text || activePinnedMessage.fileName || "Media attachment"}
                  </span>
                  <span className="text-[9px] font-mono text-[var(--accent)] shrink-0 opacity-70 group-hover:opacity-100">↑ jump</span>
                </button>
                <button
                  type="button"
                  onClick={() => pinMessage(activePinnedMessage._id, activeChatId, false)}
                  className="p-1 rounded text-[var(--muted)] hover:text-white transition cursor-pointer shrink-0"
                  title="Unpin message"
                >
                  <PinOffIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 z-10 relative">
              {messagesLoading && (
                <div className="flex items-center justify-center h-full">
                  <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-[var(--accent)] animate-spin" />
                </div>
              )}

              {messages.length === 0 && !messagesLoading && <NoMessagesUI />}

              {messages.length > 0 &&
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    currentUser={currentUser}
                    onEdit={handleStartEdit}
                    onOpenThread={(threadMsg) => setActiveThread(threadMsg)}
                    onMakeTask={handleMakeTask}
                    sharedAesKey={sharedAesKey}
                    isHighlighted={highlightedMessageId === msg._id}
                  />
                ))}

              <div ref={messagesEndRef} />
            </div>

            {/* 💬 REALTIME TYPING INDICATOR (Directly above input bar!) */}
            {isOtherTyping && (
              <div className="px-6 py-2 flex items-center gap-2 text-xs font-mono text-[var(--accent)] bg-[#0A0B10]/90 backdrop-blur-md border-t border-white/[0.04] animate-in fade-in duration-150 z-20">
                <span className="flex gap-1 items-center px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.3s]" />
                </span>
                <span className="text-[var(--text)]/85 font-mono text-xs">
                  <span className="text-[var(--accent)] font-semibold">
                    {typingUser?.userName || activeChat?.participant?.name || "Someone"}
                  </span>{" "}
                  is typing...
                </span>
              </div>
            )}

            {/* CHAT INPUT BAR */}
            <ChatInput
              value={messageInput}
              onChange={handleTyping}
              onSubmit={handleSend}
              disabled={!messageInput.trim()}
              onEmojiSelect={(emoji) => setMessageInput((prev) => prev + emoji)}
              onSendCustom={handleSendCustom}
              onOpenPoll={() => setIsPollModalOpen(true)}
              editingMessage={editingMessage}
              onCancelEdit={handleCancelEdit}
              isE2EEActive={isE2EEActive}
            />
          </>
        ) : (
          <NoChatSelectedUI />
        )}

        {/* ⏳ 5-SECOND UNDO SEND FLOATING TOAST */}
        {undoState && (
          <div className="absolute bottom-20 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#161922] border border-white/[0.12] shadow-2xl animate-in slide-in-from-bottom-2 text-xs text-white">
            <span>Message sent</span>
            <button
              type="button"
              onClick={handleUndoSend}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] font-medium hover:bg-[var(--accent)]/25 transition cursor-pointer"
            >
              <Undo2Icon className="w-3.5 h-3.5" />
              <span>Undo ({undoState.countdown}s)</span>
            </button>
          </div>
        )}
      </div>

      {/* 🧵 SLACK-STYLE RIGHT THREAD PANEL */}
      {activeThread && (
        <ThreadPanel
          parentMessage={activeThread}
          chatId={activeChatId}
          currentUser={currentUser}
          onClose={() => setActiveThread(null)}
        />
      )}

      {/* 📋 CHAT TASKS SLIDE-OVER PANEL */}
      {isTasksOpen && (
        <TasksPanel
          chatId={activeChatId}
          currentUser={currentUser}
          onClose={() => setIsTasksOpen(false)}
        />
      )}

      {/* Direct Chat Modal */}
      <NewChatModal
        onStartChat={handleStartChat}
        isPending={startChatMutation.isPending}
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />

      {/* 👥 Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(group) => {
          setSearchParams({ chat: group._id });
        }}
      />

      {/* 📊 Create Poll Modal */}
      <CreatePollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onCreatePoll={handleCreatePoll}
      />

      {/* ⌘K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        chats={chats}
        onSelectChat={(chatId) => setSearchParams({ chat: chatId })}
        onNewChat={() => setIsNewChatModalOpen(true)}
        onNewGroup={() => setIsCreateGroupOpen(true)}
        onOpenSavedMessages={handleOpenSavedMessages}
        onOpenPoll={() => setIsPollModalOpen(true)}
        onSwitchTheme={(themeId) => {
          document.documentElement.setAttribute("data-tech-theme", themeId);
          localStorage.setItem("enclave_tech_theme", themeId);
        }}
        onStartCall={(isVideo) => {
          if (activeChat) startCall(activeChat.participant, isVideo, activeChatId);
        }}
        activeChat={activeChat}
      />

      {/* 🎨 Theme Selector Modal */}
      <ChatThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* 📞 Audio & Video Call Modals */}
      <IncomingCallModal />
      <CallModal />
    </div>
  );
}
export default ChatPage;

function NoConversationsUI() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3 text-[var(--muted)]">
        <MessageSquareIcon className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-[var(--text)]">No conversations</p>
      <p className="text-xs text-[var(--muted)] mt-1">Start a new chat to begin</p>
    </div>
  );
}

function NoMessagesUI() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3 text-[var(--muted)]">
        <MessageSquareIcon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-[var(--text)]">No messages yet</p>
      <p className="text-xs text-[var(--muted)] mt-1 meta-mono">Send a message to start encrypted exchange</p>
    </div>
  );
}

function NoChatSelectedUI() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 z-10">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border border-white/[0.08]"
        style={{
          background: "linear-gradient(135deg, rgba(124,131,255,0.1), rgba(167,139,250,0.05))",
        }}
      >
        <SparklesIcon className="w-7 h-7 text-[var(--accent)]" />
      </div>
      <h2 className="text-xl font-semibold mb-1 text-[var(--text)]">Welcome to Enclave</h2>
      <p className="text-sm text-[var(--muted)] max-w-sm leading-relaxed">
        Select a conversation from the sidebar or press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono text-xs">Ctrl+K</kbd> to open Command Palette.
      </p>
    </div>
  );
}
