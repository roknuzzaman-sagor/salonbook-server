import express from "express";
import cors from "cors";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:3000"],
    credentials: true,
  })
);

// Stripe webhook must use raw body before express.json.
app.post("/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("SalonBook server is running");
});

app.use(authRoutes);
app.use(serviceRoutes);
app.use(appointmentRoutes);
app.use(userRoutes);
app.use(paymentRoutes);
app.use(statsRoutes);

export default app;
