import { useState, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Send, ArrowRightLeft, Zap, Eye, Globe2, ShieldCheck } from 'lucide-react';

export function PacketGenerator() {
  const { 
    devices, 
    sendPacket, 
    sendBatchTraffic, 
    selectedHostId, 
    setSelectedHostId,
    packets,
    setSelectedPacket,
    setIsInspectorOpen
  } = useSimulationStore();

  const lanDevices = devices.filter(d => d.type !== 'NAT_ROUTER' && d.type !== 'INTERNET');

  const [sourceId, setSourceId] = useState(selectedHostId || (lanDevices[0]?.id ?? ''));
  const [destIP, setDestIP] = useState('8.8.8.8');
  const [protocol, setProtocol] = useState<'TCP' | 'UDP' | 'ICMP'>('TCP');
  const [sourcePort, setSourcePort] = useState('51234');
  const [destPort, setDestPort] = useState('443');

  // Sync when selectedHostId changes from clicking on canvas
  useEffect(() => {
    if (selectedHostId && selectedHostId !== sourceId) {
      setSourceId(selectedHostId);
    } else if (!sourceId && lanDevices.length > 0) {
      setSourceId(lanDevices[0].id);
      setSelectedHostId(lanDevices[0].id);
    }
  }, [selectedHostId, lanDevices, sourceId, setSelectedHostId]);

  const handleSourceChange = (id: string) => {
    setSourceId(id);
    setSelectedHostId(id);
  };

  const handleApplyPreset = (proto: 'TCP' | 'UDP' | 'ICMP', targetIp: string, targetPort: string) => {
    setProtocol(proto);
    setDestIP(targetIp);
    setDestPort(targetPort);
    // Generate new random ephemeral source port
    setSourcePort(Math.floor(49152 + Math.random() * 15000).toString());
  };

  const handleSend = () => {
    if (!sourceId) return;
    const sourceDevice = devices.find(d => d.id === sourceId);
    if (!sourceDevice) return;

    sendPacket({
      protocol,
      sourceIP: sourceDevice.privateIP,
      sourcePort: protocol !== 'ICMP' ? parseInt(sourcePort) : undefined,
      destinationIP: destIP,
      destinationPort: protocol !== 'ICMP' ? parseInt(destPort) : undefined,
      direction: 'OUTBOUND',
      payloadSize: 1024,
    });
  };

  const handleReverse = () => {
    sendPacket({
      protocol,
      sourceIP: destIP,
      sourcePort: protocol !== 'ICMP' ? parseInt(destPort) : undefined,
      destinationIP: '203.0.113.5',
      destinationPort: 40000,
      direction: 'INBOUND',
      payloadSize: 1024,
    });
  };

  const lastPacket = packets.length > 0 ? packets[packets.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Quick Traffic Presets */}
      <div>
        <label className="text-[11px] text-textMuted uppercase font-bold tracking-wider block mb-2">
          Quick Traffic Scenarios
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleApplyPreset('TCP', '8.8.8.8', '443')}
            className="p-2 rounded-xl border border-border bg-surface hover:border-indigo-500/50 hover:bg-surfaceElevated transition-all text-left cursor-pointer"
          >
            <div className="font-semibold text-text flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-indigo-500" /> Web HTTPS
            </div>
            <div className="text-[10px] text-textMuted font-mono">TCP / port 443</div>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('TCP', '93.184.216.34', '80')}
            className="p-2 rounded-xl border border-border bg-surface hover:border-cyan-500/50 hover:bg-surfaceElevated transition-all text-left cursor-pointer"
          >
            <div className="font-semibold text-text flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-cyan-500" /> Web HTTP
            </div>
            <div className="text-[10px] text-textMuted font-mono">TCP / port 80</div>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('UDP', '1.1.1.1', '53')}
            className="p-2 rounded-xl border border-border bg-surface hover:border-amber-500/50 hover:bg-surfaceElevated transition-all text-left cursor-pointer"
          >
            <div className="font-semibold text-text flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> DNS Query
            </div>
            <div className="text-[10px] text-textMuted font-mono">UDP / port 53</div>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('ICMP', '8.8.8.8', '0')}
            className="p-2 rounded-xl border border-border bg-surface hover:border-emerald-500/50 hover:bg-surfaceElevated transition-all text-left cursor-pointer"
          >
            <div className="font-semibold text-text flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Ping Echo
            </div>
            <div className="text-[10px] text-textMuted font-mono">ICMP Echo Req</div>
          </button>
        </div>
      </div>

      {/* Source Device */}
      <div className="space-y-1.5">
        <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Source Device (LAN)</label>
        <select 
          className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 cursor-pointer"
          value={sourceId}
          onChange={(e) => handleSourceChange(e.target.value)}
        >
          <option value="">Select a host node...</option>
          {lanDevices.map(h => (
            <option key={h.id} value={h.id}>
              {h.name} [{h.type}] — {h.privateIP}
            </option>
          ))}
        </select>
      </div>

      {/* Protocol & Source Port */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Protocol</label>
          <select 
            className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 cursor-pointer"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as 'TCP' | 'UDP' | 'ICMP')}
          >
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
          </select>
        </div>
        
        {protocol !== 'ICMP' ? (
          <div className="space-y-1.5">
            <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Source Port</label>
            <input 
              type="number"
              className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              value={sourcePort}
              onChange={(e) => setSourcePort(e.target.value)}
              placeholder="51234"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">ICMP Identifier</label>
            <input 
              type="text"
              disabled
              value="Echo ID: 0x1A4"
              className="w-full bg-surfaceElevated/50 border border-border rounded-xl p-2.5 text-sm font-mono text-textMuted cursor-not-allowed"
            />
          </div>
        )}
      </div>

      {/* Destination IP & Port */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Destination IP</label>
          <input 
            type="text"
            className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
            value={destIP}
            onChange={(e) => setDestIP(e.target.value)}
            placeholder="8.8.8.8"
          />
        </div>

        {protocol !== 'ICMP' ? (
          <div className="space-y-1.5">
            <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Destination Port</label>
            <input 
              type="number"
              className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
              value={destPort}
              onChange={(e) => setDestPort(e.target.value)}
              placeholder="443"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">ICMP Type</label>
            <input 
              type="text"
              disabled
              value="Type 8 (Echo Req)"
              className="w-full bg-surfaceElevated/50 border border-border rounded-xl p-2.5 text-sm font-mono text-textMuted cursor-not-allowed"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col gap-2">
        <button 
          onClick={handleSend}
          disabled={!sourceId}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-glow-primary transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-4 h-4" /> Send Outbound Packet
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handleReverse}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-black/5 dark:hover:bg-white/10 border border-border text-text transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Send unsolicited/response inbound packet from Internet to WAN"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-500" /> Inbound Test
          </button>

          <button 
            onClick={() => sendBatchTraffic(3)}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-black/5 dark:hover:bg-white/10 border border-border text-text transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Simulate 3 concurrent packets from different LAN hosts"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Burst 3x
          </button>
        </div>

        {/* Deep Packet Inspector Shortcut */}
        {lastPacket && (
          <button
            onClick={() => {
              setSelectedPacket(lastPacket);
              setIsInspectorOpen(true);
            }}
            className="w-full mt-1 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 text-indigo-500 dark:text-indigo-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Inspect Last Packet (#{lastPacket.id.slice(-6)})
          </button>
        )}
      </div>
    </div>
  );
}