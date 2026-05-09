const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const lookupRoutes = require("./routes/lookup.routes");
const departmentsRoutes = require("./routes/departments.routes");
const campaignsRoutes = require("./routes/campaigns.routes");

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend ERP berjalan...",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/lookup", lookupRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/campaigns", campaignsRoutes);

// Fallback 404 untuk path /api/* yang tidak match
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan", path: req.originalUrl });
});

module.exports = app;
