import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";
import { verifyToken } from "../utils/token.js";

export async function verifyJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).send({ message: "Unauthorized: missing token" });

    const decoded = verifyToken(token);
    const user = await collections.users.findOne({ _id: new ObjectId(decoded.id) });
    if (!user) return res.status(401).send({ message: "Unauthorized: user not found" });
    if (user.isBlocked) return res.status(403).send({ message: "Forbidden: user is blocked" });

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role || "customer",
      name: user.name,
    };
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized: invalid token" });
  }
}

export function verifyAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).send({ message: "Forbidden: admin access required" });
  }
  next();
}

export function verifyCustomer(req, res, next) {
  if (req.user?.role !== "customer") {
    return res.status(403).send({ message: "Forbidden: customer access required" });
  }
  next();
}
