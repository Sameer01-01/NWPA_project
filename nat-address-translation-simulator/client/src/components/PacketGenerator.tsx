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
    // Generate reverse packet for testing
    sendPacket({
      protocol,
      sourceIP: destIP,
      sourcePort: parseInt(destPort),
      destinationIP: '203.0.113.5', // Default WAN IP
      destinationPort: 40000, // Should be determined by active mappings
      direction: 'INBOUND',
      payloadSize: 1024,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs text-textMuted uppercase font-bold tracking-wider">Source Device</label>
        <select 
          className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
        >
          <option value="">Select a host...</option>
          {hosts.map(h => (
            <option key={h.id} value={h.id}>{h.name} ({h.privateIP})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="text-xs text-textMuted uppercase font-bold tracking-wider">Protocol</label>
          <select 
            className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
          >
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
          </select>
        </div>
        
        {protocol !== 'ICMP' && (
          <div className="space-y-2">
            <label className="text-xs text-textMuted uppercase font-bold tracking-wider">Source Port</label>
            <input 
              type="number"
              className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary"
              value={sourcePort}
              onChange={(e) => setSourcePort(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs text-textMuted uppercase font-bold tracking-wider">Destination IP</label>
        <input 
          type="text"
          className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary"
          value={destIP}
          onChange={(e) => setDestIP(e.target.value)}
        />
      </div>

      {protocol !== 'ICMP' && (
        <div className="space-y-2">
          <label className="text-xs text-textMuted uppercase font-bold tracking-wider">Destination Port</label>
          <input 
            type="number"
            className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary"
            value={destPort}
            onChange={(e) => setDestPort(e.target.value)}
          />
        </div>
      )}

      <div className="pt-4 flex gap-2">
        <button 
          onClick={handleSend}
          disabled={!sourceId}
          className="flex-1 bg-primary hover:bg-primary/90 text-white p-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" /> Send Packet
        </button>
        <button 
          onClick={handleReverse}
          className="flex-1 bg-surface border border-white/10 hover:bg-white/5 p-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRightLeft className="w-4 h-4" /> Send Response
        </button>
      </div>
    </div>
  );
}
