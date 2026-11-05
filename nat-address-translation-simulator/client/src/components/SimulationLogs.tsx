import { useState } from 'react';
import { useSimulationStore, type SimulationEvent } from '../store/useSimulationStore';
import { 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  BookOpen 
} from 'lucide-react';

export function SimulationLogs() {
  const { logs, clearLogs, setSelectedPacket, setIsInspectorOpen } = useSimulationStore();
  const [filter, setFilter] = useState<'ALL' | 'NAT' | 'SECURITY' | 'ROUTING'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ERROR': return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      default: return <Info className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'NAT_TRANSLATION':
      case 'PORT_ALLOCATION':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">NAT</span>;
      case 'SECURITY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-500">FIREWALL</span>;
      case 'ROUTING':
      case 'DELIVERY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-500 dark:text-cyan-400">ROUTER</span>;
      default:
        return null;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    if (filter === 'NAT') return log.category === 'NAT_TRANSLATION' || log.category === 'PORT_ALLOCATION';
    if (filter === 'SECURITY') return log.category === 'SECURITY' || log.type === 'ERROR';
    if (filter === 'ROUTING') return log.category === 'ROUTING' || log.category === 'DELIVERY';
    return true;
  });

  const handleInspect = (log: SimulationEvent) => {
    if (log.packetSnapshot) {
      setSelectedPacket(log.packetSnapshot);
      setIsInspectorOpen(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter and Action Bar */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-border">
        <div className="flex items-center gap-1 overflow-x-auto text-xs py-1">
          {(['ALL', 'NAT', 'SECURITY', 'ROUTING'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === f
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textMuted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {f === 'ALL' ? 'All Events' : f === 'NAT' ? 'NAT Translations' : f === 'SECURITY' ? 'Firewall Drops' : 'Routing'}
            </button>
          ))}
        </div>

        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="p-1.5 rounded-lg text-textMuted hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            title="Clear all event logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Log Feed */}
      {filteredLogs.length === 0 ? (
        <div className="glass-panel text-center p-8 border border-border rounded-xl">
          <Info className="w-6 h-6 text-textMuted mx-auto mb-2 opacity-50" />
          <p className="text-xs text-textMuted">No events recorded in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map(log => {
            const isExpanded = expandedLogId === log.id;
            const hasDetails = Boolean(log.explanation || log.detailedTrace?.length || log.packetSnapshot);

            return (
              <div 
                key={log.id} 
                className="p-3 bg-surface border border-border rounded-xl text-xs shadow-sm transition-all hover:border-indigo-500/30"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-textMuted">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {getCategoryBadge(log.category)}
                      {log.rfcReference && (
                        <span className="text-[9px] font-mono text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-1 rounded truncate max-w-[150px]">
                          {log.rfcReference}
                        </span>
                      )}
                    </div>

                    <div className={`break-words leading-relaxed ${
                      log.type === 'ERROR' ? 'text-rose-500 font-semibold' :
                      log.type === 'SUCCESS' ? 'text-emerald-500 font-medium' :
                      log.type === 'WARNING' ? 'text-amber-500 font-medium' :
                      'text-text'
                    }`}>
                      {log.message}
                    </div>

                    {/* Expandable Action Row */}
                    {hasDetails && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          {isExpanded ? 'Hide Trace' : 'Trace & Explanation'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {log.packetSnapshot && (
                          <button
                            onClick={() => handleInspect(log)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-textMuted hover:text-primary transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Inspect Packet
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2.5 text-xs animate-fade-in">
                    {log.explanation && (
                      <div className="p-2.5 rounded-lg bg-surfaceElevated border border-border text-text/90 leading-relaxed">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Technical Explanation
                        </div>
                        {log.explanation}
                      </div>
                    )}

                    {log.detailedTrace && log.detailedTrace.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-textMuted flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Router Execution Trace
                        </div>
                        <div className="space-y-1">
                          {log.detailedTrace.map((stepText, idx) => (
                            <div 
                              key={idx}
                              className="p-1.5 rounded-md bg-surfaceElevated border border-border/80 flex items-start gap-2 text-[11px]"
                            >
                              <span className="font-mono text-textMuted font-bold shrink-0">{idx + 1}.</span>
                              <span className="text-text leading-relaxed">{stepText}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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