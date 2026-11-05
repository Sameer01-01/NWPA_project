import { Packet, NatMapping, NatMode, Protocol, PacketHeaders, TranslationDetails, HeaderDiff } from "shared";
import { PortManager } from "./PortManager";
import { generateId } from "../utils/idUtils";

export interface NatEngineConfig {
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

  constructor(config: NatEngineConfig, portManager: PortManager) {
    this.config = config;
    this.portManager = portManager;
    this.mappings = new Map();
  }

  public setConfig(config: NatEngineConfig) {
    this.config = config;
  }

  public getConfig(): NatEngineConfig {
    return this.config;
  }

  public getAllMappings(): NatMapping[] {
    const now = new Date();
    for (const mapping of this.mappings.values()) {
      const lastUsed = new Date(mapping.lastUsed);
      const diffSeconds = (now.getTime() - lastUsed.getTime()) / 1000;
      mapping.remainingTtl = Math.max(0, Math.round(mapping.ttl - diffSeconds));
    }
    return Array.from(this.mappings.values());
  }
  
  public getMappingById(id: string): NatMapping | undefined {
    return this.mappings.get(id);
  }

  public clearMappings(): void {
    this.mappings.clear();
    this.portManager.reset();
  }

  private generateHexChecksum(): string {
    return "0x" + Math.floor(Math.random() * 65535).toString(16).padStart(4, "0").toUpperCase();
  }

  private generateIdentification(): string {
    return "0x" + Math.floor(Math.random() * 65535).toString(16).padStart(4, "0").toUpperCase();
  }

  private buildDefaultHeaders(packet: Packet): PacketHeaders {
    return {
      ipVersion: "IPv4",
      ipHeaderLength: 20,
      typeOfService: "0x00 (Best Effort Routine)",
      identification: this.generateIdentification(),
      ttl: 64,
      flags: packet.protocol === "TCP" ? ["SYN"] : ["DATA"],
      sequenceNumber: packet.protocol === "TCP" ? Math.floor(Math.random() * 1000000) : undefined,
      acknowledgmentNumber: packet.protocol === "TCP" ? 0 : undefined,
      windowSize: 65535,
      checksum: this.generateHexChecksum(),
      payloadPreview: packet.protocol === "TCP" 
        ? `TCP SYN [Win=65535, MSS=1460, SACK_PERM]`
        : packet.protocol === "UDP"
        ? `UDP Payload [Len=${packet.payloadSize}B, Port=${packet.destinationPort}]`
        : `ICMP Echo Request [ID=0x1a2b, Seq=1]`,
    };
  }

  public translateOutbound(packet: Packet, hostName?: string): { success: boolean; packet?: Packet; error?: string; explanation?: string } {
    if (!packet.headers) {
      packet.headers = this.buildDefaultHeaders(packet);
    }

    let mapping: NatMapping | null | undefined = Array.from(this.mappings.values()).find(
      m => m.insideLocalIP === packet.sourceIP && m.insideLocalPort === packet.sourcePort && m.protocol === packet.protocol
    );

    if (mapping) {
      mapping.lastUsed = new Date().toISOString();
      mapping.packetCount += 1;
      mapping.bytesTransferred += (packet.payloadSize || 1024);
      return this.applyOutboundTranslation(packet, mapping, false);
    }

    // No existing mapping, create one based on NAT Mode
    mapping = this.createOutboundMapping(packet, hostName);
    if (!mapping) {
      const isDynamic = this.config.natMode === "DYNAMIC";
      const errorMsg = isDynamic ? "NAT_POOL_EXHAUSTED" : "PORT_POOL_EXHAUSTED";
      const explanation = isDynamic
        ? `Dynamic NAT pool exhausted: All public IPs in pool [${this.config.publicIpPool.join(", ")}] are currently occupied by active sessions. Host ${packet.sourceIP} cannot be allocated an address.`
        : `PAT port exhaustion: Port manager ran out of available ephemeral ports on public gateway ${this.config.routerWanIP}.`;
      return {
        success: false,
        error: errorMsg,
        explanation
      };
    }

    this.mappings.set(mapping.id, mapping);
    return this.applyOutboundTranslation(packet, mapping, true);
  }

  public translateInbound(packet: Packet): { success: boolean; packet?: Packet; error?: string; explanation?: string } {
    if (!packet.headers) {
      packet.headers = this.buildDefaultHeaders(packet);
      packet.headers.ttl = 58; // Inbound from Internet has traversed intermediate hops
    }

    const mapping = Array.from(this.mappings.values()).find(
      m => m.insideGlobalIP === packet.destinationIP && m.insideGlobalPort === packet.destinationPort && m.protocol === packet.protocol
    );

    if (mapping) {
      mapping.lastUsed = new Date().toISOString();
      mapping.packetCount += 1;
      mapping.bytesTransferred += (packet.payloadSize || 1024);
      return this.applyInboundTranslation(packet, mapping);
    }

    // Inbound packet with no state in NAT table
    const explanation = `Inbound security drop: Unsolicited packet arrived at WAN IP ${packet.destinationIP}:${packet.destinationPort} from external host ${packet.sourceIP}. NAT firewall blocked transmission because no active translation entry exists for this destination port.`;
    return {
      success: false,
      error: "NO_TRANSLATION_MAPPING",
      explanation
    };
  }

