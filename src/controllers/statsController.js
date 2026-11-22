import { collections } from "../config/db.js";

export async function getAdminStats(req, res) {
  try {
    const [totalCustomers, totalActiveServices, totalAppointments, pending, confirmed, successfulPayments] = await Promise.all([
      collections.users.countDocuments({ role: { $ne: "admin" } }),
      collections.services.countDocuments({ status: "active" }),
      collections.appointments.countDocuments(),
      collections.appointments.countDocuments({ status: "pending" }),
      collections.appointments.countDocuments({ status: "confirmed" }),
      collections.transactions.countDocuments({ status: "paid" }),
    ]);

    res.send({ totalCustomers, totalActiveServices, totalAppointments, pending, confirmed, successfulPayments });
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch stats", error: error.message });
  }
}

export async function getCustomerStats(req, res) {
  try {
    const query = { customerId: req.user.id };
    const [total, pending, confirmed, cancelled] = await Promise.all([collections.appointments.countDocuments(query),
      collections.appointments.countDocuments({ ...query, status: "pending" }),
      collections.appointments.countDocuments({ ...query, status: "confirmed" }),
      collections.appointments.countDocuments({ ...query, status: "cancelled" }),
      
    ]);

    res.send({ total, pending, confirmed, cancelled });
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch stats", error: error.message });
  }
}
