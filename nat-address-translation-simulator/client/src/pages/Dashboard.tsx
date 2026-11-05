import { useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Network, Activity, ShieldAlert, Cpu } from 'lucide-react';

export default function Dashboard() {
  const { stats, devices, natTable, fetchDevices, fetchNatTable, connectSocket } = useSimulationStore();

  useEffect(() => {
    connectSocket();
    fetchDevices();
    fetchNatTable();
  }, [connectSocket, fetchDevices, fetchNatTable]);

  const activeConnections = natTable.length;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Active NAT Mappings" 
          value={activeConnections.toString()} 
          icon={<Network className="text-primary" />} 
        />
        <StatCard 
          title="Total Packets" 
          value={stats.totalPackets.toString()} 
          icon={<Activity className="text-secondary" />} 
        />
        <StatCard 
          title="Dropped Packets" 
          value={stats.droppedPackets.toString()} 
          icon={<ShieldAlert className="text-error" />} 
        />
        <StatCard 
          title="Devices" 
          value={devices.length.toString()} 
          icon={<Cpu className="text-success" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Network className="mr-2" /> Recent NAT Mappings
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-textMuted text-sm">
                  <th className="pb-2">Protocol</th>
                  <th className="pb-2">Inside Local</th>
                  <th className="pb-2">Inside Global</th>
                  <th className="pb-2">State</th>
                </tr>
              </thead>
              <tbody>
                {natTable.slice(0, 5).map(mapping => (
                  <tr key={mapping.id} className="border-b border-white/5 text-sm">
                    <td className="py-2">{mapping.protocol}</td>
                    <td className="py-2 font-mono">{mapping.insideLocalIP}:{mapping.insideLocalPort}</td>
                    <td className="py-2 font-mono text-primary">{mapping.insideGlobalIP}:{mapping.insideGlobalPort}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 bg-success/20 text-success rounded-full text-xs">
                        {mapping.state}
                      </span>
                    </td>
                  </tr>
                ))}
                {natTable.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-textMuted">No active mappings</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Activity className="mr-2" /> System Status
          </h2>
          <div className="space-y-4">
             <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-textMuted">NAT Mode</span>
                <span className="font-semibold text-primary">PAT (Overload)</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-textMuted">Router LAN IP</span>
                <span className="font-mono">192.168.1.1</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-textMuted">Router WAN IP</span>
                <span className="font-mono text-primary">203.0.113.5</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass-panel p-6 flex items-center justify-between">
      <div>
        <h3 className="text-textMuted text-sm font-medium mb-1">{title}</h3>
        <div className="text-3xl font-bold">{value}</div>
      </div>
      <div className="p-3 bg-white/5 rounded-xl">
        {icon}
      </div>
    </div>
  );
}
