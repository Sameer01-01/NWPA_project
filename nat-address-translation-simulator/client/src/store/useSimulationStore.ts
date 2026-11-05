import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

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
  ttl: number;
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

export interface SimulationEvent {
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

interface SimulationState {
  socket: Socket | null;
  devices: Device[];
  natTable: NatMapping[];
  packets: Packet[];
  logs: SimulationEvent[];
  presets: SimulationPreset[];
  currentPresetId: string;
  selectedPacket: Packet | null;
  isInspectorOpen: boolean;
  isAddDeviceOpen: boolean;
  selectedHostId: string;
  stats: {
    totalPackets: number;
    successfulTranslations: number;
    droppedPackets: number;
  };

  // Actions
  connectSocket: () => void;
  fetchDevices: () => Promise<void>;
  fetchNatTable: () => Promise<void>;
  fetchPresets: () => Promise<void>;
  loadPreset: (presetId: string) => Promise<void>;
  addDevice: (deviceData: Omit<Device, "id">) => Promise<boolean>;
  deleteDevice: (deviceId: string) => Promise<boolean>;
  sendPacket: (packetData: Omit<Packet, "id" | "status" | "timestamp">) => Promise<void>;
  sendBatchTraffic: (count?: number) => Promise<void>;
  addLog: (message: string, type: SimulationEvent["type"], options?: Partial<SimulationEvent>) => void;
  clearLogs: () => void;
  setSelectedPacket: (packet: Packet | null) => void;
  setIsInspectorOpen: (open: boolean) => void;
  setIsAddDeviceOpen: (open: boolean) => void;
  setSelectedHostId: (id: string) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  socket: null,
  devices: [],
  natTable: [],
  packets: [],
  logs: [],
  presets: [],
  currentPresetId: "soho-pat",
  selectedPacket: null,
  isInspectorOpen: false,
  isAddDeviceOpen: false,
  selectedHostId: "",
  stats: {
    totalPackets: 0,
    successfulTranslations: 0,
    droppedPackets: 0,
  },

  connectSocket: () => {
    const { socket } = get();
    if (socket) return; // already connected
    
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('nat:table-updated', (mappings: NatMapping[]) => {
      set({ natTable: mappings });
    });

    newSocket.on('devices:updated', (devices: Device[]) => {
      set({ devices });
    });

    newSocket.on('preset:loaded', ({ presetId, preset }: { presetId: string; preset: SimulationPreset }) => {
      set({ currentPresetId: presetId });
      if (preset && preset.devices) {
        get().addLog(`Loaded Simulation Template: "${preset.name}"`, 'INFO', {
          category: 'ROUTING',
          explanation: preset.description,
          rfcReference: preset.educationalGoal
        });
      }
    });

    newSocket.on('packet:created', (packet: Packet) => {
      set((state) => ({ 
        packets: [...state.packets, packet].slice(-50),
        stats: { ...state.stats, totalPackets: state.stats.totalPackets + 1 }
      }));
      get().addLog(
        `Packet Dispatched: ${packet.protocol} ${packet.sourceIP}:${packet.sourcePort ?? ''} -> ${packet.destinationIP}:${packet.destinationPort ?? ''}`, 
        'INFO',
        {
          category: 'ROUTING',
          packetSnapshot: packet,
          explanation: `Host initiated outbound ${packet.protocol} datagram. Target IP is outside local subnet; routing towards gateway interface.`,
        }
      );
    });

    newSocket.on('packet:translated', (packet: Packet) => {
      set((state) => {
        const packets = state.packets.map(p => p.id === packet.id ? packet : p);
        return { 
          packets,
          selectedPacket: state.selectedPacket?.id === packet.id ? packet : state.selectedPacket,
          stats: { ...state.stats, successfulTranslations: state.stats.successfulTranslations + 1 }
        };
      });

      const details = packet.translationDetails;
      const isOutbound = packet.direction === 'OUTBOUND';
      const logMessage = isOutbound
        ? `NAT Translation: Rewrote to WAN ${packet.sourceIP}:${packet.sourcePort || ''}`
        : `Demux Inbound: Routed to LAN Host ${packet.destinationIP}:${packet.destinationPort || ''}`;

      get().addLog(
        logMessage, 
        'SUCCESS',
        {
          category: 'NAT_TRANSLATION',
          packetSnapshot: packet,
          detailedTrace: details?.steps,
          explanation: details?.explanation,
          rfcReference: details?.rfcReference,
        }
      );
    });

    newSocket.on('packet:dropped', ({ packet, reason, explanation }: { packet: Packet; reason?: string; explanation?: string }) => {
      set((state) => {
        const packets = state.packets.map(p => p.id === packet.id ? { ...packet, status: 'DROPPED' as PacketStatus, dropReason: explanation || reason } : p);
        return { 
          packets,
          stats: { ...state.stats, droppedPackets: state.stats.droppedPackets + 1 }
        };
      });

      get().addLog(
        `Packet Blocked / Dropped: [${reason || 'UNMATCHED_TRAFFIC'}]`, 
        'ERROR',
        {
          category: 'SECURITY',
          packetSnapshot: packet,
          explanation: explanation || `Packet dropped: ${reason}. Router cannot route or translate this datagram.`,
          rfcReference: 'RFC 3022 Stateful Firewall & Isolation Boundary'
        }
      );
    });
    
    newSocket.on('packet:delivered', (packet: Packet) => {
      set((state) => {
        const packets = state.packets.map(p => p.id === packet.id ? packet : p);
        return { 
          packets,
          selectedPacket: state.selectedPacket?.id === packet.id ? packet : state.selectedPacket
        };
      });
      get().addLog(
        `Packet Delivered: ${packet.destinationIP}:${packet.destinationPort || ''} received packet payload (${packet.payloadSize} Bytes)`, 
        'SUCCESS',
        {
          category: 'DELIVERY',
          packetSnapshot: packet
        }
      );
    });

    set({ socket: newSocket });
  },

