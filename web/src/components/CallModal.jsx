import { useEffect, useRef } from "react";
import { useCallStore } from "../lib/callStore";
import { AddParticipantModal } from "./AddParticipantModal";
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneOffIcon,
  PhoneCallIcon,
  MonitorIcon,
  UserPlusIcon,
} from "lucide-react";

function formatDuration(sec) {
  const mins = Math.floor(sec / 60);
  const remaining = Math.floor(sec % 60);
  return `${mins < 10 ? "0" : ""}${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
}

function PeerVideoCard({ peer, isVideo }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [peer.stream]);

  return (
    <div className="relative w-full h-full min-h-[180px] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg">
      {isVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          onLoadedMetadata={(e) => e.target.play().catch(() => {})}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative mb-2">
            <div className="absolute -inset-1 rounded-full bg-[var(--accent)] opacity-30 blur-md animate-pulse" />
            <img
              src={peer.user?.avatar || "https://avatar.iran.liara.run/public"}
              alt={peer.user?.name}
              className="relative w-20 h-20 rounded-full border-2 border-white/20 object-cover shadow-xl"
            />
          </div>
          <h5 className="text-white font-medium text-sm">{peer.user?.name || "Participant"}</h5>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="truncate max-w-[130px]">{peer.user?.name || "Participant"}</span>
      </div>
    </div>
  );
}

export function CallModal() {
  const {
    callStatus,
    partner,
    isVideo,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    duration,
    peers = [],
    isAddModalOpen,
    setAddModalOpen,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => {
        console.warn("[CallModal] Remote video play error:", err);
      });
    }
  }, [remoteStream]);

  if (callStatus !== "calling" && callStatus !== "connected") return null;

  const isConnected = callStatus === "connected";
  const isGroupCall = peers.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 select-none animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl h-[90vh] max-h-[800px] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* TOP STATUS BAR */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 sm:p-6 flex items-center justify-between bg-linear-to-b from-black/75 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3 overflow-hidden">
                <img
                  src={partner?.avatar || "https://avatar.iran.liara.run/public"}
                  alt={partner?.name}
                  className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                />
                {peers.map((p) => (
                  <img
                    key={p.peerId}
                    src={p.user?.avatar || "https://avatar.iran.liara.run/public"}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-neutral-900 object-cover"
                  />
                ))}
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm sm:text-base leading-tight">
                  {isGroupCall ? `Group Call (${peers.length + 2} people)` : partner?.name || "User"}
                </h4>
                <p className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
                  {isConnected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {formatDuration(duration)}
                    </>
                  ) : (
                    <>
                      <PhoneCallIcon className="w-3.5 h-3.5 text-[var(--accent)] animate-bounce" />
                      Calling...
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Add Person Button on Top */}
            {isConnected && (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="btn btn-sm bg-white/10 hover:bg-white/20 text-white rounded-xl gap-1.5 border border-white/10 cursor-pointer transition shadow"
                title="Add person to call"
              >
                <UserPlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">Add Person</span>
              </button>
            )}
          </div>

          {/* MAIN DISPLAY AREA */}
          <div className="flex-1 relative flex items-center justify-center bg-neutral-950 overflow-hidden">
            {/* A. MULTI-USER GROUP GRID VIEW (2+ Participants) */}
            {isGroupCall ? (
              <div
                className={`w-full h-full p-4 sm:p-6 pt-20 pb-24 grid gap-3 ${
                  peers.length === 1
                    ? "grid-cols-1 sm:grid-cols-3"
                    : peers.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-2"
                }`}
              >
                {/* 1. Initial Partner Card */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg">
                  {isVideo && remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <img
                        src={partner?.avatar || "https://avatar.iran.liara.run/public"}
                        alt={partner?.name}
                        className="w-20 h-20 rounded-full border-2 border-white/20 object-cover mb-2"
                      />
                      <h5 className="text-white text-sm font-medium">{partner?.name}</h5>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="truncate max-w-[130px]">{partner?.name}</span>
                  </div>
                </div>

                {/* 2. Added Group Peers */}
                {peers.map((peer) => (
                  <PeerVideoCard key={peer.peerId} peer={peer} isVideo={isVideo} />
                ))}

                {/* 3. Local User Card in Grid */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                    className={`w-full h-full object-cover ${isCameraOff ? "hidden" : ""}`}
                  />
                  {isCameraOff && (
                    <div className="flex flex-col items-center justify-center text-white/50 text-xs">
                      <VideoOffIcon className="w-8 h-8 mb-1 opacity-70" />
                      <span>Camera Off</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>You {isMicMuted && "(Muted)"}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* B. 1-ON-1 STANDARD VIEW */
              isVideo ? (
                <>
                  {/* Remote Video Stream */}
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                      <div className="relative mb-4">
                        <div className="absolute -inset-2 rounded-full bg-[var(--accent)] opacity-40 blur-lg animate-pulse" />
                        <img
                          src={partner?.avatar || "https://avatar.iran.liara.run/public"}
                          alt={partner?.name}
                          className="relative w-28 h-28 rounded-full object-cover border-4 border-white/10 shadow-2xl"
                        />
                      </div>
                      <h3 className="text-white text-lg font-medium">{partner?.name}</h3>
                      <p className="text-white/60 text-sm mt-1">
                        {isConnected ? "Waiting for video stream..." : "Ringing..."}
                      </p>
                    </div>
                  )}

                  {/* Local Video Stream (Picture-in-Picture) */}
                  <div className="absolute bottom-24 right-4 sm:right-6 w-32 sm:w-44 aspect-3/4 sm:aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-neutral-900 z-10">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                      className={`w-full h-full object-cover ${isCameraOff ? "hidden" : ""}`}
                    />
                    {isCameraOff && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-white/50 text-xs">
                        <VideoOffIcon className="w-6 h-6 mb-1 opacity-70" />
                        <span>Camera Off</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Audio Call UI */
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="relative mb-6">
                    <div className="absolute -inset-3 rounded-full bg-[var(--accent)] opacity-30 blur-xl animate-pulse" />
                    <img
                      src={partner?.avatar || "https://avatar.iran.liara.run/public"}
                      alt={partner?.name}
                      className="relative w-36 h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                    />
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-1">{partner?.name}</h3>
                  <p className="text-white/70 text-sm font-mono tracking-wider">
                    {isConnected ? formatDuration(duration) : "Calling..."}
                  </p>

                  {/* Audio visualizer effect */}
                  {isConnected && (
                    <div className="flex items-center gap-1.5 mt-8 h-8">
                      <span className="w-1.5 h-4 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-8 bg-[var(--accent-2)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-6 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.4s]" />
                      <span className="w-1.5 h-10 bg-[var(--accent-2)] rounded-full animate-bounce" />
                      <span className="w-1.5 h-5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.2s]" />
                      <span className="w-1.5 h-7 bg-[var(--accent-2)] rounded-full animate-bounce [animation-delay:-0.35s]" />
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* BOTTOM CONTROLS BAR */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-5 flex items-center justify-center gap-4 sm:gap-5 bg-linear-to-t from-black/80 to-transparent">
            {/* Mute Mic Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMicMuted
                  ? "bg-error text-error-content shadow-lg"
                  : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
              }`}
              title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMicMuted ? <MicOffIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-error text-error-content flex items-center justify-center shadow-2xl transition hover:scale-105 active:scale-95 cursor-pointer"
              title="End Call"
            >
              <PhoneOffIcon className="w-6 h-6" />
            </button>

            {/* Camera Toggle (for video calls) */}
            {isVideo && (
              <button
                type="button"
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isCameraOff
                    ? "bg-error text-error-content shadow-lg"
                    : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
                }`}
                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isCameraOff ? <VideoOffIcon className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
              </button>
            )}

            {/* Screen Share Toggle */}
            {isVideo && (
              <button
                type="button"
                onClick={toggleScreenShare}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isScreenSharing
                    ? "bg-amber-500 text-neutral-900 shadow-lg scale-105"
                    : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
                }`}
                title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
              >
                <MonitorIcon className="w-5 h-5" />
              </button>
            )}

            {/* Add Person Button */}
            {isConnected && (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
                title="Add Person to Call"
              >
                <UserPlusIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Participant Modal */}
      <AddParticipantModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
