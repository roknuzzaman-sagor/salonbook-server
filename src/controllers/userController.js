import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";

export async function getUsers(req, res) {
  try {
    const users = await collections.users.find().sort({ createdAt: -1 }).toArray();
    res.send(users.map(({ _id, name, email, image, role, isBlocked }) => ({
      _id, name, email, image, role: role || "customer", isBlocked: !!isBlocked,
    })));
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch users", error: error.message });
  }
}

export async function blockUser(req, res) {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid user id" });

    const result = await collections.users.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isBlocked: !!isBlocked } }
    );
    if (!result.matchedCount) return res.status(404).send({ message: "User not found" });

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update user", error: error.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await collections.users.findOne({ _id: new ObjectId(req.user.id) });
    if (!user) return res.status(404).send({ message: "User not found" });
    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      phone: user.phone || "",
      role: user.role || "customer",
    });
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch profile", error: error.message });
  }
}

export async function updateMe(req, res) {
  try {
    const allowed = ["name", "image", "phone"];
    const updateDoc = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updateDoc[key] = req.body[key];
    }

    const result = await collections.users.updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: updateDoc }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update profile", error: error.message });
  }
}
