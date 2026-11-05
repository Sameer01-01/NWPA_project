import { useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Clock, Info, ChevronDown, ChevronUp, Layers, Cpu, ShieldCheck } from 'lucide-react';

export function NatTable() {
  const { natTable } = useSimulationStore();
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const getTtlBadge = (remaining?: number) => {
    const ttl = remaining ?? 60;
    if (ttl <= 10) {
      return (
        <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
          <Clock className="w-3 h-3" /> {ttl}s left
        </span>
      );
    }
    if (ttl <= 30) {
      return (
        <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          <Clock className="w-3 h-3" /> {ttl}s left
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
        <Clock className="w-3 h-3" /> {ttl}s left
      </span>
    );
  };

  const getNatTypeBadge = (type?: string) => {
    switch (type) {
      case 'STATIC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/25">STATIC 1:1</span>;
      case 'DYNAMIC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/25">DYNAMIC POOL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/25">PAT / NAPT</span>;
    }
  };

  return (
    <div className="space-y-4">
      {natTable.length === 0 ? (
        <div className="glass-panel text-center p-8 border border-border rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-text mb-1">NAT Translation Table is Empty</h4>
          <p className="text-xs text-textMuted max-w-xs mx-auto">
            Send a packet from the Generator or click "Burst Traffic" to allocate dynamic stateful port mappings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-textMuted px-1">
            <span>Active Translations: <strong className="text-text">{natTable.length}</strong></span>
            <span className="font-mono text-[11px]">Table Timeout: 60s RFC Sliding Window</span>
          </div>

          {natTable.map(mapping => {
            const isExpanded = expandedRowId === mapping.id;
            return (
              <div 
                key={mapping.id} 
                className="p-3.5 bg-surface border border-border rounded-xl text-sm shadow-sm transition-all hover:border-indigo-500/40"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                      {mapping.protocol}
                    </span>
                    {getNatTypeBadge(mapping.natType)}
                    {mapping.sourceHostName && (
                      <span className="text-[11px] font-semibold text-textMuted px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 truncate max-w-[120px]">
                        {mapping.sourceHostName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getTtlBadge(mapping.remainingTtl)}
                    <span className="text-[11px] font-mono text-textMuted hidden sm:inline">
                      {mapping.packetCount ?? 1} pkts
                    </span>
                  </div>
                </div>
                
                {/* IP Mapping Matrix */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                  <div className="p-2 rounded-lg bg-surfaceElevated border border-border/80">
                    <div className="text-textMuted text-[10px] uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-indigo-400" /> Inside Local (Private)
                    </div>
                    <div className="font-mono text-text font-medium truncate">
                      {mapping.insideLocalIP}:{mapping.insideLocalPort ?? '*'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-surfaceElevated border border-border/80">
                    <div className="text-textMuted text-[10px] uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" /> Inside Global (NAT WAN)
                    </div>
                    <div className="font-mono text-primary font-bold truncate">
                      {mapping.insideGlobalIP}:{mapping.insideGlobalPort ?? '*'}
                    </div>
                  </div>
                </div>

                {mapping.outsideGlobalIP && (
                  <div className="text-[11px] font-mono text-textMuted flex items-center justify-between px-1 mb-2">
                    <span>Outside Target:</span>
                    <span className="text-text">{mapping.outsideGlobalIP}:{mapping.outsideGlobalPort ?? '*'}</span>
                  </div>
                )}

                {/* Explain Accordion Button */}
                <button
                  type="button"
                  onClick={() => toggleExpand(mapping.id)}
                  className="w-full mt-1 pt-1.5 border-t border-border flex items-center justify-between text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Explain Translation Logic
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Educational Explanation Drawer */}
                {isExpanded && (
                  <div className="mt-2.5 p-3 rounded-xl bg-surfaceElevated border border-indigo-500/20 text-xs space-y-2 animate-fade-in">
                    <p className="text-text leading-relaxed font-normal">
                      {mapping.explanation || (
                        `The router allocated public port ${mapping.insideGlobalPort} on WAN IP ${mapping.insideGlobalIP} to represent private host ${mapping.insideLocalIP}:${mapping.insideLocalPort}. When return packets arrive with destination port ${mapping.insideGlobalPort}, the NAT engine inspects this stateful entry and rewrites the destination back to ${mapping.insideLocalIP}:${mapping.insideLocalPort}.`
                      )}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-border/80 text-[10px] font-mono text-textMuted">
                      <span>RFC 3022 Stateful PAT Session</span>
                      <span>Created: {new Date(mapping.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}