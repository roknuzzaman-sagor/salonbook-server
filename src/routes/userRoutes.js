import express from "express";
import { verifyAdmin, verifyJWT } from "../middleware/auth.js";
import { blockUser, getMe, getUsers, updateMe } from "../controllers/userController.js";

const router = express.Router();

router.get("/users", verifyJWT, verifyAdmin, getUsers);
router.get("/users/me", verifyJWT, getMe);
router.patch("/users/me", verifyJWT, updateMe);
router.patch("/users/:id/block", verifyJWT, verifyAdmin, blockUser);

export default router;
