import { useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Home, Building2, AlertTriangle, ShieldAlert, Zap, Plus, Info, RefreshCw } from 'lucide-react';

export function TemplateSelectorBar() {
  const { 
    presets, 
    currentPresetId, 
    fetchPresets, 
    loadPreset, 
    sendBatchTraffic, 
    setIsAddDeviceOpen,
    fetchNatTable
  } = useSimulationStore();

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const currentPreset = presets.find(p => p.id === currentPresetId);

  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'soho-pat': return <Home className="w-4 h-4" />;
      case 'dmz-static': return <Building2 className="w-4 h-4" />;
      case 'dynamic-exhaustion': return <AlertTriangle className="w-4 h-4" />;
      case 'security-drop': return <ShieldAlert className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const getPresetBadgeColor = (id: string, active: boolean) => {
    if (!active) return 'border-border text-textMuted hover:border-primary/50 hover:text-text bg-surface';
    switch (id) {
      case 'soho-pat': return 'border-indigo-500 bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 shadow-sm shadow-indigo-500/20';
      case 'dmz-static': return 'border-cyan-500 bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 shadow-sm shadow-cyan-500/20';
      case 'dynamic-exhaustion': return 'border-amber-500 bg-amber-500/15 text-amber-500 dark:text-amber-400 shadow-sm shadow-amber-500/20';
      case 'security-drop': return 'border-rose-500 bg-rose-500/15 text-rose-500 dark:text-rose-400 shadow-sm shadow-rose-500/20';
      default: return 'border-primary bg-primary/15 text-primary';
    }
  };

  return (
    <div className="p-3 border-b border-border bg-surfaceElevated/70 backdrop-blur-md flex flex-col gap-2.5 z-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Template Pill Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-textMuted mr-1 hidden sm:inline">
            Scenario:
          </span>
          {presets.map((preset) => {
            const isActive = currentPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${getPresetBadgeColor(preset.id, isActive)}`}
                title={preset.description}
              >
                {getPresetIcon(preset.id)}
                <span>{preset.name.split('(')[0].trim()}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => sendBatchTraffic(3)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm hover:shadow-glow-primary transition-all duration-200 cursor-pointer"
            title="Fire 3 concurrent packets from different LAN hosts"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Burst Traffic</span>
          </button>

          <button
            onClick={() => setIsAddDeviceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface hover:bg-black/5 dark:hover:bg-white/10 border border-border text-text transition-all duration-200 cursor-pointer"
            title="Add a custom host, server, or smartphone to the simulation"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Add Device</span>
          </button>

          <button
            onClick={() => fetchNatTable()}
            className="p-1.5 rounded-xl text-textMuted hover:text-text bg-surface hover:bg-black/5 dark:hover:bg-white/10 border border-border transition-colors cursor-pointer"
            title="Refresh Table State"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scenario Briefing & Educational Goal Drawer */}
      {currentPreset && (
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-surface border border-border/80 text-text/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shrink-0">
              <Info className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-text truncate">
              {currentPreset.educationalGoal}
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-textMuted shrink-0 ml-3 hidden md:inline">
            Mode: {currentPreset.natMode} | Router WAN: {currentPreset.routerWanIP}
          </span>
        </div>
      )}
    </div>
  );
}

