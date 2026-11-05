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
// Devices
app.get("/api/devices", (req, res) => {
  res.json(simulationService.deviceService.getAllDevices());
});

app.post("/api/devices", (req, res) => {
  const { name, type, privateIP, publicIP, macAddress, defaultGateway, description } = req.body;
  if (!name || !type || !privateIP) {
    return res.status(400).json({ error: "Name, type, and privateIP are required." });
  }

  const newDevice = simulationService.deviceService.addDevice({
    name,
    type,
    privateIP,
    publicIP,
    macAddress: macAddress || `02:00:${Math.floor(Math.random() * 256).toString(16).padStart(2, "0")}:${Math.floor(Math.random() * 256).toString(16).padStart(2, "0")}:00:01`,
    status: "ONLINE",
    defaultGateway: defaultGateway || "192.168.1.1",
    description: description || "Custom user-added device",
  });

  io.emit("devices:updated", simulationService.deviceService.getAllDevices());
  res.json({ success: true, device: newDevice, devices: simulationService.deviceService.getAllDevices() });
});

app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const removed = simulationService.deviceService.removeDevice(id);
  if (removed) {
    io.emit("devices:updated", simulationService.deviceService.getAllDevices());
    res.json({ success: true, devices: simulationService.deviceService.getAllDevices() });
  } else {
    res.status(404).json({ error: "Device not found" });
  }
});

// Presets
app.get("/api/presets", (req, res) => {
  res.json({
    currentPresetId: simulationService.currentPresetId,
    presets: simulationService.getPresets(),
  });
});

app.post("/api/presets/load", (req, res) => {
  const { presetId } = req.body;
  const preset = simulationService.loadPreset(presetId);
  if (!preset) {
    return res.status(404).json({ error: "Preset not found" });
  }
  res.json({ success: true, preset, currentPresetId: simulationService.currentPresetId });
});

// NAT Mappings
app.get("/api/nat/mappings", (req, res) => {
  res.json(simulationService.natEngine.getAllMappings());
});

// Packets
app.post("/api/packets/send", (req, res) => {
  const packet = simulationService.processPacket(req.body);
  res.json({ success: true, packet });
});

// Batch Traffic Generator (for explaining load, concurrency, & table saturation)
app.post("/api/simulation/batch", (req, res) => {
  const { count = 3 } = req.body;
  const hosts = simulationService.deviceService.getAllDevices().filter(d => d.type === "HOST" || d.type === "SMARTPHONE");
  const targetServer = simulationService.deviceService.getAllDevices().find(d => d.type === "INTERNET") || { privateIP: "8.8.8.8" };

  const generatedPackets = [];
  const packetsToSend = Math.min(Number(count), hosts.length || 1);

  for (let i = 0; i < packetsToSend; i++) {
    const host = hosts[i % hosts.length];
    const sourcePort = 5000 + i * 10 + Math.floor(Math.random() * 9);
    const destPort = [80, 443, 53, 8080][i % 4];

    setTimeout(() => {
      simulationService.processPacket({
        protocol: "TCP",
        sourceIP: host.privateIP,
        sourcePort,
        destinationIP: targetServer.privateIP,
        destinationPort: destPort,
        direction: "OUTBOUND",
        payloadSize: 1024,
      });
    }, i * 350);

    generatedPackets.push({ host: host.name, ip: host.privateIP, port: sourcePort });
  }

  res.json({ success: true, count: generatedPackets.length, batch: generatedPackets });
});

// Configuration
app.post("/api/config", (req, res) => {
  simulationService.natEngine.setConfig(req.body);
  res.json({ success: true, config: simulationService.natEngine.getConfig() });
});

app.get("/api/config", (req, res) => {
  res.json(simulationService.natEngine.getConfig());
});

// Reset
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
  socket.emit("devices:updated", simulationService.deviceService.getAllDevices());
  socket.emit("preset:loaded", { 
    presetId: simulationService.currentPresetId,
    preset: simulationService.getPresets().find(p => p.id === simulationService.currentPresetId)
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
