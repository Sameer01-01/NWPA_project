import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { SimulationService } from "./services/SimulationService";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

const simulationService = new SimulationService(io);

// API Routes
app.get("/api/devices", (req, res) => {
  res.json(simulationService.deviceService.getAllDevices());
});

app.get("/api/nat/mappings", (req, res) => {
  res.json(simulationService.natEngine.getAllMappings());
});

app.post("/api/packets/send", (req, res) => {
  const packet = simulationService.processPacket(req.body);
  res.json({ success: true, packet });
});

app.post("/api/config", (req, res) => {
  simulationService.natEngine.setConfig(req.body);
  res.json({ success: true, config: simulationService.natEngine.getConfig() });
});

app.get("/api/config", (req, res) => {
  res.json(simulationService.natEngine.getConfig());
});

app.post("/api/simulation/reset", (req, res) => {
  simulationService.natEngine.clearMappings();
  io.emit("nat:table-updated", []);
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  // Send initial state
  socket.emit("nat:table-updated", simulationService.natEngine.getAllMappings());

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
