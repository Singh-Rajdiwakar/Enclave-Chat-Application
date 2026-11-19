import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController";

const router = Router();
router.use(protectRoute);

router.get("/:chatId", getTasks);
router.post("/", createTask);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;
