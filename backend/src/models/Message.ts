import mongoose, { Schema, type Document } from "mongoose";

export interface IReaction {
  user: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IPollOption {
  id: string;
  text: string;
  votes: mongoose.Types.ObjectId[];
}

export interface IPoll {
  question: string;
  options: IPollOption[];
}

export interface ILinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId | null;
  replyCount?: number;
  text?: string;
  messageType: "text" | "image" | "file" | "audio" | "call" | "poll";
  callType?: "audio" | "video";
  callStatus?: "completed" | "missed" | "declined";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  status: "sent" | "delivered" | "read";
  reactions: IReaction[];
  isPinned?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  isEncrypted?: boolean;
  encryptionIv?: string;
  poll?: IPoll;
  linkPreview?: ILinkPreview;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio", "call", "poll"],
      default: "text",
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      default: "audio",
    },
    callStatus: {
      type: String,
      enum: ["completed", "missed", "declined"],
      default: "completed",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    encryptionIv: {
      type: String,
      default: "",
    },
    poll: {
      question: { type: String, default: "" },
      options: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          votes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
      ],
    },
    linkPreview: {
      url: { type: String },
      title: { type: String },
      description: { type: String },
      image: { type: String },
      domain: { type: String },
    },
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// indexes for faster queries
MessageSchema.index({ chat: 1, createdAt: 1 });
MessageSchema.index({ chat: 1, parentId: 1, createdAt: 1 });
MessageSchema.index({ chat: 1, isPinned: 1 });

export const Message = mongoose.model("Message", MessageSchema);
