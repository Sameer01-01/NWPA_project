import { Packet, NatMapping, NatMode, Protocol } from "shared";
import { PortManager } from "./PortManager";
import { generateId } from "../utils/idUtils";

interface NatEngineConfig {
  routerLanIP: string;
  routerWanIP: string;
  natMode: NatMode;
  publicIpPool: string[]; // for Dynamic NAT
  mappingTtl: number; // in seconds
}

export class NatEngine {
  private config: NatEngineConfig;
  private portManager: PortManager;
  private mappings: Map<string, NatMapping>;
  private nextDynamicIpIndex: number = 0;

  constructor(config: NatEngineConfig, portManager: PortManager) {
    this.config = config;
    this.portManager = portManager;
    this.mappings = new Map();
  }

  public setConfig(config: NatEngineConfig) {
    this.config = config;
  }

  public getConfig() {
    return this.config;
  }

  public getAllMappings(): NatMapping[] {
    return Array.from(this.mappings.values());
  }
  
  public getMappingById(id: string): NatMapping | undefined {
    return this.mappings.get(id);
  }

  public clearMappings(): void {
    this.mappings.clear();
    this.portManager.reset();
  }

  // Generate lookup keys
  private getOutboundKey(protocol: Protocol, sourceIP: string, sourcePort?: number): string {
    return `${protocol}:${sourceIP}:${sourcePort || 0}`;
  }

  private getInboundKey(protocol: Protocol, publicIP: string, publicPort?: number): string {
    return `${protocol}:${publicIP}:${publicPort || 0}`;
  }

  public translateOutbound(packet: Packet): { success: boolean; packet?: Packet; error?: string } {
    let mapping: NatMapping | null | undefined = Array.from(this.mappings.values()).find(
      m => m.insideLocalIP === packet.sourceIP && m.insideLocalPort === packet.sourcePort && m.protocol === packet.protocol
    );

    if (mapping) {
      mapping.lastUsed = new Date().toISOString();
      return this.applyOutboundTranslation(packet, mapping);
    }

    // No existing mapping, create one based on NAT Mode
    mapping = this.createOutboundMapping(packet);
    if (!mapping) {
      return {
        success: false,
        error: this.config.natMode === "PAT" ? "PORT_POOL_EXHAUSTED" : "NAT_POOL_EXHAUSTED"
      };
    }

    this.mappings.set(mapping.id, mapping);
    return this.applyOutboundTranslation(packet, mapping);
  }

  public translateInbound(packet: Packet): { success: boolean; packet?: Packet; error?: string } {
    let mapping = Array.from(this.mappings.values()).find(
      m => m.insideGlobalIP === packet.destinationIP && m.insideGlobalPort === packet.destinationPort && m.protocol === packet.protocol
    );

    if (mapping) {
      mapping.lastUsed = new Date().toISOString();
      return this.applyInboundTranslation(packet, mapping);
    }

    // Port forwarding logic can be added here in the future
    return { success: false, error: "NO_TRANSLATION_MAPPING" };
  }

  private createOutboundMapping(packet: Packet): NatMapping | null {
    const now = new Date().toISOString();
    const baseMapping: Partial<NatMapping> = {
      id: generateId(),
      protocol: packet.protocol,
      insideLocalIP: packet.sourceIP,
      insideLocalPort: packet.sourcePort,
      outsideGlobalIP: packet.destinationIP,
      outsideGlobalPort: packet.destinationPort,
      direction: "OUTBOUND",
      state: "ESTABLISHED",
      createdAt: now,
      lastUsed: now,
      ttl: this.config.mappingTtl
    };

    if (this.config.natMode === "STATIC") {
      // 1:1 NAT (assuming routerWanIP is used)
      return {
        ...baseMapping,
        insideGlobalIP: this.config.routerWanIP,
        insideGlobalPort: packet.sourcePort,
      } as NatMapping;
    }

    if (this.config.natMode === "DYNAMIC") {
      if (this.config.publicIpPool.length === 0) return null;
      // Find an unused IP from the pool (simplified)
      // If a host already uses an IP, we should technically check if it's available
      const activeIps = new Set(Array.from(this.mappings.values()).map(m => m.insideGlobalIP));
      let availableIp = this.config.publicIpPool.find(ip => !activeIps.has(ip));
      
      if (!availableIp) return null; // NAT_POOL_EXHAUSTED
      
      return {
        ...baseMapping,
        insideGlobalIP: availableIp,
        insideGlobalPort: packet.sourcePort,
      } as NatMapping;
    }

    if (this.config.natMode === "PAT") {
      const publicIP = this.config.routerWanIP;
      
      if (packet.protocol === "ICMP") {
         return {
          ...baseMapping,
          insideGlobalIP: publicIP,
          insideGlobalPort: packet.sourcePort, // Using ICMP ID as port
        } as NatMapping;
      }
      
      const port = this.portManager.allocatePort(publicIP, packet.protocol);
      if (!port) return null; // PORT_POOL_EXHAUSTED

      return {
        ...baseMapping,
        insideGlobalIP: publicIP,
        insideGlobalPort: port,
      } as NatMapping;
    }

    return null;
  }

  private applyOutboundTranslation(packet: Packet, mapping: NatMapping): { success: boolean; packet: Packet } {
    const translatedPacket: Packet = {
      ...packet,
      sourceIP: mapping.insideGlobalIP,
      sourcePort: mapping.insideGlobalPort,
      status: "TRANSLATED"
    };
    return { success: true, packet: translatedPacket };
  }

  private applyInboundTranslation(packet: Packet, mapping: NatMapping): { success: boolean; packet: Packet } {
    const translatedPacket: Packet = {
      ...packet,
      destinationIP: mapping.insideLocalIP,
      destinationPort: mapping.insideLocalPort,
      status: "TRANSLATED"
    };
    return { success: true, packet: translatedPacket };
  }
  
  public tickExpiration() {
    const now = new Date();
    for (const [id, mapping] of this.mappings.entries()) {
      const lastUsed = new Date(mapping.lastUsed);
      const diffSeconds = (now.getTime() - lastUsed.getTime()) / 1000;
      if (diffSeconds > mapping.ttl) {
        if (this.config.natMode === "PAT" && mapping.insideGlobalPort && mapping.protocol !== "ICMP") {
            this.portManager.releasePort(mapping.insideGlobalIP, mapping.insideGlobalPort, mapping.protocol);
        }
        this.mappings.delete(id);
      }
    }
  }
}
