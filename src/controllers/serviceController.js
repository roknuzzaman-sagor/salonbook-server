import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";

export async function getServices(req, res) {
  try {
    const { status, category, search, sort } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.serviceName = { $regex: search, $options: "i" };

    let cursor = collections.services.find(query);
    if (sort === "price-asc") cursor = cursor.sort({ price: 1 });
    if (sort === "price-desc") cursor = cursor.sort({ price: -1 });

    const services = await cursor.toArray();
    res.send(services);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch services", error: error.message });
  }
}

export async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid service id" });

    const service = await collections.services.findOne({ _id: new ObjectId(id) });
    if (!service) return res.status(404).send({ message: "Service not found" });

    res.send(service);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch service", error: error.message });
  }
}

export async function createService(req, res) {
  try {
    const service = {
      serviceName: req.body.serviceName,
      category: req.body.category,
      description: req.body.description,
      price: Number(req.body.price),
      duration: Number(req.body.duration),
      image: req.body.image,
      status: req.body.status || "active",
      createdAt: new Date(),
    };

    if (!service.serviceName || !service.category || !service.description || !service.image) {
      return res.status(400).send({ message: "Missing required service fields" });
    }
    if (!(service.price > 0) || !(service.duration > 0)) {
      return res.status(400).send({ message: "Price and duration must be positive numbers" });
    }

    const result = await collections.services.insertOne(service);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to create service", error: error.message });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid service id" });

    const allowed = ["serviceName", "category", "description", "price", "duration", "image", "status"];
    const updateDoc = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updateDoc[key] = key === "price" || key === "duration" ? Number(req.body[key]) : req.body[key];
      }
    }

    const result = await collections.services.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );
    if (!result.matchedCount) return res.status(404).send({ message: "Service not found" });

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update service", error: error.message });
  }
}

export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid service id" });

    const result = await collections.services.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return res.status(404).send({ message: "Service not found" });

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete service", error: error.message });
  }
}
