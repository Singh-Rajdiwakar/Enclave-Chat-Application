import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITask extends Document {
  chat: Types.ObjectId;
  creator: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  title: string;
  description?: string;
  fromMessage?: Types.ObjectId;
  dueDate?: Date;
  status: "pending" | "completed";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fromMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>("Task", taskSchema);
