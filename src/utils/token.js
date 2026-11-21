import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "dev-secret";

export function createToken(user) {
  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      role: user.role || "customer",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
