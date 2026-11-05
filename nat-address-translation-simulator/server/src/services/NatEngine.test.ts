import { describe, it, expect, beforeEach } from "vitest";
import { NatEngine } from "./NatEngine";
import { PortManager } from "./PortManager";
import { Packet } from "shared";

describe("NatEngine", () => {
  let portManager: PortManager;
  let natEngine: NatEngine;

  beforeEach(() => {
    portManager = new PortManager(40000, 40010);
    natEngine = new NatEngine(
      {
        routerLanIP: "192.168.1.1",
        routerWanIP: "203.0.113.5",
        natMode: "PAT",
        publicIpPool: ["203.0.113.10", "203.0.113.11"],
        mappingTtl: 30,
      },
      portManager
    );
  });

  it("should handle basic PAT outbound translation", () => {
    const packet: Packet = {
      id: "p1",
      protocol: "TCP",
      sourceIP: "192.168.1.10",
      sourcePort: 5000,
      destinationIP: "8.8.8.8",
      destinationPort: 443,
      direction: "OUTBOUND",
      payloadSize: 100,
      timestamp: new Date().toISOString(),
      status: "CREATED",
    };

    const result = natEngine.translateOutbound(packet);
    expect(result.success).toBe(true);
    expect(result.packet?.sourceIP).toBe("203.0.113.5");
    expect(result.packet?.sourcePort).toBe(40000);

    const mappings = natEngine.getAllMappings();
    expect(mappings.length).toBe(1);
    expect(mappings[0].insideLocalIP).toBe("192.168.1.10");
    expect(mappings[0].insideGlobalPort).toBe(40000);
  });

  it("should handle PAT return packet (inbound)", () => {
    const packetOut: Packet = {
      id: "p1",
      protocol: "TCP",
      sourceIP: "192.168.1.10",
      sourcePort: 5000,
      destinationIP: "8.8.8.8",
      destinationPort: 443,
      direction: "OUTBOUND",
      payloadSize: 100,
      timestamp: new Date().toISOString(),
      status: "CREATED",
    };

    natEngine.translateOutbound(packetOut);

    const packetIn: Packet = {
      id: "p2",
      protocol: "TCP",
      sourceIP: "8.8.8.8",
      sourcePort: 443,
      destinationIP: "203.0.113.5",
      destinationPort: 40000,
      direction: "INBOUND",
      payloadSize: 100,
      timestamp: new Date().toISOString(),
      status: "CREATED",
    };

    const result = natEngine.translateInbound(packetIn);
    expect(result.success).toBe(true);
    expect(result.packet?.destinationIP).toBe("192.168.1.10");
    expect(result.packet?.destinationPort).toBe(5000);
  });

  it("should drop inbound packet without mapping", () => {
    const packetIn: Packet = {
      id: "p2",
      protocol: "TCP",
      sourceIP: "8.8.8.8",
      sourcePort: 443,
      destinationIP: "203.0.113.5",
      destinationPort: 40000,
      direction: "INBOUND",
      payloadSize: 100,
      timestamp: new Date().toISOString(),
      status: "CREATED",
    };

    const result = natEngine.translateInbound(packetIn);
    expect(result.success).toBe(false);
    expect(result.error).toBe("NO_TRANSLATION_MAPPING");
  });

  it("should exhaust PAT ports", () => {
    portManager.setPortRange(40000, 40001); // Only 2 ports

    const packet1: Packet = {
      id: "p1",
      protocol: "TCP",
      sourceIP: "192.168.1.10",
      sourcePort: 5000,
      destinationIP: "8.8.8.8",
      destinationPort: 443,
      direction: "OUTBOUND",
      payloadSize: 100,
      timestamp: new Date().toISOString(),
      status: "CREATED",
    };
    
    const packet2: Packet = { ...packet1, id: "p2", sourceIP: "192.168.1.11" };
    const packet3: Packet = { ...packet1, id: "p3", sourceIP: "192.168.1.12" };

    const r1 = natEngine.translateOutbound(packet1);
    const r2 = natEngine.translateOutbound(packet2);
    const r3 = natEngine.translateOutbound(packet3);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(false);
    expect(r3.error).toBe("PORT_POOL_EXHAUSTED");
  });
  
  it("should expire mappings based on TTL", () => {
    natEngine.setConfig({
      routerLanIP: "192.168.1.1",
      routerWanIP: "203.0.113.5",
      natMode: "PAT",
      publicIpPool: [],
      mappingTtl: 1, // 1 second TTL
    });
    
    const packet: Packet = {
      id: "p1",
      protocol: "TCP",
      sourceIP: "192.168.1.10",
      sourcePort: 5000,
      destinationIP: "8.8.8.8",
      destinationPort: 443,
      direction: "OUTBOUND",
      payloadSize: 100,
      timestamp: new Date().toISOString(),
      status: "CREATED",
    };

    natEngine.translateOutbound(packet);
    expect(natEngine.getAllMappings().length).toBe(1);
    
    // Simulate time passing and checking expiration
    const mapping = natEngine.getAllMappings()[0];
    mapping.lastUsed = new Date(Date.now() - 2000).toISOString(); // Set last used to 2 seconds ago
    
    natEngine.tickExpiration();
    expect(natEngine.getAllMappings().length).toBe(0);
  });
});
