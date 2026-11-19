import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";
import { Types } from "mongoose";

export async function getChats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email avatar")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    const formattedChats = chats.map((chat) => {
      const isSelf = chat.isSelfChat || (chat.participants.length === 1 && chat.participants[0]?._id?.toString() === userId);
      const otherParticipant = chat.participants.find((p) => p?._id?.toString() !== userId);

      return {
        _id: chat._id,
        isGroup: chat.isGroup || false,
        isSelfChat: isSelf,
        groupName: chat.groupName || "",
        groupAvatar: chat.groupAvatar || "",
        admin: chat.admin,
        participants: chat.participants,
        participant: isSelf
          ? {
              _id: chat._id,
              name: "Saved Messages",
              avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=SavedNotes",
              isSelfChat: true,
            }
          : chat.isGroup
          ? {
              _id: chat._id,
              name: chat.groupName || "Group Chat",
              avatar: chat.groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.groupName || "group"}`,
              isGroup: true,
              membersCount: chat.participants.length,
            }
          : otherParticipant ?? null,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
      };
    });

    res.json(formattedChats);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function createGroupChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { name, participantIds, avatar } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: "Group name is required" });
      return;
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      res.status(400).json({ message: "At least one participant is required" });
      return;
    }

    const uniqueParticipants = Array.from(new Set([userId, ...participantIds]));

    const groupChat = await Chat.create({
      isGroup: true,
      groupName: name.trim(),
      groupAvatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`,
      admin: userId,
      participants: uniqueParticipants,
      lastMessageAt: new Date(),
    });

    await groupChat.populate("participants", "name email avatar");

    res.status(201).json({
      _id: groupChat._id,
      isGroup: true,
      groupName: groupChat.groupName,
      groupAvatar: groupChat.groupAvatar,
      admin: groupChat.admin,
      participants: groupChat.participants,
      participant: {
        _id: groupChat._id,
        name: groupChat.groupName,
        avatar: groupChat.groupAvatar,
        isGroup: true,
        membersCount: groupChat.participants.length,
      },
      lastMessage: null,
      lastMessageAt: groupChat.lastMessageAt,
      createdAt: groupChat.createdAt,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function getOrCreateSelfChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let chat = await Chat.findOne({
      participants: [userId],
      isSelfChat: true,
    }).populate("lastMessage");

    if (!chat) {
      chat = await Chat.create({
        participants: [new Types.ObjectId(userId)],
        isSelfChat: true,
        groupName: "Saved Messages",
        groupAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=SavedNotes",
        lastMessageAt: new Date(),
      });
    }

    res.json({
      _id: chat._id,
      isSelfChat: true,
      participant: {
        _id: chat._id,
        name: "Saved Messages",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=SavedNotes",
        isSelfChat: true,
      },
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function getOrCreateChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { participantId } = req.params;

    if (!participantId) {
      res.status(400).json({ message: "Participant ID is required" });
      return;
    }

    const pId = participantId as string;
    if (!Types.ObjectId.isValid(pId)) {
      return res.status(400).json({ message: "Invalid participant ID" });
    }

    if (userId === pId) {
      return getOrCreateSelfChat(req, res, next);
    }

    // check if chat already exists
    let chat = await Chat.findOne({
      isGroup: false,
      isSelfChat: false,
      participants: { $all: [userId, participantId], $size: 2 },
    })
      .populate("participants", "name email avatar")
      .populate("lastMessage");

    if (!chat) {
      const newChat = new Chat({ participants: [userId, participantId], isGroup: false, isSelfChat: false });
      await newChat.save();
      chat = await newChat.populate("participants", "name email avatar");
    }

    const otherParticipant = chat.participants.find((p: any) => p._id.toString() !== userId);

    res.json({
      _id: chat._id,
      participant: otherParticipant ?? null,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function getPinnedMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId, isPinned: true })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
}
