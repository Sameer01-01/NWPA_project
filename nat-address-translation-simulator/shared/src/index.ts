export type Protocol = "TCP" | "UDP" | "ICMP";
export type PacketDirection = "OUTBOUND" | "INBOUND";
export type PacketStatus = "CREATED" | "PROCESSING" | "TRANSLATED" | "FORWARDED" | "RECEIVED" | "DROPPED" | "DELIVERED";
export type NatMode = "STATIC" | "DYNAMIC" | "PAT";
export type DeviceType = "HOST" | "SERVER" | "NAT_ROUTER" | "INTERNET";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  privateIP: string;
  publicIP?: string;
  macAddress: string;
  status: "ONLINE" | "OFFLINE";
  defaultGateway?: string;
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
}
