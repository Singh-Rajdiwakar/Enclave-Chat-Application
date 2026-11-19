import { useState, useRef, useEffect } from "react";
import { formatTime } from "../lib/utils";
import { useSocketStore } from "../lib/socket";
import {
  PlayIcon,
  PauseIcon,
  FileTextIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
  PhoneMissedIcon,
  PhoneOffIcon,
  VideoIcon,
  CheckIcon,
  CheckCheckIcon,
  SparklesIcon,
  PinIcon,
  Edit2Icon,
  Trash2Icon,
  BarChart3Icon,
  GlobeIcon,
  BanIcon,
  LockIcon,
  MessageSquareIcon,
  CheckSquareIcon,
} from "lucide-react";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "🔥", "😮", "😢"];

function formatBytes(bytes) {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatCallDuration(sec) {
  if (!sec) return "0s";
  const mins = Math.floor(sec / 60);
  const remaining = Math.floor(sec % 60);
  if (mins === 0) return `${remaining}s`;
  return `${mins}m ${remaining}s`;
}

// Extract first URL from message text
function extractUrl(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

function AudioPlayerBubble({ src, duration, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return "0:00";
    const mins = Math.floor(sec / 60);
    const remaining = Math.floor(sec % 60);
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  const totalDuration = duration || (audioRef.current?.duration ? audioRef.current.duration : 0);
  const progressPercent = totalDuration ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-1 min-w-[220px]">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white/[0.08] hover:bg-white/[0.16] text-[var(--text)] transition cursor-pointer active:scale-95 border border-white/[0.06]"
      >
        {isPlaying ? (
          <PauseIcon className="w-4 h-4 fill-current" />
        ) : (
          <PlayIcon className="w-4 h-4 ml-0.5 fill-current" />
        )}
      </button>

      <button
        type="button"
        onClick={toggleSpeed}
        className="px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 transition cursor-pointer bg-white/[0.06] hover:bg-white/[0.12] text-[var(--muted)] hover:text-[var(--text)] border border-white/[0.04]"
        title="Playback Speed"
      >
        {speed}x
      </button>

      <div className="flex-1 flex flex-col justify-center min-w-[90px]">
        <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
            }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] mt-1 meta-mono">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}

function AudioTranscribeButton({ src, isMe }) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [localText, setLocalText] = useState("");

  const handleTranscribe = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    setIsTranscribing(true);
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    const audio = new Audio(src);

    recognition.onresult = (e) => {
      let result = "";
      for (let i = 0; i < e.results.length; i++) {
        result += e.results[i][0].transcript + " ";
      }
      setLocalText(result.trim());
    };

    recognition.onerror = () => setIsTranscribing(false);
    recognition.onend = () => setIsTranscribing(false);
    audio.onended = () => {
      try {
        recognition.stop();
      } catch (e) {}
      setIsTranscribing(false);
    };

    try {
      recognition.start();
      audio.play().catch(() => {});
    } catch (e) {
      setIsTranscribing(false);
    }
  };

  if (localText) {
    return (
      <div className="mt-1.5 p-2 rounded-xl text-xs flex flex-col gap-1 bg-white/[0.03] border border-white/[0.06] text-[var(--text)]">
        <span className="text-[10px] text-[var(--muted)] font-mono uppercase tracking-wider flex items-center gap-1">
          <FileTextIcon className="w-3 h-3 text-[var(--accent)]" /> Transcript
        </span>
        <p className="italic whitespace-pre-wrap leading-relaxed text-[var(--text)]/90">"{localText}"</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleTranscribe}
      disabled={isTranscribing}
      className="mt-1.5 text-[10px] font-mono flex items-center gap-1 px-2 py-0.5 rounded-md transition cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-[var(--accent)] border border-white/[0.05]"
      title="Convert audio to text"
    >
      <SparklesIcon className="w-3 h-3" />
      <span>{isTranscribing ? "Transcribing..." : "Transcribe to text"}</span>
    </button>
  );
}

