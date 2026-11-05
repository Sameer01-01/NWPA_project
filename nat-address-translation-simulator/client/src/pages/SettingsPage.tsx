import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface NatConfig {
  routerLanIP: string;
  routerWanIP: string;
  natMode: 'PAT' | 'DYNAMIC' | 'STATIC';
  publicIpPool: string[];
  mappingTtl: number;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<NatConfig>({
    routerLanIP: '192.168.1.1',
    routerWanIP: '203.0.113.5',
    natMode: 'PAT',
    publicIpPool: ['203.0.113.10', '203.0.113.11', '203.0.113.12'],
    mappingTtl: 30,
  });
  const [poolInput, setPoolInput] = useState('203.0.113.10, 203.0.113.11, 203.0.113.12');
  const [saved, setSaved] = useState(false);
  const [resetMsg, setResetMsg] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/api/config')
      .then(res => {
        if (res.data) {
          setConfig(res.data);
          if (Array.isArray(res.data.publicIpPool)) {
            setPoolInput(res.data.publicIpPool.join(', '));
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      const parsedPool = poolInput.split(',').map(s => s.trim()).filter(Boolean);
      const updatedConfig = { ...config, publicIpPool: parsedPool };
      await axios.post('http://localhost:5000/api/config', updatedConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      await axios.post('http://localhost:5000/api/simulation/reset');
      setResetMsg(true);
      setTimeout(() => setResetMsg(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="max-w-2xl space-y-6">
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold mb-4">NAT Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-textMuted mb-1">NAT Mode</label>
              <select 
                className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm"
                value={config.natMode}
                onChange={(e) => setConfig({ ...config, natMode: e.target.value as NatConfig['natMode'] })}
              >
                <option value="PAT">PAT (Port Address Translation / Overload)</option>
                <option value="DYNAMIC">Dynamic NAT (Pool-based)</option>
                <option value="STATIC">Static NAT (1:1 Mapping)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-textMuted mb-1">Router LAN IP</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm font-mono" 
                  value={config.routerLanIP}
                  onChange={(e) => setConfig({ ...config, routerLanIP: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-textMuted mb-1">Router WAN IP</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm font-mono" 
                  value={config.routerWanIP}
                  onChange={(e) => setConfig({ ...config, routerWanIP: e.target.value })}
                />
              </div>
            </div>

            {config.natMode === 'DYNAMIC' && (
              <div>
                <label className="block text-sm text-textMuted mb-1">Public IP Pool (Comma-separated)</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm font-mono" 
                  value={poolInput}
                  onChange={(e) => setPoolInput(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-textMuted mb-1">Mapping TTL (seconds)</label>
              <input 
                type="number" 
                className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm" 
                value={config.mappingTtl}
                onChange={(e) => setConfig({ ...config, mappingTtl: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-4">
            <button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              Save Configuration
            </button>
            <button 
              onClick={handleReset}
              className="bg-surface hover:bg-white/10 border border-white/10 text-textMuted hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Reset NAT Table
            </button>
            {saved && (
              <span className="text-success text-sm flex items-center gap-1">
                <CheckCircle2 size={16} /> Saved!
              </span>
            )}
            {resetMsg && (
              <span className="text-warning text-sm flex items-center gap-1">
                <CheckCircle2 size={16} /> NAT Mappings Cleared!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
