import { useSocketStore } from "../lib/socket";
import { useCallStore } from "../lib/callStore";
import { PhoneIcon, VideoIcon, PaletteIcon, UsersIcon, LockIcon, CheckSquareIcon, ArrowLeftIcon } from "lucide-react";
import { useTasks } from "../hooks/useTasks";

export function ChatHeader({
  participant,
  chatId,
  onOpenTheme,
  isE2EEActive,
  onToggleE2EE,
  onToggleTasks,
  isTyping: propIsTyping,
  onBack,
}) {
  const { onlineUsers, typingUsers } = useSocketStore();
  const { startCall, callStatus } = useCallStore();
  const { data: tasks = [] } = useTasks(chatId);

  const pendingTasksCount = tasks.filter((t) => t.status !== "completed").length;

  const isGroup = !!participant?.isGroup;
  const isOnline = !isGroup && onlineUsers.has(participant?._id);
  // typingUsers stores { userId, userName } — check if the PARTICIPANT (not self) is typing in this chat
  const typingEntry = typingUsers.get(chatId);
  const isTyping = propIsTyping !== undefined ? propIsTyping : (typingEntry && typingEntry.userId?.toString() === participant?._id?.toString());
  const isCallBusy = callStatus !== "idle";

  return (
    <div className="h-16 px-4 sm:px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#11131A]/85 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {/* Mobile back button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--text)] border border-white/[0.06] transition cursor-pointer shrink-0"
            title="Back to chats"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
        )}
        <div className="relative shrink-0">
          <img
            src={participant?.avatar || "https://avatar.iran.liara.run/public"}
            className="w-10 h-10 rounded-full bg-white/[0.04] object-cover border border-white/[0.08]"
            alt=""
          />
          {isGroup ? (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#161922] border border-white/[0.1] rounded-full flex items-center justify-center text-[var(--accent)] text-[9px] shadow-xs">
              <UsersIcon className="w-2.5 h-2.5" />
            </span>
          ) : isOnline ? (
            <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent)] border-2 border-[#11131A]"></span>
            </span>
          ) : null}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm sm:text-base leading-tight text-[var(--text)] truncate">
              {participant?.name}
            </h2>
            {isGroup && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-[var(--muted)] border border-white/[0.06]">
                GROUP
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {isTyping ? (
              <span className="text-[var(--accent)] italic">typing...</span>
            ) : isGroup ? (
              `${participant?.membersCount || 2} members`
            ) : isOnline ? (
              <span className="text-[var(--accent)] font-medium">Online</span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* E2EE Secret Chat Toggle */}
        {!isGroup && onToggleE2EE && (
          <button
            type="button"
            onClick={onToggleE2EE}
            className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-mono border transition cursor-pointer ${
              isE2EEActive
                ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_12px_-2px_rgba(52,211,153,0.3)]"
                : "bg-white/[0.04] border-white/[0.06] text-[var(--muted)] hover:text-white"
            }`}
            title={isE2EEActive ? "End-to-End Encryption ON (AES-GCM 256)" : "Enable End-to-End Encryption"}
          >
            <LockIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isE2EEActive ? "E2EE ON" : "E2EE"}</span>
          </button>
        )}

        {/* Tasks Panel Button */}
        {onToggleTasks && (
          <button
            type="button"
            onClick={onToggleTasks}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-mono border transition cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-[var(--muted)] hover:text-white border-white/[0.06]"
            title="Chat Tasks & Reminders"
          >
            <CheckSquareIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Tasks</span>
            {pendingTasksCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-500/25 border border-purple-500/40 text-purple-300">
                {pendingTasksCount}
              </span>
            )}
          </button>
        )}

        {/* Theme Button */}
        {onOpenTheme && (
          <button
            type="button"
            onClick={onOpenTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--accent)] border border-white/[0.06] transition cursor-pointer"
            title="Theme Palette"
          >
            <PaletteIcon className="w-4 h-4" />
          </button>
        )}

        {/* Audio Call */}
        <button
          type="button"
          onClick={() => startCall(participant, false, chatId)}
          disabled={!participant || isCallBusy}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--text)] border border-white/[0.06] transition cursor-pointer disabled:opacity-40"
          title="Voice Call"
        >
          <PhoneIcon className="w-4 h-4" />
        </button>

        {/* Video Call */}
        <button
          type="button"
          onClick={() => startCall(participant, true, chatId)}
          disabled={!participant || isCallBusy}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--text)] border border-white/[0.06] transition cursor-pointer disabled:opacity-40"
          title="Video Call"
        >
          <VideoIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
