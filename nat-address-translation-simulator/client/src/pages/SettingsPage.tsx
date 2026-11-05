import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, RotateCcw, Sliders } from 'lucide-react';

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
    <div className="p-6 md:p-8 h-full overflow-y-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400">
            Router & Simulator Settings
          </span>
        </h1>
        <p className="text-sm text-textMuted mt-1">
          Adjust NAT operational modes, virtual gateway IP configurations, and translation table timeouts.
        </p>
      </div>
      
      <div className="max-w-3xl space-y-6">
        <div className="glass-panel p-6 md:p-8 border border-border border-l-4 border-l-purple-500 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">NAT Gateway Configuration</h2>
              <span className="text-xs text-textMuted">Operational parameters for network translation</span>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                NAT Mode
              </label>
              <select 
                className="w-full bg-surfaceElevated border border-border rounded-xl p-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
                value={config.natMode}
                onChange={(e) => setConfig({ ...config, natMode: e.target.value as NatConfig['natMode'] })}
              >
                <option value="PAT">PAT (Port Address Translation / NAT Overload - Recommended)</option>
                <option value="DYNAMIC">Dynamic NAT (Dynamic IP Pool Allocation)</option>
                <option value="STATIC">Static NAT (1:1 Dedicated Host Mapping)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                  Router LAN Gateway IP
                </label>
                <input 
                  type="text" 
                  className="w-full bg-surfaceElevated border border-border rounded-xl p-3 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200" 
                  value={config.routerLanIP}
                  onChange={(e) => setConfig({ ...config, routerLanIP: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                  Router Public WAN IP
                </label>
                <input 
                  type="text" 
                  className="w-full bg-surfaceElevated border border-border rounded-xl p-3 text-sm font-mono text-primary focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200" 
                  value={config.routerWanIP}
                  onChange={(e) => setConfig({ ...config, routerWanIP: e.target.value })}
                />
              </div>
            </div>

            {config.natMode === 'DYNAMIC' && (
              <div className="p-4 rounded-xl bg-surfaceElevated border border-amber-500/30">
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2">
                  Public IP Pool (Comma-separated)
                </label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-border rounded-xl p-3 text-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200" 
                  value={poolInput}
                  onChange={(e) => setPoolInput(e.target.value)}
                />
                <span className="text-[11px] text-textMuted mt-1 block">
                  Available IP pool for dynamic client assignments
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">
                Mapping Time-to-Live (TTL in seconds)
              </label>
              <input 
                type="number" 
                className="w-full bg-surfaceElevated border border-border rounded-xl p-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200" 
                value={config.mappingTtl}
                onChange={(e) => setConfig({ ...config, mappingTtl: Number(e.target.value) })}
              />
              <span className="text-[11px] text-textMuted mt-1 block">
                Duration before idle translation mappings are purged from NAT memory
              </span>
            </div>
          </div>
          
          <div className="mt-8 flex flex-wrap items-center gap-4 pt-4 border-t border-border">
            <button 
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-glow-primary transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              Save Configuration
            </button>
            <button 
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-surfaceElevated hover:bg-black/10 dark:hover:bg-white/10 border border-border text-textMuted hover:text-text transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset NAT Table
            </button>
            {saved && (
              <span className="text-emerald-500 text-sm font-semibold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Settings Saved!
              </span>
            )}
            {resetMsg && (
              <span className="text-amber-500 text-sm font-semibold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> NAT Mappings Cleared!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
