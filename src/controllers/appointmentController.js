import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";

export async function createAppointment(req, res) {
  try {
    const { serviceId, appointmentDate, timeSlot, message } = req.body;
    if (!ObjectId.isValid(serviceId)) return res.status(400).send({ message: "Invalid service id" });

    const service = await collections.services.findOne({ _id: new ObjectId(serviceId) });
    if (!service) return res.status(404).send({ message: "Service not found" });
    if (service.status !== "active") return res.status(400).send({ message: "Service is inactive" });
    if (!appointmentDate || !timeSlot) return res.status(400).send({ message: "Date and time slot are required" });

    const duplicate = await collections.appointments.findOne({
      serviceId,
      appointmentDate,
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });
    if (duplicate) return res.status(409).send({ message: "This time slot is already booked" });

    const doc = {
      serviceId,
      customerId: req.user.id,
      customerEmail: req.user.email,
      customerName: req.user.name || "",
      serviceName: service.serviceName,
      serviceCategory: service.category,
      serviceImage: service.image,
      appointmentDate,
      timeSlot,
      message: message || "",
      servicePrice: Number(service.price),
      paymentStatus: "unpaid",
      status: "pending",
      createdAt: new Date(),
    };

    const result = await collections.appointments.insertOne(doc);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to create appointment", error: error.message });
  }
}

export async function getMyAppointments(req, res) {
  try {
    const result = await collections.appointments
      .find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch appointments", error: error.message });
  }
}

export async function getAllAppointments(req, res) {
  try {
    const result = await collections.appointments.find().sort({ createdAt: -1 }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch appointments", error: error.message });
  }
}

export async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid appointment id" });

    const appointment = await collections.appointments.findOne({ _id: new ObjectId(id) });
    if (!appointment) return res.status(404).send({ message: "Appointment not found" });

    if (req.user.role === "customer") {
      if (appointment.customerId !== req.user.id) return res.status(403).send({ message: "Forbidden" });
      if (status !== "cancelled" || appointment.status !== "pending") {
        return res.status(400).send({ message: "Customers can only cancel pending appointments" });
      }
    } else if (req.user.role === "admin") {
      if (!["confirmed", "cancelled"].includes(status)) return res.status(400).send({ message: "Invalid status" });
      if (status === "confirmed" && appointment.status !== "pending") {
        return res.status(400).send({ message: "Only pending appointments can be confirmed" });
      }
    } else {
      return res.status(403).send({ message: "Forbidden" });
    }

    const result = await collections.appointments.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update appointment", error: error.message });
  }
}
