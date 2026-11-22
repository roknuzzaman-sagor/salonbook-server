import express from "express";
import { exchangeToken, setupAdmin } from "../controllers/authController.js";


const router = express.Router();

router.post("/auth/token", exchangeToken);
router.post("/setup/admin", setupAdmin);

export default router;
