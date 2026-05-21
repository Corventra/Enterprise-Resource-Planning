const path = require("path");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const lookupRoutes = require("./routes/lookup.routes");
const departmentsRoutes = require("./routes/departments.routes");
const campaignsRoutes = require("./routes/campaigns.routes");
const {
  campaignFormsRouter,
  formBuilderRouter,
  fieldOptionsRouter,
} = require("./routes/forms.routes");
const publicFormsRoutes = require("./routes/public-forms.routes");
const bankDataRoutes = require("./routes/bank-data.routes");
const leadTrackerRoutes = require("./routes/lead-tracker.routes");
const leadWorkspaceRoutes = require("./routes/lead-workspace.routes");
const proposalMastersRoutes = require("./routes/proposal-masters.routes");
const approvalsRoutes = require("./routes/approvals.routes");
const handoverRoutes = require("./routes/handover.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const projectsRoutes = require("./routes/projects.routes");
const kpiRoutes = require("./routes/kpi.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

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

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    index: false,
    fallthrough: true
  })
);

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
app.use("/api/campaigns", campaignFormsRouter);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/forms", formBuilderRouter);
app.use("/api/fields", fieldOptionsRouter);
app.use("/api/public/forms", publicFormsRoutes);
app.use("/api/bank-data", bankDataRoutes);
app.use("/api/lead-tracker", leadTrackerRoutes);
app.use("/api/lead-workspace", leadWorkspaceRoutes);
app.use("/api/proposal-masters", proposalMastersRoutes);
app.use("/api/approvals", approvalsRoutes);
app.use("/api/handovers", handoverRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/kpi", kpiRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Fallback 404 untuk path /api/* yang tidak match
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan", path: req.originalUrl });
});

module.exports = app;
