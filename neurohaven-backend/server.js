require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");

const overviewRoutes = require("./routes/overview");
const patientRoutes = require("./routes/patients");
const reportRoutes = require("./routes/reports");
const alertRoutes = require("./routes/alerts");
const settingsRoutes = require("./routes/settings");
const chatRoutes = require("./routes/chats");
const adminRoutes = require("./routes/admin");

const { initSocket } = require("./config/socket");
const { errorHandler } = require("./middleware/error");

const app = express();
const PORT = process.env.PORT || 3001;

// Create combined HTTP & Socket server
const server = http.createServer(app);
initSocket(server);

// Standard Middlewares
app.use(cors({
  origin: "*",
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning", "Accept", "X-Requested-With"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Preflight & ngrok CORS header middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(morgan("dev"));
app.use(express.json());

// Base health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Mounted Routes
app.use("/api/overview", overviewRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/admin", adminRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  NeuroHaven Backend Server running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`  Real-time WebSockets (Socket.IO): active`);
  console.log(`==================================================`);
});

module.exports = server;
