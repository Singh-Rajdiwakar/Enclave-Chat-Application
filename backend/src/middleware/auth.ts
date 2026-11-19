import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { User } from "../models/User";
import { requireAuth } from "@clerk/express";

export type AuthRequest = Request & {
  userId?: string;
};

export const protectRoute = [
  requireAuth(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: clerkId } = getAuth(req);

      if (!clerkId) {
        res.status(401).json({ message: "Unauthorized - invalid token" });
        return;
      }

      let user = await User.findOne({ clerkId });

      if (!user) {
        // Auto-create user in DB if first time login
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          user = await User.create({
            clerkId,
            name: clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
              : clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || "User",
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            avatar: clerkUser.imageUrl || "",
          });
        } catch (syncErr: any) {
          console.warn("[Auth Middleware] Could not auto-sync user:", syncErr.message);
          res.status(404).json({ message: "User not found" });
          return;
        }
      }

      req.userId = user._id.toString();

      next();
    } catch (error) {
      res.status(500);
      next(error);
    }
  },
];
