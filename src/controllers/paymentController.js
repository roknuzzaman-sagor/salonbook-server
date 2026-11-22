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
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: appointment.serviceName || "Salon Service",
              description: `${appointment.appointmentDate} ${appointment.timeSlot}`,
            },
            unit_amount: Math.round(Number(appointment.servicePrice) * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: req.user.email,
      metadata: { appointmentId, customerId: req.user.id },
      success_url: `${CLIENT_URL}/payment/success?appointmentId=${appointmentId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/payment/cancel?appointmentId=${appointmentId}`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).send({ message: "Failed to create checkout session", error: error.message });
  }
}

export async function handleStripeWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe) {
    console.error("Stripe webhook error: STRIPE_SECRET_KEY is not configured");
    return res.status(500).send("Stripe is not configured");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook error: STRIPE_WEBHOOK_SECRET is not configured");
    return res.status(500).send("Stripe webhook secret is not configured");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    console.warn("Stripe webhook error: missing stripe-signature header");
    return res.status(400).send("Missing stripe-signature header");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const appointmentId = session.metadata?.appointmentId;
      const customerId = session.metadata?.customerId;

      if (!appointmentId || !ObjectId.isValid(appointmentId)) {
        console.warn("Stripe webhook ignored: missing or invalid appointmentId metadata", {
          sessionId: session.id,
          eventId: event.id,
        });
        return res.json({ received: true });
      }

      if (session.payment_status && session.payment_status !== "paid") {
        console.log("Stripe webhook ignored: checkout session not paid", {
          sessionId: session.id,
          eventId: event.id,
          paymentStatus: session.payment_status,
        });
        return res.json({ received: true });
      }

      const appointment = await collections.appointments.findOne({ _id: new ObjectId(appointmentId) });
      if (!appointment) {
        console.warn("Stripe webhook ignored: appointment not found", {
          appointmentId,
          sessionId: session.id,
          eventId: event.id,
        });
        return res.json({ received: true });
      }

      if (customerId && appointment.customerId && customerId !== appointment.customerId) {
        console.warn("Stripe webhook ignored: metadata customerId does not match appointment", {
          appointmentId,
          sessionId: session.id,
          eventId: event.id,
        });
        return res.json({ received: true });
      }

      await collections.appointments.updateOne(
        { _id: new ObjectId(appointmentId) },
        { $set: { paymentStatus: "paid" } }
      );

      await collections.transactions.updateOne(
        { stripeSessionId: session.id },
        {
          $set: {
            appointmentId,
            customerId: customerId || appointment.customerId || "",
            customerEmail:
              session.customer_details?.email ||
              session.customer_email ||
              appointment.customerEmail ||
              "",
            serviceName: appointment.serviceName || "Salon Service",
            appointmentDate: appointment.appointmentDate || "",
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || "usd",
            stripeSessionId: session.id,
            status: "paid",
            paidAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log("Stripe webhook processed: appointment marked paid", {
        appointmentId,
        sessionId: session.id,
        eventId: event.id,
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", {
      message: error.message,
      eventId: event?.id,
      type: event?.type,
    });
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
