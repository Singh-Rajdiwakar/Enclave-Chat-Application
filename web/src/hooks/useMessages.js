import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import api from "../lib/axios";

export const useMessages = (chatId) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/messages/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!chatId,
  });
};

export const useThreadMessages = (parentId) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["thread", parentId],
    queryFn: async () => {
      if (!parentId) return { parent: null, replies: [] };
      const token = await getToken();
      const res = await api.get(`/messages/thread/${parentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!parentId,
  });
};
