import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Task } from "../models/Task";
import { Chat } from "../models/Chat";
import { Types } from "mongoose";

export async function getTasks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const chatId = req.params.chatId as string;

    if (!chatId || !Types.ObjectId.isValid(chatId)) {
      res.status(400).json({ message: "Invalid chat ID" });
      return;
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found or unauthorized" });
      return;
    }

    const tasks = await Task.find({ chat: chatId })
      .populate("creator", "name avatar email")
      .populate("assignedTo", "name avatar email")
      .populate("fromMessage", "text sender createdAt")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function createTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { chatId, title, description, assignedTo, dueDate, fromMessageId } = req.body;

    if (!chatId || !title?.trim()) {
      res.status(400).json({ message: "chatId and title are required" });
      return;
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found or unauthorized" });
      return;
    }

    const task = await Task.create({
      chat: chatId,
      creator: userId,
      title: title.trim(),
      description: description?.trim() || "",
      assignedTo: assignedTo && Types.ObjectId.isValid(assignedTo) ? assignedTo : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      fromMessage: fromMessageId && Types.ObjectId.isValid(fromMessageId) ? fromMessageId : undefined,
      status: "pending",
    });

    await task.populate("creator", "name avatar email");
    if (task.assignedTo) await task.populate("assignedTo", "name avatar email");
    if (task.fromMessage) await task.populate("fromMessage", "text sender createdAt");

    res.status(201).json(task);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function updateTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const taskId = req.params.taskId as string;
    const { status, title, dueDate, assignedTo } = req.body;

    if (!taskId || !Types.ObjectId.isValid(taskId)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const chat = await Chat.findOne({
      _id: task.chat,
      participants: userId,
    });

    if (!chat) {
      res.status(403).json({ message: "Unauthorized to update this task" });
      return;
    }

    if (status !== undefined) {
      task.status = status;
      task.completedAt = status === "completed" ? new Date() : undefined;
    }
    if (title?.trim()) task.title = title.trim();
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo && Types.ObjectId.isValid(assignedTo) ? assignedTo : undefined;
    }

    await task.save();
    await task.populate("creator", "name avatar email");
    if (task.assignedTo) await task.populate("assignedTo", "name avatar email");
    if (task.fromMessage) await task.populate("fromMessage", "text sender createdAt");

    res.json(task);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const taskId = req.params.taskId as string;

    if (!taskId || !Types.ObjectId.isValid(taskId)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const chat = await Chat.findOne({
      _id: task.chat,
      participants: userId,
    });

    if (!chat) {
      res.status(403).json({ message: "Unauthorized to delete this task" });
      return;
    }

    await Task.findByIdAndDelete(taskId);
    res.json({ message: "Task deleted successfully", taskId });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
