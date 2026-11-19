import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import {
  getChats,
  getOrCreateChat,
  createGroupChat,
  getOrCreateSelfChat,
  getPinnedMessages,
} from "../controllers/chatController";

const router = Router();

router.use(protectRoute);

router.get("/", getChats);
router.post("/group", createGroupChat);
router.post("/saved", getOrCreateSelfChat);
router.get("/:chatId/pinned", getPinnedMessages);
router.post("/with/:participantId", getOrCreateChat);

export default router;
