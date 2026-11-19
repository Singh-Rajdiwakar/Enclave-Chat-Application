import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    const users = await User.find({ _id: { $ne: userId } })
      .select("name email avatar publicKey")
      .limit(50);

    res.json(users);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function savePublicKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { publicKey } = req.body;

    if (!publicKey) {
      res.status(400).json({ message: "publicKey is required" });
      return;
    }

    const user = await User.findByIdAndUpdate(userId, { publicKey }, { new: true });
    res.json({ message: "Public key saved successfully", publicKey: user?.publicKey });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function getUserPublicKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("publicKey name");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({ publicKey: user.publicKey || "", name: user.name });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
