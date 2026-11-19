import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import api from "../lib/axios";
import { useSocketStore } from "../lib/socket";

export function useTasks(chatId) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["tasks", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const token = await getToken();
      const res = await api.get(`/tasks/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!chatId,
  });
}

export function useCreateTask(chatId) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const socket = useSocketStore.getState().socket;

  return useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      const res = await api.post("/tasks", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (newTask) => {
      queryClient.setQueryData(["tasks", chatId], (old = []) => [newTask, ...old]);
      socket?.emit("task-created", { chatId, task: newTask });
    },
  });
}

export function useUpdateTask(chatId) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const socket = useSocketStore.getState().socket;

  return useMutation({
    mutationFn: async ({ taskId, data }) => {
      const token = await getToken();
      const res = await api.patch(`/tasks/${taskId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(["tasks", chatId], (old = []) =>
        old.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      socket?.emit("task-updated", { chatId, task: updatedTask });
    },
  });
}

export function useDeleteTask(chatId) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const socket = useSocketStore.getState().socket;

  return useMutation({
    mutationFn: async (taskId) => {
      const token = await getToken();
      const res = await api.delete(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (_, taskId) => {
      queryClient.setQueryData(["tasks", chatId], (old = []) =>
        old.filter((t) => t._id !== taskId)
      );
      socket?.emit("task-deleted", { chatId, taskId });
    },
  });
}
