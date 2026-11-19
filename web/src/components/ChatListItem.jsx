import { formatTime } from "../lib/utils";
import { useSocketStore } from "../lib/socket";
import { UsersIcon } from "lucide-react";

export function ChatListItem({ chat, isActive, onClick, currentUserId }) {
  const { onlineUsers, typingUsers } = useSocketStore();
  const isGroup = !!chat.isGroup;
  const isOnline = !isGroup && onlineUsers.has(chat.participant?._id);
  const typingEntry = typingUsers.get(chat._id);
  const isTyping = typingEntry && (!currentUserId || typingEntry.userId?.toString() !== currentUserId?.toString());

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl w-full text-left transition-all duration-150 cursor-pointer group ${
        isActive
          ? "bg-white/[0.06] text-[var(--text)] shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2.5px] before:rounded-r before:bg-linear-to-b before:from-[var(--accent)] before:to-[var(--accent-2)]"
          : "hover:bg-white/[0.03] text-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      <div className="relative shrink-0">
        <img
          src={chat.participant?.avatar || "https://avatar.iran.liara.run/public"}
          className="w-10 h-10 rounded-full bg-white/[0.04] object-cover border border-white/[0.08]"
          alt=""
        />
        {isGroup ? (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--surface-raised)] border border-white/[0.1] rounded-full flex items-center justify-center text-[var(--accent)] text-[9px] shadow-xs">
            <UsersIcon className="w-2.5 h-2.5" />
          </span>
        ) : isOnline ? (
          <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent)] border-2 border-[#11131A]"></span>
          </span>
        ) : null}
      </div>

      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className={`text-sm font-medium truncate ${isActive ? "text-[var(--text)]" : "text-[var(--text)]/90"}`}>
              {chat.participant?.name || "Unknown"}
            </span>
            {isGroup && (
              <span className="text-[9px] font-mono px-1 rounded bg-white/[0.06] text-[var(--muted)] border border-white/[0.06]">
                GRP
              </span>
            )}
          </div>
          {chat.lastMessageAt && (
            <span className="meta-mono shrink-0 ml-1">
              {formatTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted)] truncate">
          {isTyping ? (
            <span className="text-[var(--accent)] italic">typing...</span>
          ) : chat.lastMessage?.messageType === "call" ? (
            `${chat.lastMessage?.callType === "video" ? "📹" : "📞"} ${chat.lastMessage?.text || "Call"}`
          ) : chat.lastMessage?.messageType === "image" ? (
            "📷 Photo"
          ) : chat.lastMessage?.messageType === "audio" ? (
            "🎙️ Voice note"
          ) : chat.lastMessage?.messageType === "file" ? (
            `📁 ${chat.lastMessage?.fileName || "Document"}`
          ) : (
            chat.lastMessage?.text || "No messages yet"
          )}
        </p>
      </div>
    </button>
  );
}
