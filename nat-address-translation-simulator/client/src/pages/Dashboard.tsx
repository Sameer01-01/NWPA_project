import { useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Network, Activity, ShieldAlert, Cpu, ArrowUpRight, CheckCircle2, Server, Globe, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { 
    stats, 
    devices, 
    natTable, 
    presets, 
    currentPresetId, 
    fetchDevices, 
    fetchNatTable, 
    fetchPresets, 
    connectSocket 
  } = useSimulationStore();

  useEffect(() => {
    connectSocket();
    fetchDevices();
    fetchNatTable();
    fetchPresets();
  }, [connectSocket, fetchDevices, fetchNatTable, fetchPresets]);

  const activeConnections = natTable.length;
  const currentPreset = presets.find(p => p.id === currentPresetId);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-cyan-950/30 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              NAT Simulation Engine Active
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
                NAT Simulator
              </span>{" "}
              Dashboard
            </h1>
            <p className="text-sm md:text-base text-textMuted leading-relaxed">
              Real-time packet inspection, dynamic port allocation, and address translation monitoring. Observe internal network isolation and public IP mapping in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/simulator"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-glow-primary transition-all duration-200"
            >
              Launch Simulator
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        {/* Ambient glow blobs */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Active Scenario Card */}
      {currentPreset && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surfaceElevated/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-textMuted tracking-wider">Active Scenario</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-500 dark:text-indigo-400">
                  {currentPreset.natMode}
                </span>
              </div>
              <h3 className="text-sm font-bold text-text">{currentPreset.name}</h3>
              <p className="text-xs text-textMuted mt-0.5 max-w-xl">{currentPreset.educationalGoal}</p>
            </div>
          </div>
          <Link
            to="/simulator"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-primary hover:bg-surfaceElevated transition-all shadow-sm shrink-0"
          >
            Switch Scenario in Simulator
          </Link>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active NAT Mappings"
          value={activeConnections.toString()}
          subtitle="Live sessions in NAT table"
          borderColor="border-l-indigo-500"
          icon={<Network className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
          hasLivePulse={true}
        />
        <StatCard
          title="Total Packets"
          value={stats.totalPackets.toString()}
          subtitle="Processed through gateway"
          borderColor="border-l-cyan-500"
          icon={<Activity className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />}
        />
        <StatCard
          title="Dropped Packets"
          value={stats.droppedPackets.toString()}
          subtitle="Invalid or pool exhausted"
          borderColor="border-l-rose-500"
          icon={<ShieldAlert className="w-6 h-6 text-rose-500 dark:text-rose-400" />}
        />
        <StatCard
          title="Devices"
          value={devices.length.toString()}
          subtitle="Topology network nodes"
          borderColor="border-l-emerald-500"
          icon={<Cpu className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />}
        />
      </div>

      {/* NAT Mappings & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent NAT Mappings */}
        <div className="glass-panel p-6 border border-indigo-500/25 dark:border-indigo-500/30 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                <Network className="w-5 h-5" />
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                Recent NAT Mappings
              </span>
            </h2>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-surfaceElevated border border-border text-textMuted">
              {natTable.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-textMuted text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-2">Protocol</th>
                  <th className="pb-3 px-2">Inside Local</th>
                  <th className="pb-3 px-2">Inside Global</th>
                  <th className="pb-3 px-2">TTL</th>
                  <th className="pb-3 px-2 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {natTable.slice(0, 5).map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                        {mapping.protocol}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs">
                      {mapping.insideLocalIP}:{mapping.insideLocalPort ?? '*'}
                    </td>
                    <td className="py-3 px-2 font-mono text-xs text-primary font-semibold">
                      {mapping.insideGlobalIP}:{mapping.insideGlobalPort ?? '*'}
                    </td>
                    <td className="py-3 px-2 font-mono text-xs text-textMuted">
                      {mapping.remainingTtl ?? 60}s
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {mapping.state}
                      </span>
                    </td>
                  </tr>
                ))}
                {natTable.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-textMuted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Network className="w-8 h-8 text-textMuted/40" />
                        <span className="text-sm">No active NAT mappings</span>
                        <span className="text-xs text-textMuted/70">
                          Transmit packets in the Simulator to generate translation records
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-panel p-6 border border-cyan-500/25 dark:border-cyan-500/30 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                <Activity className="w-5 h-5" />
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500">
                System Status & Gateway
              </span>
            </h2>
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Online
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3.5 bg-surfaceElevated rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-textMuted">NAT Mode</div>
                  <div className="text-sm font-semibold text-text">
                    {currentPreset ? currentPreset.natMode : 'PAT (Port Address Translation)'}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Active
              </span>
            </div>

            <div className="flex justify-between items-center p-3.5 bg-surfaceElevated rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-textMuted">Router LAN IP (Gateway)</div>
                  <div className="text-sm font-mono font-semibold text-text">192.168.1.1</div>
                </div>
              </div>
              <span className="text-xs text-textMuted font-mono">Private Subnet</span>
            </div>

            <div className="flex justify-between items-center p-3.5 bg-surfaceElevated rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-textMuted">Router WAN IP (Public)</div>
                  <div className="text-sm font-mono font-semibold text-primary">
                    {currentPreset ? currentPreset.routerWanIP : '203.0.113.5'}
                  </div>
                </div>
              </div>
              <span className="text-xs text-textMuted font-mono">Public Internet</span>
            </div>

            <div className="flex justify-between items-center p-3.5 bg-surfaceElevated rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-textMuted">Translation Success Rate</div>
                  <div className="text-sm font-semibold text-text">
                    {stats.successfulTranslations} / {stats.totalPackets} packets
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {stats.totalPackets > 0
                  ? `${Math.round((stats.successfulTranslations / stats.totalPackets) * 100)}%`
                  : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  borderColor: string;
  icon: React.ReactNode;
  hasLivePulse?: boolean;
}

function StatCard({ title, value, subtitle, borderColor, icon, hasLivePulse }: StatCardProps) {
  return (
    <div
      className={`glass-panel p-5 rounded-2xl border border-border ${borderColor} border-l-4 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {hasLivePulse && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
          <h3 className="text-textMuted text-xs font-semibold tracking-wider uppercase">{title}</h3>
        </div>
        <div className="p-2 rounded-xl bg-surfaceElevated border border-border shadow-inner">{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-extrabold tracking-tight text-text mb-1">{value}</div>
        <div className="text-xs text-textMuted">{subtitle}</div>
      </div>
    </div>
  );
}