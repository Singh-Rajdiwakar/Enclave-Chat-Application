import { useState, useRef, useEffect } from "react";
import { XIcon, SendIcon, MessageSquareIcon } from "lucide-react";
import { formatTime } from "../lib/utils";
import { useThreadMessages } from "../hooks/useMessages";
import { useSocketStore } from "../lib/socket";
import { useQueryClient } from "@tanstack/react-query";

export function ThreadPanel({ parentMessage, chatId, currentUser, onClose }) {
  const [replyInput, setReplyInput] = useState("");
  const repliesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: threadData, isLoading } = useThreadMessages(parentMessage?._id);
  const { sendMessage, socket, threadTypingUsers, setThreadTyping } = useSocketStore();

  const replies = threadData?.replies || [];
  const parent = threadData?.parent || parentMessage;

  // Check if other participant is typing in this specific thread
  const threadTypingEntry = threadTypingUsers.get(parentMessage?._id);
  const myIdStr = currentUser?._id?.toString();
  const isOtherThreadTyping =
    threadTypingEntry && threadTypingEntry.userId?.toString() !== myIdStr;

  // Auto-scroll to bottom of thread on new reply or when typing appears
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length, isOtherThreadTyping]);

  // Join socket room for this thread and listen for real-time replies
  useEffect(() => {
    if (!socket || !parentMessage?._id) return;

    socket.emit("join-thread", parentMessage._id);

    return () => {
      socket.emit("leave-thread", parentMessage._id);
      clearTimeout(typingTimeoutRef.current);
      if (chatId) {
        setThreadTyping(parentMessage._id, chatId, false);
      }
    };
  }, [socket, parentMessage?._id, chatId, setThreadTyping]);

  if (!parentMessage) return null;

  const handleReplyChange = (e) => {
    setReplyInput(e.target.value);
    if (!parentMessage?._id || !chatId) return;

    setThreadTyping(parentMessage._id, chatId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setThreadTyping(parentMessage._id, chatId, false);
    }, 2000);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !chatId) return;

    // Capture text, clear input immediately (prevents double-send on Enter spam)
    const textToSend = replyInput.trim();
    setReplyInput("");

    // Clear typing timeout and indicator
    clearTimeout(typingTimeoutRef.current);
    setThreadTyping(parentMessage._id, chatId, false);

    // Send via socket — real message will arrive via "new-message" event
    // which removes all temp entries and adds the real one (no optimistic needed here)
    sendMessage(
      chatId,
      {
        text: textToSend,
        messageType: "text",
        parentId: parentMessage._id,
      },
      currentUser
    );
  };

  return (
    <div className="w-84 sm:w-96 border-l border-white/[0.08] bg-[#11131A] flex flex-col h-full z-30 animate-in slide-in-from-right-3 duration-200">
      {/* HEADER */}
      <div className="h-16 px-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
            <MessageSquareIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] leading-tight">Thread</h3>
            <p className="meta-mono text-[10px] text-[var(--muted)]">
              {isOtherThreadTyping ? (
                <span className="text-[var(--accent)] italic">typing...</span>
              ) : (
                `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.06] transition cursor-pointer"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ROOT / PARENT MESSAGE CARD */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <img
              src={parent?.sender?.avatar || "https://avatar.iran.liara.run/public"}
              alt=""
              className="w-7 h-7 rounded-full object-cover border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-[var(--text)] truncate block">
                {parent?.sender?.name || "User"}
              </span>
              <span className="meta-mono text-[10px] text-[var(--muted)]">
                {formatTime(parent?.createdAt)}
              </span>
            </div>
          </div>
          <p className="text-sm text-[var(--text)]/90 leading-relaxed whitespace-pre-wrap break-words">
            {parent?.text || parent?.fileName || "Media message"}
          </p>
        </div>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-white/[0.06] flex-1" />
          <span className="meta-mono text-[10px] text-[var(--muted)] uppercase tracking-wider">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </span>
          <div className="h-px bg-white/[0.06] flex-1" />
        </div>

        {/* REPLIES LIST */}
        {isLoading ? (
          <div className="py-8 text-center">
            <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-[var(--accent)] animate-spin inline-block" />
          </div>
        ) : replies.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--muted)] font-mono">
            No replies yet. Start the thread conversation!
          </div>
        ) : (
          replies.map((reply) => {
            const isMe = reply.sender?._id === currentUser?._id;
            return (
              <div key={reply._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}>
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[10px] font-medium text-[var(--muted)]">
                    {isMe ? "You" : reply.sender?.name}
                  </span>
                  <span className="meta-mono text-[9px] text-[var(--muted)] opacity-60">
                    {formatTime(reply.createdAt)}
                  </span>
                </div>
                <div
                  className={`px-3 py-2 rounded-xl text-xs max-w-[85%] ${
                    isMe
                      ? "msg-me"
                      : "bg-white/[0.04] border border-white/[0.08] text-[var(--text)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{reply.text}</p>
                </div>
              </div>
            );
          })
        )}

        <div ref={repliesEndRef} />
      </div>

      {/* 🧵 THREAD TYPING INDICATOR */}
      {isOtherThreadTyping && (
        <div className="px-4 py-1.5 flex items-center gap-2 text-xs font-mono text-[var(--accent)] bg-white/[0.03] border-t border-white/[0.06] animate-in fade-in duration-150">
          <span className="flex gap-1 items-center px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.3s]" />
          </span>
          <span className="text-[11px] text-[var(--text)]/85">
            <span className="text-[var(--accent)] font-semibold">{threadTypingEntry?.userName || "Someone"}</span> is typing in thread...
          </span>
        </div>
      )}

      {/* THREAD REPLY INPUT */}
      <div className="p-3 border-t border-white/[0.08] bg-white/[0.02]">
        <form onSubmit={handleSendReply} className="flex items-center gap-2">
          <input
            type="text"
            value={replyInput}
            onChange={handleReplyChange}
            placeholder="Reply in thread..."
            className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-[var(--accent)] rounded-xl text-xs text-[var(--text)] placeholder:text-[var(--muted)] px-3 py-2 outline-none transition"
            autoFocus
          />
          <button
            type="submit"
            disabled={!replyInput.trim()}
            className="send-btn h-8 px-3 rounded-lg flex items-center justify-center cursor-pointer transition disabled:opacity-40"
            title="Send reply"
          >
            <SendIcon className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
