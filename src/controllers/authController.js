import { collections } from "../config/db.js";
import { createToken } from "../utils/token.js";

export async function exchangeToken(req, res) {
  try {
    const { email, secret } = req.body;
    const expected = process.env.INTERNAL_API_SECRET;
    if (expected && secret !== expected) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const user = await collections.users.findOne({ email });
    if (!user) return res.status(404).send({ message: "User not found" });
    if (user.isBlocked) return res.status(403).send({ message: "User is blocked" });

    const token = createToken(user);
    res.send({ token, role: user.role || "customer" });
  } catch (error) {
    res.status(500).send({ message: "Failed to create token", error: error.message });
  }
}

export async function setupAdmin(req, res) {
  try {
    const { email, secret } = req.body;
    if (!process.env.INTERNAL_API_SECRET || secret !== process.env.INTERNAL_API_SECRET) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const result = await collections.users.updateOne(
      { email },
      { $set: { role: "admin", isBlocked: false } }
    );
    if (!result.matchedCount) return res.status(404).send({ message: "User not found" });

    res.send({ message: "Admin role assigned", email });
  } catch (error) {
    res.status(500).send({ message: "Failed to assign admin", error: error.message });
  }
}
