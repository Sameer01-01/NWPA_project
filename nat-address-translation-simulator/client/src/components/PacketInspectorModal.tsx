import { useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { X, Cpu, Layers, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export function PacketInspectorModal() {
  const { selectedPacket, isInspectorOpen, setIsInspectorOpen } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'diff' | 'headers' | 'trace' | 'theory'>('diff');

  if (!isInspectorOpen || !selectedPacket) return null;

  const packet = selectedPacket;
  const details = packet.translationDetails;
  const headers = packet.headers;
  const isDropped = packet.status === 'DROPPED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] flex flex-col border border-border rounded-2xl shadow-2xl bg-surface overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surfaceElevated/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isDropped 
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text">
                  Deep Packet & Translation Inspector
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isDropped 
                    ? 'bg-rose-500/15 text-rose-500' 
                    : 'bg-emerald-500/15 text-emerald-500'
                }`}>
                  {packet.status}
                </span>
              </div>
              <p className="text-xs text-textMuted font-mono">
                Packet ID: {packet.id} | Protocol: {packet.protocol} | Direction: {packet.direction}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsInspectorOpen(false)}
            className="p-2 rounded-xl text-textMuted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-surfaceElevated/30 px-5 gap-4">
          <button
            onClick={() => setActiveTab('diff')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'diff'
                ? 'border-primary text-primary'
                : 'border-transparent text-textMuted hover:text-text'
            }`}
          >
            Header Comparison (Diff)
          </button>
          <button
            onClick={() => setActiveTab('trace')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'trace'
                ? 'border-primary text-primary'
                : 'border-transparent text-textMuted hover:text-text'
            }`}
          >
            Router Execution Steps ({details?.steps?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'headers'
                ? 'border-primary text-primary'
                : 'border-transparent text-textMuted hover:text-text'
            }`}
          >
            L3/L4 Packet Headers
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'theory'
                ? 'border-primary text-primary'
                : 'border-transparent text-textMuted hover:text-text'
            }`}
          >
            RFC Narrative & Theory
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: HEADER DIFF */}
          {activeTab === 'diff' && (
            <div className="space-y-4">
              {details?.diff ? (
                <>
                  <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-text/90 leading-relaxed">
                    <span className="font-bold text-indigo-500 dark:text-indigo-400 block mb-1">
                      NAT Gateway Header Rewrite Summary:
                    </span>
                    {details.explanation}
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-surfaceElevated text-textMuted uppercase border-b border-border text-[11px]">
                        <tr>
                          <th className="p-3">Field</th>
                          <th className="p-3">Ingress (Original)</th>
                          <th className="p-3">Egress (Translated)</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr className={details.diff.sourceIP.changed ? 'bg-indigo-500/5' : ''}>
                          <td className="p-3 font-semibold text-text">Source IP</td>
                          <td className="p-3 text-textMuted">{details.diff.sourceIP.before}</td>
                          <td className="p-3 text-primary font-bold">{details.diff.sourceIP.after}</td>
                          <td className="p-3 text-right">
                            {details.diff.sourceIP.changed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-500 font-bold">REWRITTEN</span>
                            ) : (
                              <span className="text-textMuted">UNCHANGED</span>
                            )}
                          </td>
                        </tr>

                        {details.diff.sourcePort && (
                          <tr className={details.diff.sourcePort.changed ? 'bg-indigo-500/5' : ''}>
                            <td className="p-3 font-semibold text-text">Source Port</td>
                            <td className="p-3 text-textMuted">{details.diff.sourcePort.before}</td>
                            <td className="p-3 text-primary font-bold">{details.diff.sourcePort.after}</td>
                            <td className="p-3 text-right">
                              {details.diff.sourcePort.changed ? (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-500 font-bold">REWRITTEN</span>
                              ) : (
                                <span className="text-textMuted">UNCHANGED</span>
                              )}
                            </td>
                          </tr>
                        )}

                        <tr className={details.diff.destinationIP.changed ? 'bg-cyan-500/5' : ''}>
                          <td className="p-3 font-semibold text-text">Destination IP</td>
                          <td className="p-3 text-textMuted">{details.diff.destinationIP.before}</td>
                          <td className="p-3 text-cyan-500 font-bold">{details.diff.destinationIP.after}</td>
                          <td className="p-3 text-right">
                            {details.diff.destinationIP.changed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-500 font-bold">DEMUXED</span>
                            ) : (
                              <span className="text-textMuted">PRESERVED</span>
                            )}
                          </td>
                        </tr>

                        {details.diff.destinationPort && (
                          <tr className={details.diff.destinationPort.changed ? 'bg-cyan-500/5' : ''}>
                            <td className="p-3 font-semibold text-text">Destination Port</td>
                            <td className="p-3 text-textMuted">{details.diff.destinationPort.before}</td>
                            <td className="p-3 text-cyan-500 font-bold">{details.diff.destinationPort.after}</td>
                            <td className="p-3 text-right">
                              {details.diff.destinationPort.changed ? (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-500 font-bold">DEMUXED</span>
                              ) : (
                                <span className="text-textMuted">PRESERVED</span>
                              )}
                            </td>
                          </tr>
                        )}

                        <tr>
                          <td className="p-3 font-semibold text-text">Time-to-Live (TTL)</td>
                          <td className="p-3 text-textMuted">{details.diff.ttl.before}</td>
                          <td className="p-3 font-bold text-amber-500">{details.diff.ttl.after}</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-500 font-bold">HOP -1</span>
                          </td>
                        </tr>

                        <tr>
                          <td className="p-3 font-semibold text-text">Header Checksum</td>
                          <td className="p-3 text-textMuted">{details.diff.checksum.before}</td>
                          <td className="p-3 font-bold text-emerald-500">{details.diff.checksum.after}</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-500 font-bold">RECALCULATED</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : isDropped ? (
                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Packet Translation Terminated / Dropped</span>
                  </div>
                  <p className="text-xs text-text/80 leading-relaxed">
                    {packet.dropReason || 'The gateway dropped this packet before translation could occur.'}
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-textMuted text-xs">
                  Packet is currently queued or awaiting processing.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROUTER EXECUTION STEPS */}
          {activeTab === 'trace' && (
            <div className="space-y-3">
              <span className="text-xs text-textMuted block mb-2">
                Sequential internal lifecycle of the datagram inside the router's NAT processing engine:
              </span>

              {details?.steps?.map((step, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surfaceElevated border border-border flex items-start gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-mono font-bold shrink-0 mt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="flex-1 text-text leading-relaxed font-mono">
                    {step}
                  </div>
                </div>
              ))}

              {(!details?.steps || details.steps.length === 0) && (
                <div className="py-8 text-center text-textMuted text-xs">
                  No execution trace available for this packet.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: L3/L4 PACKET HEADERS */}
          {activeTab === 'headers' && (
            <div className="space-y-4">
              {headers ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
                    <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5" /> Layer 3: IPv4 Header Inspection
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-textMuted block text-[10px]">Version</span>
                        <span className="font-semibold text-text">{headers.ipVersion}</span>
                      </div>
                      <div>
                        <span className="text-textMuted block text-[10px]">Header Length</span>
                        <span className="font-semibold text-text">{headers.ipHeaderLength} Bytes</span>
                      </div>
                      <div>
                        <span className="text-textMuted block text-[10px]">Identification</span>
                        <span className="font-semibold text-text">{headers.identification}</span>
                      </div>
                      <div>
                        <span className="text-textMuted block text-[10px]">Time to Live (TTL)</span>
                        <span className="font-semibold text-text">{headers.ttl}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-textMuted block text-[10px]">Type of Service (ToS)</span>
                        <span className="font-semibold text-text">{headers.typeOfService}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-textMuted block text-[10px]">IPv4 Checksum</span>
                        <span className="font-semibold text-emerald-500">{headers.checksum}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 mb-2 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" /> Layer 4: {packet.protocol} Protocol Header
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-textMuted block text-[10px]">Source Port</span>
                        <span className="font-semibold text-text">{packet.sourcePort || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-textMuted block text-[10px]">Destination Port</span>
                        <span className="font-semibold text-text">{packet.destinationPort || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-textMuted block text-[10px]">Control Flags</span>
                        <span className="font-semibold text-indigo-500">{headers.flags.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-textMuted block text-[10px]">Window Size</span>
                        <span className="font-semibold text-text">{headers.windowSize || 65535}</span>
                      </div>
                      <div className="col-span-4 mt-1 pt-2 border-t border-border">
                        <span className="text-textMuted block text-[10px] mb-1">Payload Preview</span>
                        <div className="p-2 rounded bg-surface border border-border text-xs text-textMuted">
                          {headers.payloadPreview}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-textMuted text-xs">
                  Header breakdown unavailable.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: THEORY & RFC */}
          {activeTab === 'theory' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
                <div className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> {details?.rfcReference || 'RFC 3022 Standard'}
                </div>
                <p className="text-text/80 mb-3">
                  This transaction is governed by traditional IP Network Address Translation (NAT) standards. Internal devices use non-routable private address ranges (RFC 1918) such as <code>192.168.0.0/16</code>.
                </p>

                <div className="space-y-2 pt-2 border-t border-border text-textMuted">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Stateful Table Tracking:</strong> The router remembers the connection tuple. When the remote server responds, the router performs reverse matching to send the packet back to the correct private device.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Perimeter Security:</strong> Unsolicited external packets are dropped by default because no state entry exists for inbound initiation.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surfaceElevated/50 flex justify-end">
          <button
            onClick={() => setIsInspectorOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
