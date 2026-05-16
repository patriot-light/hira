const bcrypt = require("bcryptjs");
const { getCollection } = require("../config/database");
const { createUser, publicUser, UserRole } = require("../models");
const { createToken } = require("../middleware/auth");

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createProfileForUser(user, createdAt) {
  if (user.role === UserRole.STUDENT) {
    await getCollection("students").insertOne({
      id: `${user.id}_student`,
      full_name: user.full_name,
      age: 0,
      email: user.email,
      status: "active",
      user_id: user.id,
      halaqa_id: null,
      created_at: createdAt
    });
  }
  if (user.role === UserRole.TEACHER) {
    await getCollection("teachers").insertOne({
      id: `${user.id}_teacher`,
      full_name: user.full_name,
      qualification: "",
      experience_years: 0,
      email: user.email,
      user_id: user.id,
      created_at: createdAt
    });
  }
}

async function register(data) {
  const existing = await getCollection("users").findOne({ email: data.email });
  if (existing) throw httpError(400, "Email already registered");
  const user = createUser(data);
  const password_hash = await bcrypt.hash(data.password, 10);
  await getCollection("users").insertOne({ ...user, password_hash });
  await createProfileForUser(user, user.created_at);
  return { access_token: createToken(user), token_type: "bearer", user: publicUser(user) };
}

async function login(data) {
  const user = await getCollection("users").findOne({ email: data.email }, { projection: { _id: 0 } });
  if (!user || !(await bcrypt.compare(data.password || "", user.password_hash || ""))) {
    throw httpError(401, "Invalid credentials");
  }
  return { access_token: createToken(user), token_type: "bearer", user: publicUser(user) };
}

const DEMO_ADMIN = Object.freeze({
  email: process.env.DEMO_ADMIN_EMAIL || "admin@hira.edu",
  full_name: process.env.DEMO_ADMIN_NAME || "Demo Admin",
  password: process.env.DEMO_ADMIN_PASSWORD || "admin123",
  role: UserRole.ADMIN
});

async function seedDemoAdmin() {
  const users = getCollection("users");
  const existing = await users.findOne({ email: DEMO_ADMIN.email });
  if (existing) return;
  const user = createUser(DEMO_ADMIN);
  const password_hash = await bcrypt.hash(DEMO_ADMIN.password, 10);
  await users.insertOne({ ...user, password_hash });
}

module.exports = { DEMO_ADMIN, httpError, login, register, seedDemoAdmin };