  private createOutboundMapping(packet: Packet, hostName?: string): NatMapping | null {
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
      ttl: this.config.mappingTtl,
      packetCount: 1,
      bytesTransferred: packet.payloadSize || 1024,
      sourceHostName: hostName || packet.sourceIP,
    };

    if (this.config.natMode === "STATIC") {
      const publicIP = this.config.routerWanIP;
      return {
        ...baseMapping,
        insideGlobalIP: publicIP,
        insideGlobalPort: packet.sourcePort,
        natType: "Static NAT (1:1)",
        explanation: `Static 1:1 NAT mapping: Private host ${packet.sourceIP} is statically mapped to public WAN IP ${publicIP} preserving source port ${packet.sourcePort}.`,
      } as NatMapping;
    }

    if (this.config.natMode === "DYNAMIC") {
      if (this.config.publicIpPool.length === 0) return null;
      
      const activeIps = new Set(Array.from(this.mappings.values()).map(m => m.insideGlobalIP));
      const availableIp = this.config.publicIpPool.find(ip => !activeIps.has(ip));
      
      if (!availableIp) return null; // NAT_POOL_EXHAUSTED
      
      return {
        ...baseMapping,
        insideGlobalIP: availableIp,
        insideGlobalPort: packet.sourcePort,
        natType: "Dynamic NAT (Pool)",
        explanation: `Dynamic NAT Pool allocation: Host ${packet.sourceIP} was allocated available public IP ${availableIp} from pool [${this.config.publicIpPool.join(", ")}].`,
      } as NatMapping;
    }

    if (this.config.natMode === "PAT") {
      const publicIP = this.config.routerWanIP;
      
      if (packet.protocol === "ICMP") {
        return {
          ...baseMapping,
          insideGlobalIP: publicIP,
          insideGlobalPort: packet.sourcePort || 1,
          natType: "PAT (Port Overload)",
          explanation: `PAT ICMP Mapping: Internal echo request from ${packet.sourceIP} mapped to public WAN IP ${publicIP} with query ID tracking.`,
        } as NatMapping;
      }
      
      const port = this.portManager.allocatePort(publicIP, packet.protocol);
      if (!port) return null; // PORT_POOL_EXHAUSTED

      return {
        ...baseMapping,
        insideGlobalIP: publicIP,
        insideGlobalPort: port,
        natType: "PAT (Port Overload)",
        explanation: `PAT Overload mapping: Private endpoint ${packet.sourceIP}:${packet.sourcePort} multiplexed to public WAN ${publicIP}:${port} under RFC 3022.`,
      } as NatMapping;
    }

