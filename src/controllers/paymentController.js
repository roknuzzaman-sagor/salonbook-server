import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export async function createCheckoutSession(req, res) {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(500).send({ message: "Stripe is not configured" });

    const { appointmentId } = req.body;
    if (!ObjectId.isValid(appointmentId)) return res.status(400).send({ message: "Invalid appointment id" });

    const appointment = await collections.appointments.findOne({ _id: new ObjectId(appointmentId) });
    if (!appointment) return res.status(404).send({ message: "Appointment not found" });
    if (appointment.customerId !== req.user.id) return res.status(403).send({ message: "Forbidden" });
    if (appointment.status !== "confirmed") return res.status(400).send({ message: "Only confirmed appointments can be paid" });
    if (appointment.paymentStatus === "paid") return res.status(400).send({ message: "Appointment already paid" });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: appointment.serviceName || "Salon Service",
              description: `Appointment on ${appointment.appointmentDate} at ${appointment.timeSlot}`,
            },
            unit_amount: Math.round(Number(appointment.servicePrice) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&appointmentId=${appointmentId}`,
      cancel_url: `${CLIENT_URL}/payment/cancel?appointmentId=${appointmentId}`,
      metadata: { appointmentId, customerId: req.user.id },
      customer_email: req.user.email,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error.message);
    res.status(500).send({ message: "Failed to create checkout session", error: error.message });
  }
}

export async function handleStripeWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook not configured");
    return res.status(500).send("Stripe webhook not configured");
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const appointmentId = session.metadata?.appointmentId;
      const customerId = session.metadata?.customerId;

      if (appointmentId && ObjectId.isValid(appointmentId)) {
        const appointment = await collections.appointments.findOne({ _id: new ObjectId(appointmentId) });

        await collections.appointments.updateOne(
          { _id: new ObjectId(appointmentId) },
          { $set: { paymentStatus: "paid" } }
        );

        await collections.transactions.updateOne(
          { stripeSessionId: session.id },
          {
            $set: {
              appointmentId,
              customerId: customerId || appointment?.customerId || "",
              customerEmail:
                session.customer_details?.email ||
                session.customer_email ||
                appointment?.customerEmail ||
                "",
              serviceName: appointment?.serviceName || "Salon Service",
              appointmentDate: appointment?.appointmentDate || "",
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || "usd",
              stripeSessionId: session.id,
              status: "paid",
              paidAt: new Date(),
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
        console.log("Stripe payment confirmed for appointment", appointmentId);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error.message);
    res.status(500).send("Webhook handler failed");
  }
}

export async function getTransactions(req, res) {
  try {
    const result = await collections.transactions.find().sort({ createdAt: -1 }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch transactions", error: error.message });
  }
}
