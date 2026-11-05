import { Packet, Device, NatMode, Protocol, SimulationPreset, SimulationLogEvent } from "shared";
import { NatEngine } from "./NatEngine";
import { PortManager } from "./PortManager";
import { DeviceService } from "./DeviceService";
import { Server } from "socket.io";
import { generateId } from "../utils/idUtils";

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: "soho-pat",
    name: "Home / SOHO Network (PAT Overload)",
    category: "Standard Residential / SOHO",
    description: "Multiple personal devices (PC, Laptop, Smartphone, Smart TV) share a single public IP (203.0.113.5) by translating source port numbers.",
    educationalGoal: "Observe Port Address Translation (NAT Overload) multiplexing hundreds of internal connections onto a single public IPv4 address using dynamic ephemeral ports.",
    natMode: "PAT",
    publicIpPool: ["203.0.113.10", "203.0.113.11", "203.0.113.12"],
    routerLanIP: "192.168.1.1",
    routerWanIP: "203.0.113.5",
    devices: [
      { name: "PC-01 (Desktop)", type: "HOST", privateIP: "192.168.1.10", macAddress: "AA:BB:CC:DD:EE:01", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Home desktop workstation" },
      { name: "Laptop-Work", type: "HOST", privateIP: "192.168.1.11", macAddress: "AA:BB:CC:DD:EE:02", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Telecommuting office laptop" },
      { name: "Smartphone-5G", type: "SMARTPHONE", privateIP: "192.168.1.12", macAddress: "AA:BB:CC:DD:EE:03", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Mobile Wi-Fi client" },
      { name: "Smart-TV-4K", type: "IOT", privateIP: "192.168.1.13", macAddress: "AA:BB:CC:DD:EE:04", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Streaming media device" },
      { name: "NAT-ROUTER", type: "NAT_ROUTER", privateIP: "192.168.1.1", publicIP: "203.0.113.5", macAddress: "AA:BB:CC:DD:EE:00", status: "ONLINE", description: "Border Gateway & NAT Switch" },
      { name: "Google-DNS", type: "INTERNET", privateIP: "8.8.8.8", publicIP: "8.8.8.8", macAddress: "88:88:88:88:88:88", status: "ONLINE", description: "Public DNS resolver" },
      { name: "Cloudflare-CDN", type: "INTERNET", privateIP: "1.1.1.1", publicIP: "1.1.1.1", macAddress: "11:11:11:11:11:11", status: "ONLINE", description: "Public Web Content Cache" },
    ]
  },
  {
    id: "dmz-static",
    name: "Enterprise DMZ & Web Hosting (Static 1:1)",
    category: "Corporate & Enterprise Hosting",
    description: "An internal Web Server (192.168.1.80) is mapped 1:1 to a public IP, allowing remote Internet clients to access it while employee workstations browse outbound.",
    educationalGoal: "Learn how Static NAT provides bi-directional transparency for internal servers requiring external access without revealing private network schemes.",
    natMode: "STATIC",
    publicIpPool: ["203.0.113.80"],
    routerLanIP: "192.168.1.1",
    routerWanIP: "203.0.113.5",
    devices: [
      { name: "Workstation-A", type: "HOST", privateIP: "192.168.1.20", macAddress: "AA:01:02:03:04:01", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Corporate staff PC" },
      { name: "Workstation-B", type: "HOST", privateIP: "192.168.1.21", macAddress: "AA:01:02:03:04:02", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Corporate staff PC" },
      { name: "Internal-Web-Server", type: "SERVER", privateIP: "192.168.1.80", macAddress: "AA:01:02:03:04:80", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Internal HTTP/HTTPS web application" },
      { name: "NAT-ROUTER", type: "NAT_ROUTER", privateIP: "192.168.1.1", publicIP: "203.0.113.5", macAddress: "AA:BB:CC:DD:EE:00", status: "ONLINE", description: "Enterprise Boundary Firewall/NAT" },
      { name: "External-Client", type: "INTERNET", privateIP: "198.51.100.99", publicIP: "198.51.100.99", macAddress: "99:99:99:99:99:99", status: "ONLINE", description: "Remote customer browser on Internet" },
      { name: "Cloud-SaaS", type: "INTERNET", privateIP: "198.51.100.25", publicIP: "198.51.100.25", macAddress: "25:25:25:25:25:25", status: "ONLINE", description: "External Enterprise SaaS API" },
    ]
  },
  {
    id: "dynamic-exhaustion",
    name: "Dynamic NAT Pool Exhaustion Demonstration",
    category: "IPv4 Resource Scarcity & Bottlenecks",
    description: "Five internal hosts compete for only TWO available public IPs in the pool (203.0.113.10 and 203.0.113.11). Once both IPs are leased, subsequent hosts are dropped.",
    educationalGoal: "Demonstrate why traditional Dynamic NAT failed to scale for the modern Internet, forcing the universal adoption of PAT (Port Address Translation).",
    natMode: "DYNAMIC",
    publicIpPool: ["203.0.113.10", "203.0.113.11"],
    routerLanIP: "192.168.1.1",
    routerWanIP: "203.0.113.5",
    devices: [
      { name: "Host-Alpha", type: "HOST", privateIP: "192.168.1.10", macAddress: "CC:01:01:01:01:01", status: "ONLINE", defaultGateway: "192.168.1.1", description: "First client to request connection" },
      { name: "Host-Beta", type: "HOST", privateIP: "192.168.1.11", macAddress: "CC:01:01:01:01:02", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Second client to request connection" },
      { name: "Host-Gamma", type: "HOST", privateIP: "192.168.1.12", macAddress: "CC:01:01:01:01:03", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Third client (triggers pool exhaustion!)" },
      { name: "Host-Delta", type: "HOST", privateIP: "192.168.1.13", macAddress: "CC:01:01:01:01:04", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Fourth client (dropped)" },
      { name: "Host-Epsilon", type: "HOST", privateIP: "192.168.1.14", macAddress: "CC:01:01:01:01:05", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Fifth client (dropped)" },
      { name: "NAT-ROUTER", type: "NAT_ROUTER", privateIP: "192.168.1.1", publicIP: "203.0.113.5", macAddress: "AA:BB:CC:DD:EE:00", status: "ONLINE", description: "Pool Gateway (Pool Size: 2)" },
      { name: "Internet-Target", type: "INTERNET", privateIP: "8.8.8.8", publicIP: "8.8.8.8", macAddress: "88:88:88:88:88:88", status: "ONLINE", description: "Target public destination" },
    ]
  },
  {
    id: "security-drop",
    name: "Inbound Attack & Stateful Firewall Drop",
    category: "Network Perimeter Defense",
    description: "An external malicious scanner attempts to initiate direct unsolicited connections to internal private machines. Because no matching state exists in NAT memory, packets are dropped.",
    educationalGoal: "Observe how NAT functions as an inherent one-way security firewall, protecting private subnets from unsolicited inbound reconnaissance and port scanning.",
    natMode: "PAT",
    publicIpPool: ["203.0.113.10"],
    routerLanIP: "192.168.1.1",
    routerWanIP: "203.0.113.5",
    devices: [
      { name: "Internal-Workstation", type: "HOST", privateIP: "192.168.1.10", macAddress: "DD:01:01:01:01:01", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Protected corporate user workstation" },
      { name: "Internal-Database", type: "SERVER", privateIP: "192.168.1.50", macAddress: "DD:01:01:01:01:50", status: "ONLINE", defaultGateway: "192.168.1.1", description: "Sensitive internal database" },
      { name: "NAT-ROUTER", type: "NAT_ROUTER", privateIP: "192.168.1.1", publicIP: "203.0.113.5", macAddress: "AA:BB:CC:DD:EE:00", status: "ONLINE", description: "Stateful NAT Firewall Gateway" },
      { name: "Safe-Web-Server", type: "INTERNET", privateIP: "8.8.8.8", publicIP: "8.8.8.8", macAddress: "88:88:88:88:88:88", status: "ONLINE", description: "Legitimate public server" },
      { name: "External-Attacker", type: "INTERNET", privateIP: "198.51.100.66", publicIP: "198.51.100.66", macAddress: "66:66:66:66:66:66", status: "ONLINE", description: "Malicious Internet scanner / probe" },
    ]
  }
];

export class SimulationService {
  public natEngine: NatEngine;
  public portManager: PortManager;
  public deviceService: DeviceService;
  public currentPresetId: string = "soho-pat";
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
    
    // Load initial default preset
    this.loadPreset("soho-pat");
    
    // Start expiration tick
    setInterval(() => {
      this.tick();
    }, 1000);
  }

  public getPresets(): SimulationPreset[] {
    return SIMULATION_PRESETS;
  }

  public loadPreset(presetId: string): SimulationPreset | undefined {
    const preset = SIMULATION_PRESETS.find(p => p.id === presetId);
    if (!preset) return undefined;

    this.currentPresetId = preset.id;
    this.natEngine.clearMappings();
    this.natEngine.setConfig({
      routerLanIP: preset.routerLanIP,
      routerWanIP: preset.routerWanIP,
      natMode: preset.natMode,
      publicIpPool: preset.publicIpPool,
      mappingTtl: 30,
    });

    this.deviceService.setDevices(preset.devices);

    // Emit updates to clients
    this.io.emit("preset:loaded", { presetId: preset.id, preset });
    this.io.emit("devices:updated", this.deviceService.getAllDevices());
    this.io.emit("nat:table-updated", this.natEngine.getAllMappings());

    return preset;
  }

  public processPacket(packetData: Omit<Packet, "id" | "status" | "timestamp">) {
    const packet: Packet = {
      ...packetData,
      id: generateId(),
      status: "CREATED",
      timestamp: new Date().toISOString()
    };

    // Emit packet created with rich metadata
    this.io.emit("packet:created", packet);

    setTimeout(() => {
      if (packet.direction === "OUTBOUND") {
        this.processOutbound(packet);
      } else {
        this.processInbound(packet);
      }
    }, 400); // Simulated transmission delay
    
    return packet;
  }

  private processOutbound(packet: Packet) {
    packet.status = "PROCESSING";
    this.io.emit("packet:processing", packet);

    const sourceDevice = this.deviceService.getDeviceByIP(packet.sourceIP);
    const hostName = sourceDevice?.name || packet.sourceIP;

    const result = this.natEngine.translateOutbound(packet, hostName);

    setTimeout(() => {
      if (result.success && result.packet) {
        this.io.emit("packet:translated", result.packet);
        this.io.emit("nat:table-updated", this.natEngine.getAllMappings());
        
        setTimeout(() => {
          result.packet!.status = "DELIVERED";
          this.io.emit("packet:delivered", result.packet);
        }, 800);
      } else {
        packet.status = "DROPPED";
        packet.dropReason = result.explanation || result.error;
        this.io.emit("packet:dropped", { 
          packet, 
          reason: result.error,
          explanation: result.explanation 
        });
      }
    }, 400);
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
        }, 800);
      } else {
        packet.status = "DROPPED";
        packet.dropReason = result.explanation || result.error;
        this.io.emit("packet:dropped", { 
          packet, 
          reason: result.error,
          explanation: result.explanation 
        });
      }
    }, 400);
  }

  private tick() {
    this.natEngine.tickExpiration();
    this.io.emit("nat:table-updated", this.natEngine.getAllMappings());
  }
}
