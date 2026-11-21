import express from "express";
import { verifyAdmin, verifyCustomer, verifyJWT } from "../middleware/auth.js";
import { getAdminStats, getCustomerStats } from "../controllers/statsController.js";

const router = express.Router();

router.get("/stats/admin", verifyJWT, verifyAdmin, getAdminStats);
router.get("/stats/customer", verifyJWT, verifyCustomer, getCustomerStats);

export default router;
