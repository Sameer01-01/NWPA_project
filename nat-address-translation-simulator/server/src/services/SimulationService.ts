import { Packet, Device, NatMode, Protocol } from "shared";
import { NatEngine } from "./NatEngine";
import { PortManager } from "./PortManager";
import { DeviceService } from "./DeviceService";
import { Server } from "socket.io";
import { generateId } from "../utils/idUtils";

export class SimulationService {
  public natEngine: NatEngine;
  public portManager: PortManager;
  public deviceService: DeviceService;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.portManager = new PortManager(40000, 50000);
    this.natEngine = new NatEngine(
      {
        routerLanIP: "192.168.1.1",
        routerWanIP: "203.0.113.5",
        natMode: "PAT",
        publicIpPool: ["203.0.113.10", "203.0.113.11", "203.0.113.12"],
        mappingTtl: 30,
      },
      this.portManager
    );
    this.deviceService = new DeviceService();
    
    // Default Preset
    this.loadDefaultPreset();
    
    // Start expiration tick
    setInterval(() => {
      this.tick();
    }, 1000);
  }

  private loadDefaultPreset() {
    this.deviceService.addDevice({
      name: "PC-01",
      type: "HOST",
      privateIP: "192.168.1.10",
      macAddress: "AA:BB:CC:DD:EE:01",
      status: "ONLINE",
      defaultGateway: "192.168.1.1"
    });
    this.deviceService.addDevice({
      name: "PC-02",
      type: "HOST",
      privateIP: "192.168.1.11",
      macAddress: "AA:BB:CC:DD:EE:02",
      status: "ONLINE",
      defaultGateway: "192.168.1.1"
    });
    this.deviceService.addDevice({
      name: "NAT-ROUTER",
      type: "NAT_ROUTER",
      privateIP: "192.168.1.1",
      publicIP: "203.0.113.5",
      macAddress: "AA:BB:CC:DD:EE:00",
      status: "ONLINE",
    });
    this.deviceService.addDevice({
      name: "INTERNET-SERVER",
      type: "INTERNET",
      privateIP: "8.8.8.8",
      publicIP: "8.8.8.8",
      macAddress: "88:88:88:88:88:88",
      status: "ONLINE",
    });
  }

  public processPacket(packetData: Omit<Packet, "id" | "status" | "timestamp">) {
    const packet: Packet = {
      ...packetData,
      id: generateId(),
      status: "CREATED",
      timestamp: new Date().toISOString()
    };

    this.io.emit("packet:created", packet);

    setTimeout(() => {
      if (packet.direction === "OUTBOUND") {
        this.processOutbound(packet);
      } else {
        this.processInbound(packet);
      }
    }, 500); // Simulated delay
    
    return packet;
  }

  private processOutbound(packet: Packet) {
    packet.status = "PROCESSING";
    this.io.emit("packet:processing", packet);

    const result = this.natEngine.translateOutbound(packet);

    setTimeout(() => {
      if (result.success && result.packet) {
        this.io.emit("packet:translated", result.packet);
        this.io.emit("nat:table-updated", this.natEngine.getAllMappings());
        
        setTimeout(() => {
          result.packet!.status = "DELIVERED";
          this.io.emit("packet:delivered", result.packet);
        }, 1000);
      } else {
        packet.status = "DROPPED";
        this.io.emit("packet:dropped", { packet, reason: result.error });
      }
    }, 500);
  }

  private processInbound(packet: Packet) {
    packet.status = "PROCESSING";
    this.io.emit("packet:processing", packet);

    const result = this.natEngine.translateInbound(packet);

    setTimeout(() => {
      if (result.success && result.packet) {
        this.io.emit("packet:translated", result.packet);
        
        setTimeout(() => {
          result.packet!.status = "DELIVERED";
          this.io.emit("packet:delivered", result.packet);
        }, 1000);
      } else {
        packet.status = "DROPPED";
        this.io.emit("packet:dropped", { packet, reason: result.error });
      }
    }, 500);
  }

  private tick() {
    this.natEngine.tickExpiration();
    this.io.emit("nat:table-updated", this.natEngine.getAllMappings());
  }
}
