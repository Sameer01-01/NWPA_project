import { useSimulationStore } from '../store/useSimulationStore';
import { clsx } from 'clsx';
import { ShieldAlert, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

export function SimulationLogs() {
  const { logs } = useSimulationStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'ERROR': return <ShieldAlert className="w-4 h-4 text-error" />;
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <div className="text-center text-textMuted py-8 text-sm">No events recorded yet.</div>
      ) : (
        logs.map(log => (
          <div key={log.id} className="flex gap-3 p-3 bg-surfaceElevated border border-border rounded-xl text-sm shadow-sm transition-all">
            <div className="mt-0.5 shrink-0">
              {getIcon(log.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-textMuted mb-0.5 font-mono">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
              <div className={clsx("break-words text-xs leading-relaxed", {
                'text-rose-500 font-medium': log.type === 'ERROR',
                'text-emerald-500 font-medium': log.type === 'SUCCESS',
                'text-amber-500 font-medium': log.type === 'WARNING',
                'text-text': log.type === 'INFO',
              })}>
                {log.message}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
