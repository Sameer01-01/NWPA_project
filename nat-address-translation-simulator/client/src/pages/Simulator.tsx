import { useEffect, useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { NetworkTopology } from '../components/NetworkTopology';
import { PacketGenerator } from '../components/PacketGenerator';
import { SimulationLogs } from '../components/SimulationLogs';
import { NatTable } from '../components/NatTable';
import { Send, Table2, Terminal } from 'lucide-react';

type TabType = 'generator' | 'table' | 'logs';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

export default function Simulator() {
  const { connectSocket, fetchDevices, fetchNatTable } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<TabType>('generator');

  useEffect(() => {
    connectSocket();
    fetchDevices();
    fetchNatTable();
  }, [connectSocket, fetchDevices, fetchNatTable]);

  const tabs: TabItem[] = [
    { id: 'generator', label: 'Generator', icon: <Send className="w-4 h-4" /> },
    { id: 'table', label: 'NAT Table', icon: <Table2 className="w-4 h-4" /> },
    { id: 'logs', label: 'Logs', icon: <Terminal className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-background">
      {/* Left: Network Topology Canvas */}
      <div className="flex-1 border-r border-border relative bg-background overflow-hidden">
        <NetworkTopology />
      </div>

      {/* Right: Controls */}
      <div className="w-full md:w-96 flex flex-col bg-surface/80 backdrop-blur-md border-l border-border z-10 shadow-lg">
        {/* Enhanced Tab Bar */}
        <div className="flex border-b border-border bg-surfaceElevated/50 p-1 gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-primary bg-surface shadow-sm'
                    : 'text-textMuted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
                {/* Gradient underline for active tab */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'generator' && <PacketGenerator />}
          {activeTab === 'table' && <NatTable />}
          {activeTab === 'logs' && <SimulationLogs />}
        </div>
      </div>
    </div>
  );
}
