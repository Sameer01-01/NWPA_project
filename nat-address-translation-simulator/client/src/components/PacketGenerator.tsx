import { useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Send, ArrowRightLeft } from 'lucide-react';

export function PacketGenerator() {
  const { devices, sendPacket } = useSimulationStore();
  const [sourceId, setSourceId] = useState('');
  const [destIP, setDestIP] = useState('8.8.8.8');
  const [protocol, setProtocol] = useState('TCP');
  const [sourcePort, setSourcePort] = useState('5000');
  const [destPort, setDestPort] = useState('443');

  const hosts = devices.filter(d => d.type === 'HOST');

  const handleSend = () => {
    if (!sourceId) return;
    const sourceDevice = devices.find(d => d.id === sourceId);
    if (!sourceDevice) return;

    sendPacket({
      protocol,
      sourceIP: sourceDevice.privateIP,
      sourcePort: parseInt(sourcePort),
      destinationIP: destIP,
      destinationPort: parseInt(destPort),
      direction: 'OUTBOUND',
      payloadSize: 1024,
    });
  };

  const handleReverse = () => {
    sendPacket({
      protocol,
      sourceIP: destIP,
      sourcePort: parseInt(destPort),
      destinationIP: '203.0.113.5',
      destinationPort: 40000,
      direction: 'INBOUND',
      payloadSize: 1024,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Source Device</label>
        <select 
          className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
        >
          <option value="">Select a host...</option>
          {hosts.map(h => (
            <option key={h.id} value={h.id}>{h.name} ({h.privateIP})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Protocol</label>
          <select 
            className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
          >
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
          </select>
        </div>
        
        {protocol !== 'ICMP' && (
          <div className="space-y-1.5">
            <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Source Port</label>
            <input 
              type="number"
              className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              value={sourcePort}
              onChange={(e) => setSourcePort(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Destination IP</label>
        <input 
          type="text"
          className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
          value={destIP}
          onChange={(e) => setDestIP(e.target.value)}
        />
      </div>

      {protocol !== 'ICMP' && (
        <div className="space-y-1.5">
          <label className="text-xs text-textMuted uppercase font-semibold tracking-wider">Destination Port</label>
          <input 
            type="number"
            className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
            value={destPort}
            onChange={(e) => setDestPort(e.target.value)}
          />
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <button 
          onClick={handleSend}
          disabled={!sourceId}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-glow-primary transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-4 h-4" /> Send Packet
        </button>
        <button 
          onClick={handleReverse}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-surfaceElevated hover:bg-black/10 dark:hover:bg-white/10 border border-border text-textMuted hover:text-text transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowRightLeft className="w-4 h-4" /> Send Response
        </button>
      </div>
    </div>
  );
}