// 📊 Interactive Poll Card
function PollCard({ poll, messageId, chatId, currentUserId }) {
  const { votePoll } = useSocketStore();
  if (!poll || !Array.isArray(poll.options)) return null;

  const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);

  const handleVote = (optionId) => {
    votePoll(messageId, chatId, optionId);
  };

  return (
    <div className="w-full min-w-[240px] max-w-sm py-1 space-y-2.5">
      <div className="flex items-start gap-2">
        <BarChart3Icon className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
        <h4 className="text-sm font-semibold text-[var(--text)] leading-snug">{poll.question}</h4>
      </div>

      <div className="space-y-1.5">
        {poll.options.map((opt) => {
          const votesCount = opt.votes?.length || 0;
          const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
          const hasVoted = (opt.votes || []).some(
            (vId) => (vId?._id || vId).toString() === currentUserId?.toString()
          );

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVote(opt.id)}
              className={`w-full relative overflow-hidden rounded-xl p-2.5 text-left border transition cursor-pointer flex items-center justify-between text-xs ${
                hasVoted
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]"
                  : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text)]/90"
              }`}
            >
              {/* Progress bar background fill */}
              <div
                className="absolute inset-y-0 left-0 bg-[var(--accent)]/20 pointer-events-none transition-all duration-300"
                style={{ width: `${percent}%` }}
              />

              <div className="relative z-10 flex items-center gap-2 truncate pr-2">
                {hasVoted && <CheckIcon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 stroke-[3]" />}
                <span className="font-medium truncate">{opt.text}</span>
              </div>

              <div className="relative z-10 meta-mono text-[11px] shrink-0">
                <span>{percent}%</span>
                <span className="opacity-60 ml-1">({votesCount})</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="meta-mono text-[10px] text-[var(--muted)] flex items-center justify-between pt-1">
        <span>{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
        <span>Click option to vote</span>
      </div>
    </div>
  );
}

// 🌐 Link Preview Card
function LinkPreviewCard({ url }) {
  if (!url) return null;
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    domain = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition group text-left max-w-sm"
    >
      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--accent)] mb-1">
        <span className="flex items-center gap-1.5 truncate">
          <GlobeIcon className="w-3 h-3" />
          {domain}
        </span>
        <ExternalLinkIcon className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
      <p className="text-xs text-[var(--text)]/90 truncate font-medium">{url}</p>
    </a>
  );
}

