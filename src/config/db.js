import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.DB_URL);

export const collections = {
  services: null,
  appointments: null,
  transactions: null,
  users: null,
};

export async function connectDB() {
  await client.connect();
  const db = client.db("salonbook");
  collections.services = db.collection("services");
  collections.appointments = db.collection("appointments");
  collections.transactions = db.collection("transactions");
  collections.users = db.collection("user");
  console.log("Connected to MongoDB");
}
