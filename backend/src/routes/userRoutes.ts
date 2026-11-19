import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getUsers, savePublicKey, getUserPublicKey } from "../controllers/userController";

const router = Router();

router.use(protectRoute);

router.get("/", getUsers);
router.post("/public-key", savePublicKey);
router.get("/:userId/public-key", getUserPublicKey);

export default router;
