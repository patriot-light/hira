require("dotenv").config();

const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const { connectDatabase } = require("./config/database");
const { errorHandler, notFound } = require("./middleware/error");
const { seedDemoAdmin } = require("./services/authService");
const { seedErrorTypes } = require("./services/evaluationService");

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim());
app.use(
  cors({
    origin: corsOrigins.includes("*") ? true : corsOrigins,
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "12mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/usersRoutes"));
app.use("/api/students", require("./routes/studentsRoutes"));
app.use("/api/teachers", require("./routes/teachersRoutes"));
app.use("/api/halaqas", require("./routes/halaqasRoutes"));
app.use("/api/staff", require("./routes/staffRoutes"));
app.use("/api/error-types", require("./routes/errorTypesRoutes"));
app.use("/api/evaluations", require("./routes/evaluationsRoutes"));
app.use("/api/sessions", require("./routes/sessionsRoutes"));
app.use("/api/reports", require("./routes/reportsRoutes"));
app.use("/api/export", require("./routes/exportRoutes"));
app.use("/api/certificates", require("./routes/certificatesRoutes"));
app.use("/api/notifications", require("./routes/notificationsRoutes"));

app.use(notFound);
app.use(errorHandler);

async function initialize() {
  await connectDatabase();
  await seedDemoAdmin();
  await seedErrorTypes();
  return app;
}

module.exports = { app, initialize };
