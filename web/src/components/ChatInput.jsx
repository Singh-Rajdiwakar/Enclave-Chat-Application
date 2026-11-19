import { useState, useRef, useEffect } from "react";
import {
  SendIcon,
  SmileIcon,
  PaperclipIcon,
  ImageIcon,
  MicIcon,
  SquareIcon,
  Trash2Icon,
  Loader2Icon,
  BarChart3Icon,
  Edit2Icon,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../lib/axios";
import { SlashCommandMenu, SLASH_COMMANDS } from "./SlashCommandMenu";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  onEmojiSelect,
  onSendCustom,
  onOpenPoll,
  editingMessage,
  onCancelEdit,
  isE2EEActive,
}) {
  const { getToken } = useAuth();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Slash commands autocomplete state
  const [slashIndex, setSlashIndex] = useState(0);
  const isSlashCommand = typeof value === "string" && value.startsWith("/") && !value.includes(" ");
  const slashQuery = isSlashCommand ? value.slice(1).toLowerCase() : "";
  const filteredCommands = SLASH_COMMANDS.filter((c) =>
    c.cmd.slice(1).toLowerCase().includes(slashQuery)
  );

  const handleSelectCommand = (item) => {
    if (item.cmd === "/poll") {
      if (onOpenPoll) onOpenPoll();
      if (onChange) onChange({ target: { value: "" } });
      return;
    }

    let nextText = "";
    if (item.cmd === "/remind") {
      nextText = "/remind 2h Call ";
    } else if (item.cmd === "/split") {
      nextText = "/split 1200 @Friend";
    } else if (item.cmd === "/code") {
      nextText = "```js\n// Write your code here\nconsole.log('Hello');\n```";
    } else if (item.cmd === "/task") {
      nextText = "/task Review design specs";
    } else if (item.cmd === "/shrug") {
      nextText = "¯\\_(ツ)_/¯";
    } else if (item.cmd === "/tableflip") {
      nextText = "(╯°□°)╯︵ ┻━┻";
    } else {
      nextText = `${item.cmd} `;
    }

    if (onChange) {
      onChange({ target: { value: nextText } });
    }
    setSlashIndex(0);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 10);
  };

  const handleInputKeyDown = (e) => {
    if (!isSlashCommand || filteredCommands.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlashIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filteredCommands[slashIndex]) {
        e.preventDefault();
        handleSelectCommand(filteredCommands[slashIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (onChange) onChange({ target: { value: "" } });
    }
  };

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Handle file uploads (Images or Documents)
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgressText(type === "image" ? "Uploading photo..." : "Uploading file...");

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (onSendCustom) {
        onSendCustom({
          text: "",
          messageType: res.data.messageType || type,
          fileUrl: res.data.url,
          fileName: res.data.fileName || file.name,
          fileSize: res.data.fileSize || file.size,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      e.target.value = "";
    }
  };

  // Start voice recording with live transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start live speech transcription
      setTranscript("");
      transcriptRef.current = "";
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            let fullText = "";
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + " ";
            }
            const clean = fullText.trim();
            setTranscript(clean);
            transcriptRef.current = clean;
          };

          recognition.onerror = (e) => {
            console.warn("[SpeechRecognition] error:", e.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("[SpeechRecognition] not started:", e);
        }
      }

      mediaRecorder.start(200); // 200ms slices
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone permission required to record voice notes.");
    }
  };

  // Stop voice recording and optionally send
  const stopRecording = (shouldSend = true) => {
    if (!mediaRecorderRef.current) return;

    clearInterval(recordingTimerRef.current);
    const duration = recordingDuration;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {}
    }

    mediaRecorderRef.current.onstop = async () => {
      // stop tracks
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());

      if (shouldSend && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsUploading(true);
        setUploadProgressText("Transcribing & sending voice note...");

        try {
          const token = await getToken();
          const formData = new FormData();
          const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          formData.append("file", audioFile);

          const res = await api.post("/upload", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          const finalTranscript = transcriptRef.current || transcript || "";

          if (onSendCustom) {
            onSendCustom({
              text: finalTranscript,
              messageType: "audio",
              fileUrl: res.data.url,
              fileName: "Voice Note",
              fileSize: audioBlob.size,
              duration,
            });
          }
        } catch (error) {
          console.error("Voice upload failed:", error);
          alert("Failed to send voice note.");
        } finally {
          setIsUploading(false);
          setUploadProgressText("");
        }
      }

      setIsRecording(false);
      setRecordingDuration(0);
      setTranscript("");
      transcriptRef.current = "";
      audioChunksRef.current = [];
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-3.5 bg-[#11131A]/95 backdrop-blur-md border-t border-white/[0.08] relative z-40">
      {/* Uploading progress notification */}
      {isUploading && (
        <div className="absolute -top-10 left-4 right-4 bg-[#161922] border border-white/[0.1] text-[var(--accent)] text-xs py-1.5 px-3 rounded-lg flex items-center gap-2 shadow-lg animate-pulse font-mono">
          <Loader2Icon className="w-4 h-4 animate-spin" />
          <span>{uploadProgressText}</span>
        </div>
      )}

      {/* EMOJI PICKER POPUP */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-2xl border border-white/[0.1] overflow-hidden">
          <EmojiPicker
            theme="dark"
            onEmojiClick={(emojiData) => {
              if (onEmojiSelect) onEmojiSelect(emojiData.emoji);
            }}
          />
        </div>
      )}

      {/* HIDDEN FILE INPUTS */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, "image")}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="*/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, "file")}
      />

      {isRecording ? (
        /* VOICE RECORDING ACTIVE BAR WITH LIVE TRANSCRIPTION */
        <div className="flex flex-col gap-1.5 w-full bg-white/[0.03] border border-white/[0.08] p-2.5 rounded-xl animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-semibold font-mono text-[var(--text)]">
                Recording: {formatTimer(recordingDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stopRecording(false)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                title="Cancel Recording"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => stopRecording(true)}
                className="send-btn h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium cursor-pointer transition"
                title="Send Voice Note"
              >
                <SendIcon className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Live speech-to-text preview */}
          {transcript ? (
            <div className="text-xs text-[var(--text)] bg-white/[0.04] px-2.5 py-1.5 rounded-lg border border-white/[0.06] flex items-start gap-1.5">
              <span className="text-[var(--accent)] font-semibold text-[10px] font-mono uppercase tracking-wider shrink-0 mt-0.5">
                Live:
              </span>
              <span className="italic line-clamp-2">"{transcript}"</span>
            </div>
          ) : (
            <p className="text-[11px] text-[var(--muted)] italic px-1 meta-mono">
              Speak clearly — voice transcribed live...
            </p>
          )}
        </div>
      ) : (
        /* STANDARD INPUT BAR */
        <div className="flex flex-col gap-1.5">
          {/* EDITING MESSAGE BANNER */}
          {editingMessage && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs text-[var(--accent)]">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <Edit2Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium truncate">Editing: "{editingMessage.text}"</span>
              </div>
              <button
                type="button"
                onClick={onCancelEdit}
                className="hover:underline font-mono text-[11px] cursor-pointer shrink-0"
              >
                Cancel
              </button>
            </div>
          )}

          {/* ⚡ FLOATING SLASH COMMAND AUTOCOMPLETE MENU */}
          {isSlashCommand && (
            <SlashCommandMenu
              input={value}
              selectedIndex={slashIndex}
              onSelect={handleSelectCommand}
              onHover={setSlashIndex}
            />
          )}

          <form onSubmit={onSubmit} className="flex items-center gap-2">
            {/* EMOJI BUTTON */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`p-2 rounded-lg transition cursor-pointer ${
                showEmojiPicker ? "text-[var(--accent)] bg-white/[0.08]" : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04]"
              }`}
              title="Add Emoji"
            >
              <SmileIcon className="w-4 h-4" />
            </button>

            {/* ATTACH IMAGE BUTTON */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04] transition cursor-pointer"
              title="Attach Photo"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* ATTACH FILE BUTTON */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04] transition cursor-pointer"
              title="Attach Document / File"
            >
              <PaperclipIcon className="w-4 h-4" />
            </button>

            {/* CREATE POLL BUTTON */}
            {onOpenPoll && (
              <button
                type="button"
                onClick={onOpenPoll}
                className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04] transition cursor-pointer"
                title="Create Poll / Vote"
              >
                <BarChart3Icon className="w-4 h-4" />
              </button>
            )}

            {/* TEXT INPUT */}
            <input
              ref={textInputRef}
              type="text"
              value={value}
              onChange={onChange}
              onKeyDown={handleInputKeyDown}
              placeholder={
                editingMessage
                  ? "Edit message and press Enter..."
                  : isE2EEActive
                  ? "Type an encrypted message or record audio..."
                  : "Type a message or type / for commands..."
              }
              className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-[var(--accent)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--muted)] px-3.5 py-2 outline-none transition"
            />

            {/* SEND OR MIC BUTTON */}
            {value.trim() ? (
              <button
                type="submit"
                disabled={disabled || isUploading}
                className="send-btn h-9 px-3.5 rounded-xl flex items-center justify-center cursor-pointer transition hover:scale-105 active:scale-95 disabled:opacity-40"
                title={editingMessage ? "Save Edit" : "Send Message"}
              >
                <SendIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={isUploading}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-[var(--accent)] border border-white/[0.06] cursor-pointer transition hover:scale-105 active:scale-95"
                title="Record Voice Note"
              >
                <MicIcon className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
