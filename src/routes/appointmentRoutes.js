import express from "express";
import { verifyAdmin, verifyCustomer, verifyJWT } from "../middleware/auth.js";
import {
  createAppointment,
  getAllAppointments,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/appointments", verifyJWT, verifyCustomer, createAppointment);
router.get("/appointments/my", verifyJWT, verifyCustomer, getMyAppointments);
router.get("/appointments", verifyJWT, verifyAdmin, getAllAppointments);
router.patch("/appointments/:id/status", verifyJWT, updateAppointmentStatus);

export default router;
