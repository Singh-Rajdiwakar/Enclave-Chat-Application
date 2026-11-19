import { useCallStore } from "../lib/callStore";
import { PhoneCallIcon, PhoneOffIcon, VideoIcon, PhoneIcon } from "lucide-react";

export function IncomingCallModal() {
  const { callStatus, caller, isVideo, isGroup, acceptCall, rejectCall } = useCallStore();

  if (callStatus !== "incoming" || !caller) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#11131A] border border-white/[0.08] w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center text-[var(--text)]">
        {/* Pulsing Avatar */}
        <div className="relative mb-4 mt-2">
          <div className="absolute -inset-2 rounded-full bg-[var(--accent)] opacity-40 blur-md animate-pulse" />
          <img
            src={caller.avatar || "https://avatar.iran.liara.run/public"}
            alt={caller.name}
            className="relative w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-xl"
          />
        </div>

        <h3 className="text-xl font-semibold mb-1 text-[var(--text)]">{caller.name}</h3>
        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5 mb-8 meta-mono">
          {isVideo ? (
            <>
              <VideoIcon className="w-3.5 h-3.5 text-[var(--accent)] animate-bounce" />
              {isGroup ? "Invited you to Group Video Call..." : "Incoming Video Call..."}
            </>
          ) : (
            <>
              <PhoneCallIcon className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              {isGroup ? "Invited you to Group Voice Call..." : "Incoming Voice Call..."}
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8 w-full">
          {/* Decline */}
          <button
            type="button"
            onClick={rejectCall}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
              <PhoneOffIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-[var(--muted)]">Decline</span>
          </button>

          {/* Accept */}
          <button
            type="button"
            onClick={acceptCall}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
              <PhoneIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-400 font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
