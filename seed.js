import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const services = [
  {
    serviceName: "Classic Haircut",
    category: "Haircut & Styling",
    description: "A precision haircut tailored to your face shape and style, finished with a professional blow-dry.",
    price: 35,
    duration: 45,
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80",
    status: "active",
    createdAt: new Date(),
  },
  {
    serviceName: "Balayage Highlights",
    category: "Hair Coloring",
    description: "Hand-painted highlights for a natural, sun-kissed look with seamless blending and shine.",
    price: 120,
    duration: 150,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    status: "active",
    createdAt: new Date(),
  },
  {
    serviceName: "Deep Hydration Facial",
    category: "Facial & Skincare",
    description: "A nourishing facial treatment that restores moisture, calms skin, and leaves a healthy glow.",
    price: 65,
    duration: 60,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
    status: "active",
    createdAt: new Date(),
  },
  {
    serviceName: "Bridal Makeup",
    category: "Makeup",
    description: "Long-lasting bridal makeup with a personalized consultation to create your perfect wedding look.",
    price: 150,
    duration: 90,
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80",
    status: "active",
    createdAt: new Date(),
  },
  {
    serviceName: "Deluxe Manicure",
    category: "Manicure & Pedicure",
    description: "Complete nail care with shaping, cuticle treatment, massage, and polish for elegant hands.",
    price: 40,
    duration: 50,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80",
    status: "active",
    createdAt: new Date(),
  },
  {
    serviceName: "Relaxing Aromatherapy Massage",
    category: "Spa & Massage",
    description: "A full-body massage with essential oils designed to relieve tension and restore calm.",
    price: 85,
    duration: 75,
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
    status: "active",
    createdAt: new Date(),
  },
];

const client = new MongoClient(process.env.DB_URL);

async function run() {
  await client.connect();
  const db = client.db("salonbook");
  const collection = db.collection("services");
  const existing = await collection.countDocuments();
  if (existing > 0) {
    console.log(`Services already exist: ${existing}. Skipping seed.`);
  } else {
    const result = await collection.insertMany(services);
    console.log(`Inserted ${result.insertedCount} services.`);
  }
  await client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
