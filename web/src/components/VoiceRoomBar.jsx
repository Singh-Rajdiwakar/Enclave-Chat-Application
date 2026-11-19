import {
  MicIcon,
  MicOffIcon,
  Volume2Icon,
  VolumeXIcon,
  PhoneOffIcon,
  RadioIcon,
  UsersIcon,
} from "lucide-react";
import { useVoiceRoomStore } from "../lib/voiceRoomStore";

export function VoiceRoomBar({ chatId, currentUser, isGroup }) {
  const {
    isJoined,
    activeChatId,
    participants,
    roomParticipantsByChat,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleDeafen,
    isMuted,
    isDeafened,
  } = useVoiceRoomStore();

  const isCurrentChatVoiceActive = isJoined && activeChatId === chatId;
  const roomMembers = isCurrentChatVoiceActive
    ? participants
    : roomParticipantsByChat.get(chatId) || [];

  const hasActiveRoom = roomMembers.length > 0;

  // Banner at top of group chat when not joined
  if (!isCurrentChatVoiceActive) {
    if (!isGroup && !hasActiveRoom) return null;

    return (
      <div className="mx-6 my-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500/10 via-[#11131A] to-indigo-500/10 border border-emerald-500/25 flex items-center justify-between backdrop-blur-md animate-in fade-in z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <RadioIcon className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text)]">Voice Room</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                DISCORD AUDIO
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              {hasActiveRoom
                ? `${roomMembers.length} active (${roomMembers.map((m) => m.name.split(" ")[0]).join(", ")})`
                : "Drop-in anytime without ringing"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => joinRoom(chatId, currentUser)}
          className="h-7 px-3 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
        >
          <RadioIcon className="w-3.5 h-3.5" />
          <span>Join Room</span>
        </button>
      </div>
    );
  }

  // Active floating Discord-style voice bar at bottom
  return (
    <div className="mx-6 mb-2 px-4 py-2.5 rounded-2xl bg-[#161922]/95 border border-emerald-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between z-30 animate-in slide-in-from-bottom-2">
      {/* Members avatars with speaking glow */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-emerald-400 font-mono">CONNECTED</span>
        </div>

        <div className="flex items-center -space-x-1.5">
          {participants.map((member) => (
            <div key={member.userId} className="relative group" title={member.name}>
              <img
                src={member.avatar || "https://avatar.iran.liara.run/public"}
                alt={member.name}
                className={`w-7 h-7 rounded-full object-cover border-2 transition-all ${
                  member.isSpeaking
                    ? "border-emerald-400 ring-2 ring-emerald-400/50 scale-105"
                    : member.isMuted
                    ? "border-rose-500/50 opacity-60"
                    : "border-[#161922]"
                }`}
              />
              {member.isMuted && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px]">
                  <MicOffIcon className="w-2 h-2" />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls: Mute, Deafen, Disconnect */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleMute}
          className={`h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-mono transition cursor-pointer ${
            isMuted
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOffIcon className="w-3.5 h-3.5" /> : <MicIcon className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isMuted ? "Muted" : "Mute"}</span>
        </button>

        <button
          type="button"
          onClick={toggleDeafen}
          className={`h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-mono transition cursor-pointer ${
            isDeafened
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]"
          }`}
          title={isDeafened ? "Undeafen" : "Deafen"}
        >
          {isDeafened ? <VolumeXIcon className="w-3.5 h-3.5" /> : <Volume2Icon className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isDeafened ? "Deafened" : "Deafen"}</span>
        </button>

        <button
          type="button"
          onClick={leaveRoom}
          className="h-7 px-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-sm"
          title="Disconnect from voice room"
        >
          <PhoneOffIcon className="w-3 h-3" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
}
