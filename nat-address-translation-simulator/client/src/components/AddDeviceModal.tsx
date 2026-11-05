import { useState } from 'react';
import { useSimulationStore, type DeviceType } from '../store/useSimulationStore';
import { X, Plus, Monitor, Server, Smartphone, Tv } from 'lucide-react';

export function AddDeviceModal() {
  const { isAddDeviceOpen, setIsAddDeviceOpen, addDevice, devices } = useSimulationStore();
  
  // Calculate next suggested IP
  const existingIps = devices.map(d => d.privateIP);
  let nextIpNum = 15;
  while (existingIps.includes(`192.168.1.${nextIpNum}`)) {
    nextIpNum++;
  }

  const [name, setName] = useState(`Device-${nextIpNum}`);
  const [type, setType] = useState<DeviceType>('HOST');
  const [privateIP, setPrivateIP] = useState(`192.168.1.${nextIpNum}`);
  const [description, setDescription] = useState('Custom network node');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddDeviceOpen) return null;

  const handleApplyPreset = (presetName: string, presetType: DeviceType, desc: string) => {
    setName(presetName);
    setType(presetType);
    setDescription(desc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !privateIP.trim()) return;

    setIsSubmitting(true);
    const success = await addDevice({
      name: name.trim(),
      type,
      privateIP: privateIP.trim(),
      macAddress: `02:00:AA:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${nextIpNum.toString(16).padStart(2, '0')}`,
      status: 'ONLINE',
      defaultGateway: '192.168.1.1',
      description: description.trim(),
    });

    setIsSubmitting(false);
    if (success) {
      setIsAddDeviceOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 border border-border rounded-2xl shadow-2xl bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Add Network Device</h3>
              <p className="text-xs text-textMuted">Expand the LAN topology with a new host or server</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddDeviceOpen(false)}
            className="p-1.5 rounded-lg text-textMuted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="my-4">
          <span className="text-[11px] font-semibold text-textMuted uppercase tracking-wider block mb-2">
            Quick Presets
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleApplyPreset('Dev-Laptop', 'HOST', 'Developer engineering station')}
              className="p-2 rounded-xl border border-border hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-left flex items-center gap-2 text-text"
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-500" />
              <span>Dev Laptop</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('iPhone-15', 'SMARTPHONE', 'Mobile handheld Wi-Fi node')}
              className="p-2 rounded-xl border border-border hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-left flex items-center gap-2 text-text"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
              <span>Smartphone</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('App-Database', 'SERVER', 'Internal PostgreSQL DB')}
              className="p-2 rounded-xl border border-border hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-left flex items-center gap-2 text-text"
            >
              <Server className="w-3.5 h-3.5 text-purple-500" />
              <span>Database Server</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Security-Camera', 'IOT', 'RTSP Streaming IoT device')}
              className="p-2 rounded-xl border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left flex items-center gap-2 text-text"
            >
              <Tv className="w-3.5 h-3.5 text-emerald-500" />
              <span>IoT Camera</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">
              Device Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="e.g. Workstation-Finance"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">
                Device Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeviceType)}
                className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="HOST">HOST (Computer)</option>
                <option value="SMARTPHONE">SMARTPHONE</option>
                <option value="IOT">IOT / Smart Device</option>
                <option value="SERVER">SERVER (Internal)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">
                Private IP Address
              </label>
              <input
                type="text"
                required
                value={privateIP}
                onChange={(e) => setPrivateIP(e.target.value)}
                className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="192.168.1.X"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">
              Role & Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="e.g. Workstation generating user traffic"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddDeviceOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-border bg-surfaceElevated text-textMuted hover:text-text text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-md hover:shadow-glow-primary transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add to Network'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
