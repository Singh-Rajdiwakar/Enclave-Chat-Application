import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getMessages, getThreadMessages } from "../controllers/messageController";

const router = Router();

router.use(protectRoute);

router.get("/thread/:parentId", getThreadMessages);
router.get("/chat/:chatId", getMessages);
router.get("/:chatId", getMessages);

export default router;