  fetchDevices: async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/devices');
      set({ devices: res.data });
    } catch (err) {
      console.error('Failed to fetch devices', err);
    }
  },

  fetchNatTable: async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/nat/mappings');
      set({ natTable: res.data });
    } catch (err) {
      console.error('Failed to fetch nat table', err);
    }
  },

  fetchPresets: async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/presets');
      set({ 
        presets: res.data.presets, 
        currentPresetId: res.data.currentPresetId || 'soho-pat' 
      });
    } catch (err) {
      console.error('Failed to fetch presets', err);
    }
  },

  loadPreset: async (presetId: string) => {
    try {
      const res = await axios.post('http://localhost:5000/api/presets/load', { presetId });
      if (res.data?.success) {
        set({ currentPresetId: presetId });
        await get().fetchDevices();
        await get().fetchNatTable();
      }
    } catch (err) {
      console.error('Failed to load preset', err);
    }
  },

  addDevice: async (deviceData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/devices', deviceData);
      if (res.data?.success) {
        set({ devices: res.data.devices });
        get().addLog(`Device Added: ${deviceData.name} (${deviceData.privateIP})`, 'INFO', {
          category: 'ROUTING',
          explanation: `New node joined LAN subnet. Ready to transmit through NAT gateway.`
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add device', err);
      return false;
    }
  },

  deleteDevice: async (deviceId: string) => {
    try {
      const res = await axios.delete(`http://localhost:5000/api/devices/${deviceId}`);
      if (res.data?.success) {
        set({ devices: res.data.devices });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete device', err);
      return false;
    }
  },

  sendPacket: async (packetData) => {
    try {
      await axios.post('http://localhost:5000/api/packets/send', packetData);
    } catch (err) {
      console.error('Failed to send packet', err);
    }
  },

  sendBatchTraffic: async (count = 3) => {
    try {
      await axios.post('http://localhost:5000/api/simulation/batch', { count });
      get().addLog(`Batch Traffic Initiated: Fired ${count} concurrent datagrams across LAN`, 'INFO', {
        category: 'PORT_ALLOCATION',
        explanation: `Simulating multi-host concurrency to observe dynamic port allocation and NAT table growth.`
      });
    } catch (err) {
      console.error('Failed to send batch traffic', err);
    }
  },

  addLog: (message, type, options = {}) => {
    const event: SimulationEvent = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      message,
      type,
      category: options.category || 'ROUTING',
      detailedTrace: options.detailedTrace,
      explanation: options.explanation,
      rfcReference: options.rfcReference,
      packetSnapshot: options.packetSnapshot
    };
    set((state) => ({ logs: [event, ...state.logs].slice(0, 100) }));
  },

  clearLogs: () => set({ logs: [] }),

  setSelectedPacket: (packet) => set({ selectedPacket: packet }),
  setIsInspectorOpen: (open) => set({ isInspectorOpen: open }),
  setIsAddDeviceOpen: (open) => set({ isAddDeviceOpen: open }),
  setSelectedHostId: (id) => set({ selectedHostId: id }),
}));
