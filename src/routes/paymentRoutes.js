import express from "express";
import { verifyAdmin, verifyCustomer, verifyJWT } from "../middleware/auth.js";
import { createCheckoutSession, getTransactions } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/payments/create-checkout-session", verifyJWT, verifyCustomer, createCheckoutSession);
router.get("/transactions", verifyJWT, verifyAdmin, getTransactions);

export default router;
