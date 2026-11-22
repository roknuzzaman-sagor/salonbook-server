import express from "express";
import { verifyAdmin, verifyJWT } from "../middleware/auth.js";
import {
  createService,
  deleteService,
  getServiceById,
  getServices,
  updateService,
} from "../controllers/serviceController.js";
const router = express.Router();

router.get("/services", getServices);
router.get("/services/:id", getServiceById);
router.post("/services", verifyJWT, verifyAdmin, createService);
router.patch("/services/:id", verifyJWT, verifyAdmin, updateService);
router.delete("/services/:id", verifyJWT, verifyAdmin, deleteService);

export default router;
