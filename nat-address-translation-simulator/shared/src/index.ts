export type Protocol = "TCP" | "UDP" | "ICMP";
export type PacketDirection = "OUTBOUND" | "INBOUND";
export type PacketStatus = "CREATED" | "PROCESSING" | "TRANSLATED" | "FORWARDED" | "RECEIVED" | "DROPPED" | "DELIVERED";
export type NatMode = "STATIC" | "DYNAMIC" | "PAT";
export type DeviceType = "HOST" | "SERVER" | "NAT_ROUTER" | "INTERNET" | "SMARTPHONE" | "IOT";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  privateIP: string;
  publicIP?: string;
  macAddress: string;
  status: "ONLINE" | "OFFLINE";
  defaultGateway?: string;
  description?: string;
}

export interface PacketHeaders {
  ipVersion: string;
  ipHeaderLength: number;
  typeOfService: string;
  identification: string;
  ttl: number;
  flags: string[];
  sequenceNumber?: number;
  acknowledgmentNumber?: number;
  windowSize?: number;
  checksum: string;
  payloadPreview: string;
}

export interface HeaderDiff {
  sourceIP: { before: string; after: string; changed: boolean };
  sourcePort?: { before?: number; after?: number; changed: boolean };
  destinationIP: { before: string; after: string; changed: boolean };
  destinationPort?: { before?: number; after?: number; changed: boolean };
  ttl: { before: number; after: number; changed: boolean };
  checksum: { before: string; after: string; changed: boolean };
}

export interface TranslationDetails {
  appliedMode: NatMode;
  ruleDescription: string;
  rfcReference: string;
  explanation: string;
  steps: string[];
  diff: HeaderDiff;
}

export interface Packet {
  id: string;
  protocol: Protocol;
  sourceIP: string;
  sourcePort?: number;
  destinationIP: string;
  destinationPort?: number;
  direction: PacketDirection;
  payloadSize: number;
  timestamp: string;
  status: PacketStatus;
  headers?: PacketHeaders;
  translationDetails?: TranslationDetails;
  dropReason?: string;
}

export interface NatMapping {
  id: string;
  protocol: Protocol;
  insideLocalIP: string;
  insideLocalPort?: number;
  insideGlobalIP: string;
  insideGlobalPort?: number;
  outsideGlobalIP?: string;
  outsideGlobalPort?: number;
  direction: PacketDirection;
  state: "NEW" | "ESTABLISHED" | "CLOSED" | "EXPIRED";
  createdAt: string;
  lastUsed: string;
  ttl: number; // in seconds
  remainingTtl?: number;
  packetCount: number;
  bytesTransferred: number;
  natType: "PAT (Port Overload)" | "Dynamic NAT (Pool)" | "Static NAT (1:1)";
  sourceHostName?: string;
  explanation: string;
}

export interface SimulationPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  educationalGoal: string;
  natMode: NatMode;
  publicIpPool: string[];
  routerLanIP: string;
  routerWanIP: string;
  devices: Omit<Device, "id">[];
}

export interface SimulationLogEvent {
  id: string;
  timestamp: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  category?: "ROUTING" | "NAT_TRANSLATION" | "PORT_ALLOCATION" | "SECURITY" | "DELIVERY";
  detailedTrace?: string[];
  explanation?: string;
  rfcReference?: string;
  packetSnapshot?: Packet;
}
