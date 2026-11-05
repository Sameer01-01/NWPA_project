import { useSimulationStore } from '../store/useSimulationStore';

export function NatTable() {
  const { natTable } = useSimulationStore();

  return (
    <div className="space-y-4">
      {natTable.length === 0 ? (
        <div className="text-center text-textMuted py-8 text-sm">
          NAT Table is empty. Transmit packets to generate translation entries.
        </div>
      ) : (
        <div className="space-y-2.5">
          {natTable.map(mapping => (
            <div key={mapping.id} className="p-3.5 bg-surfaceElevated border border-border rounded-xl text-sm shadow-sm transition-all hover:border-indigo-500/40">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                  {mapping.protocol}
                </span>
                <span className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {mapping.state}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-textMuted text-[11px] mb-0.5">Inside Local</div>
                  <div className="font-mono text-text">{mapping.insideLocalIP}:{mapping.insideLocalPort}</div>
                </div>
                <div>
                  <div className="text-textMuted text-[11px] mb-0.5">Inside Global (NAT)</div>
                  <div className="font-mono text-primary font-semibold">{mapping.insideGlobalIP}:{mapping.insideGlobalPort}</div>
                </div>
                {mapping.outsideGlobalIP && (
                  <div className="col-span-2 mt-1.5 pt-1.5 border-t border-border">
                    <div className="text-textMuted text-[11px] mb-0.5">Outside Global (Dest)</div>
                    <div className="font-mono text-text/80">{mapping.outsideGlobalIP}:{mapping.outsideGlobalPort}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