    return null;
  }

  private applyOutboundTranslation(
    packet: Packet, 
    mapping: NatMapping, 
    isNewMapping: boolean
  ): { success: boolean; packet: Packet } {
    const originalSourceIP = packet.sourceIP;
    const originalSourcePort = packet.sourcePort;
    const originalTTL = packet.headers?.ttl ?? 64;
    const newTTL = Math.max(1, originalTTL - 1);
    const newChecksum = this.generateHexChecksum();

    const diff: HeaderDiff = {
      sourceIP: { before: originalSourceIP, after: mapping.insideGlobalIP, changed: originalSourceIP !== mapping.insideGlobalIP },
      sourcePort: { before: originalSourcePort, after: mapping.insideGlobalPort, changed: originalSourcePort !== mapping.insideGlobalPort },
      destinationIP: { before: packet.destinationIP, after: packet.destinationIP, changed: false },
      destinationPort: { before: packet.destinationPort, after: packet.destinationPort, changed: false },
      ttl: { before: originalTTL, after: newTTL, changed: true },
      checksum: { before: packet.headers?.checksum ?? "0x0000", after: newChecksum, changed: true },
    };

    const steps = [
      `Step 1 [LAN Ingress]: Packet arrived on LAN interface (192.168.1.1) from ${originalSourceIP}:${originalSourcePort}.`,
      `Step 2 [Routing & Subnet Evaluation]: Target ${packet.destinationIP} is non-local; default route directed traffic towards WAN interface.`,
      isNewMapping
        ? `Step 3 [State Table Insertion]: Created new ${mapping.natType} state table entry for ${originalSourceIP}:${originalSourcePort} -> ${mapping.insideGlobalIP}:${mapping.insideGlobalPort}.`
        : `Step 3 [State Table Lookup]: Found existing session entry. Refreshed TTL to ${this.config.mappingTtl}s.`,
      `Step 4 [Header Modification]: Rewrote IP Source ${originalSourceIP} -> ${mapping.insideGlobalIP} and Port ${originalSourcePort} -> ${mapping.insideGlobalPort}. Decremented TTL ${originalTTL} -> ${newTTL}.`,
      `Step 5 [Checksum & Egress]: Recalculated IPv4 and ${packet.protocol} header checksums (${newChecksum}). Transmitted outbound across public WAN interface.`,
    ];

    const explanation = `Outbound packet from private host ${originalSourceIP} translated via ${mapping.natType}. Gateway replaced private IP with public IP ${mapping.insideGlobalIP} and allocated port ${mapping.insideGlobalPort}. Responses from ${packet.destinationIP} directed to ${mapping.insideGlobalIP}:${mapping.insideGlobalPort} will be routed back to ${originalSourceIP}:${originalSourcePort}.`;

    const translationDetails: TranslationDetails = {
      appliedMode: this.config.natMode,
      ruleDescription: `${mapping.natType}: ${originalSourceIP}:${originalSourcePort} -> ${mapping.insideGlobalIP}:${mapping.insideGlobalPort}`,
      rfcReference: this.config.natMode === "PAT" ? "RFC 3022 (Traditional IP Network Address Translator)" : "RFC 1918 (Private Address Allocation)",
      explanation,
      steps,
      diff,
    };

    const translatedPacket: Packet = {
      ...packet,
      sourceIP: mapping.insideGlobalIP,
      sourcePort: mapping.insideGlobalPort,
      status: "TRANSLATED",
      headers: {
        ...(packet.headers || this.buildDefaultHeaders(packet)),
        ttl: newTTL,
        checksum: newChecksum,
      },
      translationDetails,
    };

    return { success: true, packet: translatedPacket };
  }

  private applyInboundTranslation(packet: Packet, mapping: NatMapping): { success: boolean; packet: Packet } {
    const originalDestIP = packet.destinationIP;
    const originalDestPort = packet.destinationPort;
    const originalTTL = packet.headers?.ttl ?? 60;
    const newTTL = Math.max(1, originalTTL - 1);
    const newChecksum = this.generateHexChecksum();

    const diff: HeaderDiff = {
      sourceIP: { before: packet.sourceIP, after: packet.sourceIP, changed: false },
      sourcePort: { before: packet.sourcePort, after: packet.sourcePort, changed: false },
      destinationIP: { before: originalDestIP, after: mapping.insideLocalIP, changed: originalDestIP !== mapping.insideLocalIP },
      destinationPort: { before: originalDestPort, after: mapping.insideLocalPort, changed: originalDestPort !== mapping.insideLocalPort },
      ttl: { before: originalTTL, after: newTTL, changed: true },
      checksum: { before: packet.headers?.checksum ?? "0x0000", after: newChecksum, changed: true },
    };

    const steps = [
      `Step 1 [WAN Ingress]: Return packet arrived on public WAN interface from ${packet.sourceIP}:${packet.sourcePort} destined for ${originalDestIP}:${originalDestPort}.`,
      `Step 2 [State Table Match]: Lookup matched active session: ${originalDestIP}:${originalDestPort} corresponds to inside host ${mapping.insideLocalIP}:${mapping.insideLocalPort}.`,
      `Step 3 [Session Refresh]: Updated session last-active timestamp. Reset mapping countdown timer.`,
      `Step 4 [Reverse Header Modification]: Replaced destination IP ${originalDestIP} -> ${mapping.insideLocalIP} and destination port ${originalDestPort} -> ${mapping.insideLocalPort}. Decremented TTL ${originalTTL} -> ${newTTL}.`,
      `Step 5 [LAN Egress]: Recalculated packet checksum (${newChecksum}) and forwarded down the internal private switch port to ${mapping.insideLocalIP}.`,
    ];

    const explanation = `Inbound response successfully demultiplexed by router. The router looked up port ${originalDestPort} in its NAT translation table, identified the session initiator as internal client ${mapping.insideLocalIP}:${mapping.insideLocalPort}, rewrote destination headers, and forwarded the packet across the private subnet.`;

    const translationDetails: TranslationDetails = {
      appliedMode: this.config.natMode,
      ruleDescription: `Reverse Translation: ${originalDestIP}:${originalDestPort} -> ${mapping.insideLocalIP}:${mapping.insideLocalPort}`,
      rfcReference: "RFC 3022 Section 4.2 (Stateful Reverse Mapping)",
      explanation,
      steps,
      diff,
    };

    const translatedPacket: Packet = {
      ...packet,
      destinationIP: mapping.insideLocalIP,
      destinationPort: mapping.insideLocalPort,
      status: "TRANSLATED",
      headers: {
        ...(packet.headers || this.buildDefaultHeaders(packet)),
        ttl: newTTL,
        checksum: newChecksum,
      },
      translationDetails,
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
