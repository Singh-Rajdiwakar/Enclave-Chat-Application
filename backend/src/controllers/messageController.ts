import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    // Only load main messages (not thread replies)
    const messages = await Message.find({
      chat: chatId,
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function getThreadMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { parentId } = req.params;

    const parentMessage = await Message.findById(parentId).populate("sender", "name email avatar");
    if (!parentMessage) {
      res.status(404).json({ message: "Parent message not found" });
      return;
    }

    // Verify user is in the chat
    const chat = await Chat.findOne({
      _id: parentMessage.chat,
      participants: userId,
    });

    if (!chat) {
      res.status(403).json({ message: "Not authorized to view thread" });
      return;
    }

    const replies = await Message.find({ parentId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    res.json({
      parent: parentMessage,
      replies,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
