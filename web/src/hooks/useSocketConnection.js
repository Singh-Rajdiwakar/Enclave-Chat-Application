import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "../lib/socket";

export const useSocketConnection = (activeChatId) => {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { socket, connect, disconnect, joinChat, leaveChat } = useSocketStore();

  // connect socket on mount
  useEffect(() => {
    if (isSignedIn) {
      connect(getToken, queryClient);
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isSignedIn, connect, disconnect, getToken, queryClient]);

  // join/leave chat rooms - if you have a chatid in the url this will run
  useEffect(() => {
    if (!activeChatId || !socket) return;

    if (socket.connected) {
      joinChat(activeChatId);
    }

    const handleConnect = () => {
      joinChat(activeChatId);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      leaveChat(activeChatId);
    };
  }, [activeChatId, socket, joinChat, leaveChat]);
};
