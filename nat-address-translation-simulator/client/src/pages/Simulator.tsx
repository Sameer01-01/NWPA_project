import { useEffect, useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { NetworkTopology } from '../components/NetworkTopology';
import { PacketGenerator } from '../components/PacketGenerator';
import { SimulationLogs } from '../components/SimulationLogs';
import { NatTable } from '../components/NatTable';

export default function Simulator() {
  const { connectSocket, fetchDevices, fetchNatTable } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'generator' | 'logs' | 'table'>('generator');

  useEffect(() => {
    connectSocket();
    fetchDevices();
    fetchNatTable();
  }, [connectSocket, fetchDevices, fetchNatTable]);

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left side: Network Topology */}
      <div className="flex-1 border-r border-white/10 relative">
        <NetworkTopology />
      </div>

      {/* Right side: Controls & Info */}
      <div className="w-full md:w-96 flex flex-col bg-surface/50 border-l border-white/10">
        <div className="flex border-b border-white/10">
          <button 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'generator' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-text'}`}
            onClick={() => setActiveTab('generator')}
          >
            Generator
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'table' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-text'}`}
            onClick={() => setActiveTab('table')}
          >
            NAT Table
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'logs' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-text'}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'generator' && <PacketGenerator />}
          {activeTab === 'table' && <NatTable />}
          {activeTab === 'logs' && <SimulationLogs />}
        </div>
      </div>
    </div>
  );
}
