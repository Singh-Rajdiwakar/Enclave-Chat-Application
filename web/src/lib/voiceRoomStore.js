import { create } from "zustand";
import { useSocketStore } from "./socket";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const peerConnections = new Map(); // peerId -> RTCPeerConnection
let audioContext = null;
let analyserNode = null;
let speechInterval = null;

export const useVoiceRoomStore = create((set, get) => ({
  isJoined: false,
  activeChatId: null,
  participants: [], // [{ userId, name, avatar, isMuted, isSpeaking }]
  roomParticipantsByChat: new Map(), // chatId -> [{ userId, name, avatar, isMuted, isSpeaking }]
  isMuted: false,
  isDeafened: false,
  localStream: null,

  // Init listeners on socket
  initVoiceRoomListeners: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.off("voice-room-state");
    socket.off("voice-room-joined");
    socket.off("voice-peer-joined");
    socket.off("voice-peer-left");
    socket.off("voice-member-updated");

    // Live state updates for any chat (used by drop-in banner)
    socket.on("voice-room-state", ({ chatId, participants }) => {
      set((state) => {
        const nextMap = new Map(state.roomParticipantsByChat);
        if (participants && participants.length > 0) {
          nextMap.set(chatId, participants);
        } else {
          nextMap.delete(chatId);
        }
        return {
          roomParticipantsByChat: nextMap,
          participants: state.activeChatId === chatId ? participants : state.participants,
        };
      });
    });

    socket.on("voice-room-joined", ({ chatId, participants }) => {
      set({ isJoined: true, activeChatId: chatId, participants });
    });

    socket.on("voice-peer-joined", async ({ chatId, member }) => {
      console.log("[Voice Room] 🔊 Peer joined:", member.name);
      set((state) => ({
        participants: [...state.participants.filter((p) => p.userId !== member.userId), member],
      }));

      // Connect WebRTC audio track
      const localStream = get().localStream;
      if (!localStream) return;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnections.set(member.userId, pc);

      localStream.getAudioTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0] || new MediaStream([event.track]);
        audio.autoplay = true;
        audio.play().catch(() => {});
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("group-ice-candidate", {
            to: member.userId,
            candidate: event.candidate,
          });
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("group-peer-offer", {
          to: member.userId,
          offer,
          fromUser: { _id: member.userId },
        });
      } catch (err) {
        console.warn("[Voice Room] WebRTC offer error:", err);
      }
    });

    socket.on("voice-peer-left", ({ chatId, peerId }) => {
      console.log("[Voice Room] 🔴 Peer left:", peerId);
      const pc = peerConnections.get(peerId);
      if (pc) {
        pc.close();
        peerConnections.delete(peerId);
      }
      set((state) => ({
        participants: state.participants.filter((p) => p.userId !== peerId),
      }));
    });

    socket.on("voice-member-updated", ({ chatId, userId, isMuted, isSpeaking }) => {
      set((state) => ({
        participants: state.participants.map((p) =>
          p.userId === userId ? { ...p, isMuted, isSpeaking } : p
        ),
      }));
    });
  },

  joinRoom: async (chatId, currentUser) => {
    const socket = useSocketStore.getState().socket;
    if (!socket || !chatId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Speaking detector
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        source.connect(analyserNode);

        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        let wasSpeaking = false;

        speechInterval = setInterval(() => {
          if (get().isMuted) return;
          analyserNode.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / dataArray.length;
          const isSpeakingNow = average > 18;

          if (isSpeakingNow !== wasSpeaking) {
            wasSpeaking = isSpeakingNow;
            socket.emit("voice-state-update", {
              chatId,
              isMuted: get().isMuted,
              isSpeaking: isSpeakingNow,
            });
            set((state) => ({
              participants: state.participants.map((p) =>
                p.userId === currentUser?._id ? { ...p, isSpeaking: isSpeakingNow } : p
              ),
            }));
          }
        }, 200);
      } catch (audioErr) {
        console.warn("[Voice Room] Speech detector setup failed:", audioErr);
      }

      set({ localStream: stream, isJoined: true, activeChatId: chatId, isMuted: false });
      socket.emit("join-voice-room", { chatId });
    } catch (err) {
      console.error("[Voice Room] Microphone permission denied:", err);
      alert("Microphone access is required to join the voice room.");
    }
  },

  leaveRoom: () => {
    const { activeChatId, localStream } = get();
    const socket = useSocketStore.getState().socket;

    if (speechInterval) {
      clearInterval(speechInterval);
      speechInterval = null;
    }

    if (audioContext && audioContext.state !== "closed") {
      audioContext.close().catch(() => {});
      audioContext = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();

    if (socket && activeChatId) {
      socket.emit("leave-voice-room", { chatId: activeChatId });
    }

    set({
      isJoined: false,
      activeChatId: null,
      participants: [],
      localStream: null,
      isMuted: false,
      isDeafened: false,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted, activeChatId } = get();
    const socket = useSocketStore.getState().socket;
    if (!localStream) return;

    const newMuted = !isMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !newMuted;
    });

    set({ isMuted: newMuted });
    if (socket && activeChatId) {
      socket.emit("voice-state-update", {
        chatId: activeChatId,
        isMuted: newMuted,
        isSpeaking: false,
      });
    }
  },

  toggleDeafen: () => {
    const newDeafened = !get().isDeafened;
    // Mute remote audio elements
    document.querySelectorAll("audio").forEach((audio) => {
      audio.muted = newDeafened;
    });
    set({ isDeafened: newDeafened });
  },

  pollRoomState: (chatId) => {
    const socket = useSocketStore.getState().socket;
    if (socket && chatId) {
      socket.emit("get-voice-room", { chatId });
    }
  },
}));
