import { create } from "zustand";
import { useSocketStore } from "./socket";

const RTC_CONFIG = {
  iceServers: [
    // STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Free TURN relay (for mobile/CGNAT) - freestun.net
    {
      urls: "turn:freestun.net:3478",
      username: "free",
      credential: "free",
    },
    {
      urls: "turn:freestun.net:5350",
      username: "free",
      credential: "free",
    },
    {
      urls: "turns:freestun.net:5349",
      username: "free",
      credential: "free",
    },
  ],
  iceCandidatePoolSize: 10,
};

// Web Audio Ringtone Generator
let ringtoneInterval = null;
let audioCtx = null;

function playRingtoneTone(freq1 = 440, freq2 = 480, duration = 1.8) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.frequency.value = freq1;
    osc2.frequency.value = freq2;

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + duration);
    osc2.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context may be restricted by autoplay policy
  }
}

function startRinging(type = "incoming") {
  stopRinging();
  const freq = type === "incoming" ? [440, 480] : [400, 450];
  playRingtoneTone(freq[0], freq[1], 1.5);
  ringtoneInterval = setInterval(() => {
    playRingtoneTone(freq[0], freq[1], 1.5);
  }, 3500);
}

function stopRinging() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
}

let peerConnection = null;
let durationInterval = null;
let pendingCandidates = [];
const groupPeerConnections = new Map(); // peerId -> RTCPeerConnection
const groupPendingCandidates = new Map(); // peerId -> []

