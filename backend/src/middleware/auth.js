const jwt = require("jsonwebtoken");
const { getCollection } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "hira-institute-secret-key-2024";

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
}

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ detail: "Not authenticated" });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getCollection("users").findOne({ id: payload.sub }, { projection: { _id: 0 } });
    if (!user) return res.status(401).json({ detail: "User not found" });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ detail: error.name === "TokenExpiredError" ? "Token expired" : "Invalid token" });
  }
}

function requireRoles(...roles) {
  return [authenticate, (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ detail: "Insufficient permissions" });
    next();
  }];
}

module.exports = { authenticate, createToken, requireRoles };
