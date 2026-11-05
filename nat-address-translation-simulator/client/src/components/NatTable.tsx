import { useSimulationStore } from '../store/useSimulationStore';

export function NatTable() {
  const { natTable } = useSimulationStore();

  return (
    <div className="space-y-4">
      {natTable.length === 0 ? (
        <div className="text-center text-textMuted py-4 text-sm">NAT Table is empty.</div>
      ) : (
        <div className="space-y-2">
          {natTable.map(mapping => (
            <div key={mapping.id} className="p-3 bg-surface border border-white/5 rounded-lg text-sm">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                <span className="font-bold text-primary">{mapping.protocol}</span>
                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">{mapping.state}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-textMuted mb-0.5">Inside Local</div>
                  <div className="font-mono">{mapping.insideLocalIP}:{mapping.insideLocalPort}</div>
                </div>
                <div>
                  <div className="text-textMuted mb-0.5">Inside Global (NAT)</div>
                  <div className="font-mono text-primary">{mapping.insideGlobalIP}:{mapping.insideGlobalPort}</div>
                </div>
                {mapping.outsideGlobalIP && (
                  <div className="col-span-2 mt-1 pt-1 border-t border-white/5">
                    <div className="text-textMuted mb-0.5">Outside Global (Dest)</div>
                    <div className="font-mono">{mapping.outsideGlobalIP}:{mapping.outsideGlobalPort}</div>
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