export const useCallStore = create((set, get) => ({
  callStatus: "idle", // "idle" | "calling" | "incoming" | "connected"
  isVideo: false,
  caller: null, // { _id, name, avatar }
  partner: null, // target user in call
  incomingOffer: null,
  localStream: null,
  remoteStream: null,
  isMicMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  duration: 0,
  callRoomId: null,
  isGroup: false,
  peers: [], // array of { peerId, user: { _id, name, avatar }, stream }
  isAddModalOpen: false,

  setAddModalOpen: (open) => set({ isAddModalOpen: open }),

  // Initialize socket listeners for calls
  initCallListeners: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.off("incoming-call");
    socket.off("call-answered");
    socket.off("ice-candidate");
    socket.off("call-rejected");
    socket.off("call-ended");
    socket.off("new-peer-joined");
    socket.off("group-peer-offer");
    socket.off("group-peer-answer");
    socket.off("group-ice-candidate");
    socket.off("peer-left");

    socket.on("incoming-call", ({ from, caller, offer, isVideo, callRoomId, isGroup }) => {
      const currentStatus = get().callStatus;
      if (currentStatus !== "idle") {
        // Already in a call, auto-reject
        socket.emit("reject-call", { to: from });
        return;
      }

      pendingCandidates = [];
      set({
        callStatus: "incoming",
        caller: { _id: from, name: caller?.name || "Someone", avatar: caller?.avatar || "" },
        partner: { _id: from, name: caller?.name || "Someone", avatar: caller?.avatar || "" },
        incomingOffer: offer,
        isVideo: !!isVideo,
        callRoomId: callRoomId || `room-${Date.now()}`,
        isGroup: !!isGroup,
      });
      startRinging("incoming");
    });

    socket.on("call-answered", async ({ answer, callRoomId }) => {
      stopRinging();
      if (callRoomId) set({ callRoomId });

      if (peerConnection && peerConnection.signalingState !== "closed") {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          // Apply any buffered candidates
          while (pendingCandidates.length > 0) {
            const candidate = pendingCandidates.shift();
            if (candidate) {
              try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (candidateErr) {
                console.warn("[WebRTC] Error adding buffered ICE candidate:", candidateErr);
              }
            }
          }
        } catch (e) {
          console.error("[WebRTC] Error setting remote description:", e);
        }
      }

      set({ callStatus: "connected", duration: 0 });
      get().startTimer();
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("[WebRTC] Error adding ICE candidate:", e);
        }
      } else {
        pendingCandidates.push(candidate);
      }
    });

    // ------------------------------------------
    // Group Calling Mesh Listeners
    // ------------------------------------------
    socket.on("new-peer-joined", async ({ peerId, peerUser }) => {
      console.log("[WebRTC Group] 👥 New peer joined group call:", peerId, peerUser?.name);
      set({ isGroup: true });
      const localStream = get().localStream;
      if (!localStream) return;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      groupPeerConnections.set(peerId, pc);

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const peerStream = new MediaStream();

      pc.ontrack = (event) => {
        console.log("[WebRTC Group] Received track from peer:", peerId, event.track.kind);
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!peerStream.getTracks().some((t) => t.id === track.id)) {
              peerStream.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!peerStream.getTracks().some((t) => t.id === event.track.id)) {
            peerStream.addTrack(event.track);
          }
        }

        const newStream = new MediaStream(peerStream.getTracks());
        set((state) => {
          const filtered = state.peers.filter((p) => p.peerId !== peerId);
          return {
            peers: [...filtered, { peerId, user: peerUser, stream: newStream }],
          };
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("group-ice-candidate", {
            to: peerId,
            candidate: event.candidate,
          });
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("group-peer-offer", {
          to: peerId,
          offer,
          fromUser: get().partner || { name: "Participant" },
        });
      } catch (err) {
        console.error("[WebRTC Group] Error creating offer for peer:", err);
      }
    });

    socket.on("group-peer-offer", async ({ from, offer, fromUser }) => {
      console.log("[WebRTC Group] Received offer from peer:", from, fromUser?.name);
      set({ isGroup: true });
      const localStream = get().localStream;
      if (!localStream) return;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      groupPeerConnections.set(from, pc);

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const peerStream = new MediaStream();

      pc.ontrack = (event) => {
        console.log("[WebRTC Group] ontrack from peer:", from, event.track.kind);
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!peerStream.getTracks().some((t) => t.id === track.id)) {
              peerStream.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!peerStream.getTracks().some((t) => t.id === event.track.id)) {
            peerStream.addTrack(event.track);
          }
        }

        const newStream = new MediaStream(peerStream.getTracks());
        set((state) => {
          const filtered = state.peers.filter((p) => p.peerId !== from);
          return {
            peers: [...filtered, { peerId: from, user: fromUser || { name: "Participant" }, stream: newStream }],
          };
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("group-ice-candidate", {
            to: from,
            candidate: event.candidate,
          });
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const buffered = groupPendingCandidates.get(from) || [];
        while (buffered.length > 0) {
          const cand = buffered.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("group-peer-answer", {
          to: from,
          answer,
        });
      } catch (err) {
        console.error("[WebRTC Group] Error answering peer offer:", err);
      }
    });

    socket.on("group-peer-answer", async ({ from, answer }) => {
      console.log("[WebRTC Group] Received answer from peer:", from);
      const pc = groupPeerConnections.get(from);
      if (pc && pc.signalingState !== "closed") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          const buffered = groupPendingCandidates.get(from) || [];
          while (buffered.length > 0) {
            const cand = buffered.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }
        } catch (e) {
          console.error("[WebRTC Group] Error setting remote description for peer:", e);
        }
      }
    });

    socket.on("group-ice-candidate", async ({ from, candidate }) => {
      const pc = groupPeerConnections.get(from);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      } else {
        if (!groupPendingCandidates.has(from)) {
          groupPendingCandidates.set(from, []);
        }
        groupPendingCandidates.get(from).push(candidate);
      }
    });

    socket.on("peer-left", ({ peerId }) => {
      console.log("[WebRTC Group] 🔴 Peer left:", peerId);
      const pc = groupPeerConnections.get(peerId);
      if (pc) {
        pc.close();
        groupPeerConnections.delete(peerId);
      }
      set((state) => ({
        peers: state.peers.filter((p) => p.peerId !== peerId),
      }));
    });

    socket.on("call-rejected", () => {
      stopRinging();
      get().cleanup();
      alert("Call was declined or user is busy.");
    });

    socket.on("call-ended", () => {
      stopRinging();
      get().cleanup();
    });
  },

  startCall: async (targetUser, isVideo = false, chatId = null) => {
    const socket = useSocketStore.getState().socket;
    if (!socket?.connected) {
      alert("Socket is not connected. Please check your connection.");
      return;
    }

    try {
      get().cleanup();
      pendingCandidates = [];

      // Request media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
      });

      // Create PeerConnection
      peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Setup remote stream container
      const remoteStream = new MediaStream();
      set({ remoteStream });

      // Listen for remote tracks
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
              remoteStream.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
            remoteStream.addTrack(event.track);
          }
        }
        set({ remoteStream: new MediaStream(remoteStream.getTracks()) });
      };

      // Send ICE candidates to receiver
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: targetUser._id,
            candidate: event.candidate,
          });
        }
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const callRoomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Emit call
      socket.emit("call-user", {
        userToCall: targetUser._id,
        offer,
        isVideo,
        chatId,
        callRoomId,
      });

      set({
        callStatus: "calling",
        isVideo,
        partner: targetUser,
        localStream: stream,
        remoteStream: null,
        isMicMuted: false,
        isCameraOff: false,
        callRoomId,
        isGroup: false,
        peers: [],
      });

      startRinging("calling");
    } catch (err) {
      console.error("[WebRTC] Error starting call:", err);
      alert("Could not access camera/microphone. Please allow media permissions in browser.");
      get().cleanup();
    }
  },

  acceptCall: async () => {
    stopRinging();
    const socket = useSocketStore.getState().socket;
    const { caller, incomingOffer, isVideo } = get();

    if (!socket || !caller || !incomingOffer) return;

    try {
      // Request media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
      });

      peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Setup remote stream container
      const remoteStream = new MediaStream();
      set({ remoteStream });

      // Listen for remote tracks
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
              remoteStream.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
            remoteStream.addTrack(event.track);
          }
        }
        set({ remoteStream: new MediaStream(remoteStream.getTracks()) });
      };

      // Send ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: caller._id,
            candidate: event.candidate,
          });
        }
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingOffer));

      // Add any pending candidates received while answering
      while (pendingCandidates.length > 0) {
        const candidate = pendingCandidates.shift();
        if (candidate) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (candidateErr) {
            console.warn("[WebRTC] Error adding buffered ICE candidate in accept:", candidateErr);
          }
        }
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("answer-call", {
        to: caller._id,
        answer,
        callRoomId: get().callRoomId,
      });

      // Only join group call room if this was explicitly a group call invite
      if (get().callRoomId && get().isGroup) {
        socket.emit("join-group-call", { callRoomId: get().callRoomId });
      }

      set({
        callStatus: "connected",
        partner: caller,
        localStream: stream,
        duration: 0,
        isMicMuted: false,
        isCameraOff: false,
      });

      get().startTimer();
    } catch (err) {
      console.error("[WebRTC] Error accepting call:", err);
      alert("Failed to start media. Please allow mic/camera permissions.");
      get().rejectCall();
    }
  },

  inviteUser: (userToInvite) => {
    const socket = useSocketStore.getState().socket;
    const { callRoomId, isVideo } = get();
    if (!socket || !callRoomId) {
      alert("Call room is not ready.");
      return;
    }
    socket.emit("invite-to-call", {
      userToInvite: userToInvite._id,
      callRoomId,
      isVideo,
    });
    set({ isGroup: true });
  },

  rejectCall: () => {
    stopRinging();
    const socket = useSocketStore.getState().socket;
    const { caller } = get();
    if (socket && caller) {
      socket.emit("reject-call", { to: caller._id });
    }
    get().cleanup();
  },

  endCall: () => {
    stopRinging();
    const socket = useSocketStore.getState().socket;
    const { partner, duration, callRoomId } = get();
    if (socket && partner) {
      socket.emit("end-call", { to: partner._id, duration, callRoomId });
    }
    if (socket && callRoomId) {
      socket.emit("leave-group-call", { callRoomId });
    }
    get().cleanup();
  },

  toggleMute: () => {
    const { localStream, isMicMuted } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMicMuted; // inverted
        set({ isMicMuted: !isMicMuted });
      }
    }
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff; // inverted
        set({ isCameraOff: !isCameraOff });
      }
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, localStream } = get();

    if (isScreenSharing) {
      await get().stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (!screenVideoTrack) return;

      screenVideoTrack.onended = () => {
        get().stopScreenShare();
      };

      if (peerConnection) {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        }
      }

      if (localStream) {
        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (currentVideoTrack) {
          localStream.removeTrack(currentVideoTrack);
          localStream.addTrack(screenVideoTrack);
          set({ localStream: new MediaStream(localStream.getTracks()), isScreenSharing: true });
        }
      }
    } catch (err) {
      console.warn("[ScreenShare] User cancelled or error:", err);
    }
  },

  stopScreenShare: async () => {
    const { localStream } = get();
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      const camTrack = camStream.getVideoTracks()[0];

      if (peerConnection) {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender && camTrack) {
          await videoSender.replaceTrack(camTrack);
        }
      }

      if (localStream && camTrack) {
        const currentTrack = localStream.getVideoTracks()[0];
        if (currentTrack) {
          currentTrack.stop();
          localStream.removeTrack(currentTrack);
        }
        localStream.addTrack(camTrack);
        set({ localStream: new MediaStream(localStream.getTracks()), isScreenSharing: false });
      }
    } catch (e) {
      set({ isScreenSharing: false });
    }
  },

  startTimer: () => {
    if (durationInterval) clearInterval(durationInterval);
    durationInterval = setInterval(() => {
      set((state) => ({ duration: state.duration + 1 }));
    }, 1000);
  },

  cleanup: () => {
    stopRinging();
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }

    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    groupPeerConnections.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    groupPeerConnections.clear();
    groupPendingCandidates.clear();

    pendingCandidates = [];

    set({
      callStatus: "idle",
      isVideo: false,
      caller: null,
      partner: null,
      incomingOffer: null,
      localStream: null,
      remoteStream: null,
      isMicMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      duration: 0,
      callRoomId: null,
      isGroup: false,
      peers: [],
      isAddModalOpen: false,
    });
  },
}));
