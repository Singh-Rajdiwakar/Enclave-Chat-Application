import mongoose, { Schema, type Document } from "mongoose";

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  isGroup?: boolean;
  isSelfChat?: boolean;
  groupName?: string;
  groupAvatar?: string;
  admin?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    isSelfChat: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: "",
      trim: true,
    },
    groupAvatar: {
      type: String,
      default: "",
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// indexes for faster queries
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessageAt: -1 });

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);
