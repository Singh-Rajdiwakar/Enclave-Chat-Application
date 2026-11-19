import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protectRoute } from "../middleware/auth";

const router = Router();

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
});

router.post("/", protectRoute, upload.single("file"), (req: Request, res: Response): void => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const mime = file.mimetype.toLowerCase();
    let messageType: "image" | "audio" | "file" = "file";
    if (mime.startsWith("image/")) {
      messageType = "image";
    } else if (mime.startsWith("audio/") || mime.includes("webm") || mime.includes("ogg") || mime.includes("mp3") || mime.includes("wav") || mime.includes("m4a")) {
      messageType = "audio";
    }

    // Generate public relative / absolute url
    const protocol = req.protocol;
    const host = req.get("host") || "localhost:3000";
    const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;

    res.json({
      url: fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      messageType,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "File upload failed" });
  }
});

export default router;