export function MessageBubble({ message, currentUser, onEdit, onOpenThread, onMakeTask, sharedAesKey, isHighlighted }) {
  const isMe = message.sender?._id === currentUser?._id;
  const [selectedImage, setSelectedImage] = useState(null);
  const [decryptedText, setDecryptedText] = useState(null);
  const { reactMessage, pinMessage, deleteMessage } = useSocketStore();

  const messageType = message.messageType || "text";

  // E2EE Decryption
  useEffect(() => {
    if (message.isEncrypted && message.encryptionIv && sharedAesKey) {
      import("../lib/crypto").then(({ decryptText }) => {
        decryptText(message.text, message.encryptionIv, sharedAesKey).then((plain) => {
          if (plain) setDecryptedText(plain);
        });
      });
    }
  }, [message.isEncrypted, message.text, message.encryptionIv, sharedAesKey]);

  const displayText = decryptedText || message.text;
  const detectedUrl = extractUrl(displayText);

  // Group reactions: emoji -> { count, hasMe }
  const reactionGroups = (message.reactions || []).reduce((acc, r) => {
    const emoji = r.emoji;
    acc[emoji] = acc[emoji] || { count: 0, hasMe: false };
    acc[emoji].count += 1;
    const rUserId = r.user?._id || r.user;
    if (rUserId === currentUser?._id) {
      acc[emoji].hasMe = true;
    }
    return acc;
  }, {});

  const handleReact = (emoji) => {
    reactMessage(message._id, message.chat, emoji);
  };

  const handleTogglePin = () => {
    pinMessage(message._id, message.chat, !message.isPinned);
  };

  const handleDelete = () => {
    if (confirm("Delete this message for everyone?")) {
      deleteMessage(message._id, message.chat);
    }
  };

  return (
    <>
      <div
        id={"msg-" + message._id}
        className={`flex flex-col ${isMe ? "items-end" : "items-start"} group relative msg-animate transition-all duration-300 ${
          isHighlighted ? "rounded-2xl ring-2 ring-[var(--accent)]/60 shadow-[0_0_28px_-4px_var(--accent)] bg-[var(--accent)]/5 px-2 -mx-2" : ""
        }`}
      >
        {/* QUICK ACTION BAR ON HOVER (Reactions + Pin + Edit + Delete) */}
        {!message.isDeleted && (
          <div
            className={`absolute -top-7 ${
              isMe ? "right-2" : "left-2"
            } z-20 hidden group-hover:flex items-center gap-1 bg-[#161922]/95 backdrop-blur-md px-2 py-1 rounded-full shadow-lg border border-white/[0.1] transition-all scale-95 hover:scale-100`}
          >
            {/* Quick Emojis */}
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="hover:scale-125 transition-transform text-sm cursor-pointer p-0.5"
              >
                {emoji}
              </button>
            ))}

            <div className="w-px h-3.5 bg-white/10 mx-0.5" />

            {/* Reply in thread */}
            {onOpenThread && !message.parentId && (
              <button
                type="button"
                onClick={() => onOpenThread(message)}
                className="p-1 rounded text-xs text-[var(--muted)] hover:text-white transition cursor-pointer"
                title="Reply in thread"
              >
                <MessageSquareIcon className="w-3 h-3" />
              </button>
            )}

            {/* Pin / Unpin */}
            <button
              type="button"
              onClick={handleTogglePin}
              className={`p-1 rounded text-xs transition cursor-pointer ${
                message.isPinned ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-white"
              }`}
              title={message.isPinned ? "Unpin message" : "Pin message"}
            >
              <PinIcon className="w-3 h-3" />
            </button>

            {/* Make Task / Reminder */}
            {onMakeTask && !message.isDeleted && (
              <button
                type="button"
                onClick={() => onMakeTask(message)}
                className="p-1 rounded text-xs text-[var(--muted)] hover:text-purple-400 transition cursor-pointer"
                title="Make Task / Reminder"
              >
                <CheckSquareIcon className="w-3 h-3" />
              </button>
            )}

            {/* Edit (if own message and text) */}
            {isMe && messageType === "text" && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(message)}
                className="p-1 rounded text-xs text-[var(--muted)] hover:text-white transition cursor-pointer"
                title="Edit message"
              >
                <Edit2Icon className="w-3 h-3" />
              </button>
            )}

            {/* Delete for everyone (if own message) */}
            {isMe && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 rounded text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
                title="Delete for everyone"
              >
                <Trash2Icon className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* BUBBLE CONTENT */}
        <div
          className={`max-w-md px-4 py-2.5 relative transition-all duration-150 ${
            message.isDeleted
              ? "bg-white/[0.02] border border-white/[0.04] rounded-2xl italic text-[var(--muted)]"
              : isMe
              ? "msg-me"
              : "msg-them"
          }`}
        >
          {/* PINNED INDICATOR */}
          {message.isPinned && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--accent)] mb-1 pb-1 border-b border-white/[0.06]">
              <PinIcon className="w-3 h-3 fill-current" />
              <span>PINNED MESSAGE</span>
            </div>
          )}

          {/* E2EE ENCRYPTED BADGE */}
          {message.isEncrypted && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 mb-1 pb-1 border-b border-white/[0.06]">
              <LockIcon className="w-3 h-3" />
              <span>E2E ENCRYPTED</span>
            </div>
          )}

          {/* SENDER NAME (for Group chats) */}
          {!isMe && message.sender?.name && (
            <p className="text-[11px] font-semibold text-[var(--accent)] mb-1 leading-tight tracking-tight">
              {message.sender.name}
            </p>
          )}

          {/* DELETED MESSAGE VIEW */}
          {message.isDeleted ? (
            <div className="flex items-center gap-2 py-1 text-xs text-[var(--muted)]">
              <BanIcon className="w-3.5 h-3.5 opacity-60" />
              <span>This message was deleted</span>
            </div>
          ) : (
            <>
              {/* 1. IMAGE MESSAGE */}
              {messageType === "image" && message.fileUrl && (
                <div className="mb-2 overflow-hidden rounded-xl border border-white/[0.06]">
                  <img
                    src={message.fileUrl}
                    alt={message.fileName || "Photo"}
                    onClick={() => setSelectedImage(message.fileUrl)}
                    className="rounded-xl max-h-72 w-full object-cover cursor-pointer hover:opacity-90 transition duration-150"
                  />
                </div>
              )}

              {/* 2. AUDIO MESSAGE */}
              {messageType === "audio" && message.fileUrl && (
                <div className="flex flex-col">
                  <AudioPlayerBubble src={message.fileUrl} duration={message.duration} isMe={isMe} />

                  {message.text ? (
                    <div className="mt-1.5 p-2 rounded-xl text-xs flex flex-col gap-0.5 bg-white/[0.03] border border-white/[0.06] text-[var(--text)]">
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-mono uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <FileTextIcon className="w-3 h-3 text-[var(--accent)]" /> Transcript
                        </span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(message.text)}
                          className="hover:underline cursor-pointer lowercase font-normal text-[var(--accent)]"
                          title="Copy transcript text"
                        >
                          copy
                        </button>
                      </div>
                      <p className="italic whitespace-pre-wrap leading-relaxed mt-0.5 text-[var(--text)]/90">
                        "{message.text}"
                      </p>
                    </div>
                  ) : (
                    <AudioTranscribeButton src={message.fileUrl} isMe={isMe} />
                  )}
                </div>
              )}

              {/* 3. FILE MESSAGE */}
              {messageType === "file" && message.fileUrl && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl mb-1 bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.06] text-[var(--accent)] border border-white/[0.04]">
                    <FileTextIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium truncate text-[var(--text)]" title={message.fileName}>
                      {message.fileName || "Attachment"}
                    </p>
                    <p className="meta-mono">{formatBytes(message.fileSize)}</p>
                  </div>
                  <a
                    href={message.fileUrl}
                    download={message.fileName || "download"}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg transition hover:bg-white/[0.08] text-[var(--muted)] hover:text-[var(--text)]"
                    title="Download file"
                  >
                    <DownloadIcon className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* 4. CALL HISTORY MESSAGE */}
              {messageType === "call" && (
                <div className="inline-flex items-center gap-2.5 py-1 px-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      message.callStatus === "missed" || message.callStatus === "declined"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {message.callType === "video" ? (
                      <VideoIcon className="w-3.5 h-3.5" />
                    ) : message.callStatus === "missed" ? (
                      <PhoneMissedIcon className="w-3.5 h-3.5" />
                    ) : message.callStatus === "declined" ? (
                      <PhoneOffIcon className="w-3.5 h-3.5" />
                    ) : isMe ? (
                      <PhoneOutgoingIcon className="w-3.5 h-3.5" />
                    ) : (
                      <PhoneIncomingIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-[var(--text)]">
                      {message.callType === "video" ? "Video call" : "Voice call"}
                    </span>
                    <span className="meta-mono text-[10px]">
                      {message.callStatus === "completed"
                        ? `• ${formatCallDuration(message.duration)}`
                        : message.callStatus === "missed"
                        ? isMe
                          ? "• No answer"
                          : "• Missed"
                        : "• Declined"}
                    </span>
                  </div>
                </div>
              )}

              {/* 5. POLL MESSAGE */}
              {messageType === "poll" && message.poll && (
                <PollCard
                  poll={message.poll}
                  messageId={message._id}
                  chatId={message.chat}
                  currentUserId={currentUser?._id}
                />
              )}

              {/* TEXT MESSAGE */}
              {displayText && messageType !== "call" && messageType !== "audio" && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--text)]">
                  {displayText}
                </p>
              )}

              {/* LINK PREVIEW */}
              {detectedUrl && messageType !== "poll" && (
                <LinkPreviewCard url={detectedUrl} />
              )}
            </>
          )}

          {/* TIME, EDITED TAG & READ RECEIPTS */}
          <div className="flex items-center justify-end gap-1.5 mt-1 meta-mono">
            {message.isEdited && <span className="text-[9px] opacity-70">(edited)</span>}
            <span>{formatTime(message.createdAt)}</span>
            {isMe && messageType !== "call" && !message.isDeleted && (
              <span className="inline-flex items-center">
                {message.status === "read" ? (
                  <CheckCheckIcon className="w-3.5 h-3.5 text-[var(--accent)] stroke-[2.5]" title="Read" />
                ) : message.status === "delivered" ? (
                  <CheckCheckIcon className="w-3.5 h-3.5 text-[var(--muted)] stroke-[2]" title="Delivered" />
                ) : (
                  <CheckIcon className="w-3.5 h-3.5 text-[var(--muted)] stroke-[2]" title="Sent" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* 💬 THREAD REPLIES PILL LINK */}
        {message.replyCount > 0 && !message.parentId && (
          <button
            type="button"
            onClick={() => onOpenThread?.(message)}
            className="mt-1 flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline font-mono cursor-pointer px-1"
          >
            <MessageSquareIcon className="w-3.5 h-3.5" />
            <span>
              {message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
            </span>
            <span className="opacity-60 text-[10px]">→</span>
          </button>
        )}

        {/* FLOATING REACTION BADGES */}
        {!message.isDeleted && Object.keys(reactionGroups).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactionGroups).map(([emoji, data]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition hover:scale-105 active:scale-95 cursor-pointer ${
                  data.hasMe
                    ? "bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)] font-medium"
                    : "bg-white/[0.04] border-white/[0.08] text-[var(--text)] hover:bg-white/[0.08]"
                }`}
                title={data.hasMe ? "Click to remove reaction" : "Click to react"}
              >
                <span>{emoji}</span>
                {data.count > 1 && <span className="text-[10px] meta-mono">{data.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Full view"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/[0.1]"
            />
            <a
              href={selectedImage}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 btn btn-circle btn-sm bg-black/60 text-white border border-white/[0.2] hover:bg-black"
              title="Open original"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
