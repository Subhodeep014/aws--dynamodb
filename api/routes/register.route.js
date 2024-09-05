import express from "express";
import multer from "multer";
import { newUser } from "../controllers/register.controller.js";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// router.get("/new",test)
router.post('/user', upload.single('profileImage'), newUser);
export default router;  