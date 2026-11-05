import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

export interface Device {
  id: string;
  name: string;
  type: string;
  privateIP: string;
  publicIP?: string;
  macAddress: string;
  status: string;
}

export interface NatMapping {
  id: string;
  protocol: string;
  insideLocalIP: string;
  insideLocalPort?: number;
  insideGlobalIP: string;
  insideGlobalPort?: number;
  outsideGlobalIP?: string;
  outsideGlobalPort?: number;
  direction: string;
  state: string;
  createdAt: string;
  lastUsed: string;
  ttl: number;
}

export interface Packet {
  id: string;
  protocol: string;
  sourceIP: string;
  sourcePort?: number;
  destinationIP: string;
  destinationPort?: number;
  direction: string;
  payloadSize: number;
  timestamp: string;
  status: string;
}

export interface SimulationEvent {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

interface SimulationState {
  socket: Socket | null;
  devices: Device[];
  natTable: NatMapping[];
  packets: Packet[];
  logs: SimulationEvent[];
  stats: {
    totalPackets: number;
    successfulTranslations: number;
    droppedPackets: number;
  };
  connectSocket: () => void;
  fetchDevices: () => Promise<void>;
  fetchNatTable: () => Promise<void>;
  sendPacket: (packetData: Omit<Packet, 'id'|'status'|'timestamp'>) => Promise<void>;
  addLog: (message: string, type: SimulationEvent['type']) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  socket: null,
  devices: [],
  natTable: [],
  packets: [],
  logs: [],
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

    newSocket.on('packet:created', (packet: Packet) => {
      set((state) => ({ 
        packets: [...state.packets, packet],
        stats: { ...state.stats, totalPackets: state.stats.totalPackets + 1 }
      }));
      get().addLog(`Packet generated: ${packet.protocol} ${packet.sourceIP} -> ${packet.destinationIP}`, 'INFO');
    });

    newSocket.on('packet:translated', (packet: Packet) => {
      set((state) => {
        const packets = state.packets.map(p => p.id === packet.id ? packet : p);
        return { 
          packets,
          stats: { ...state.stats, successfulTranslations: state.stats.successfulTranslations + 1 }
        };
      });
      get().addLog(`Packet translated successfully to ${packet.sourceIP}:${packet.sourcePort || ''}`, 'SUCCESS');
    });

    newSocket.on('packet:dropped', ({ packet, reason }) => {
      set((state) => {
        const packets = state.packets.map(p => p.id === packet.id ? { ...packet, status: 'DROPPED' } : p);
        return { 
          packets,
          stats: { ...state.stats, droppedPackets: state.stats.droppedPackets + 1 }
        };
      });
      get().addLog(`Packet dropped: ${reason}`, 'ERROR');
    });
    
    newSocket.on('packet:delivered', (packet: Packet) => {
       set((state) => {
        const packets = state.packets.map(p => p.id === packet.id ? packet : p);
        return { packets };
      });
      get().addLog(`Packet delivered to ${packet.destinationIP}`, 'SUCCESS');
    });

    set({ socket: newSocket });
  },

  fetchDevices: async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/devices');
      set({ devices: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchNatTable: async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/nat/mappings');
      set({ natTable: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  sendPacket: async (packetData) => {
    try {
      await axios.post('http://localhost:5000/api/packets/send', packetData);
    } catch (err) {
      console.error(err);
    }
  },

  addLog: (message, type) => {
    const event: SimulationEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      message,
      type
    };
    set((state) => ({ logs: [event, ...state.logs].slice(0, 100) }));
  }
}));
