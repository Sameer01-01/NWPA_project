import { BookOpen, Layers, Lock, Database, Zap, ArrowRightLeft, ShieldCheck, Cpu, Globe } from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-border bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-cyan-950/30 shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
            <BookOpen className="w-3.5 h-3.5" />
            RFC 3022 & RFC 1918 Reference Guide
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
              Learn Network Address Translation
            </span>
          </h1>
          <p className="text-sm md:text-base text-textMuted leading-relaxed">
            Discover how modern routers translate private IP addresses to routable public addresses, enable thousands of devices to share single public IPs, and protect internal topologies.
          </p>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="space-y-6 max-w-5xl">
        {/* What is NAT? */}
        <section className="glass-panel p-6 md:p-8 rounded-2xl border border-border border-l-4 border-l-indigo-500 shadow-md transition-all duration-300 hover:shadow-glow-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                What is Network Address Translation (NAT)?
              </h2>
              <span className="text-xs text-textMuted">Fundamental Internet Routing Technology</span>
            </div>
          </div>
          <p className="text-text/90 leading-relaxed text-sm md:text-base mb-6">
            Network Address Translation (NAT) is a networking standard implemented in routers and firewalls. It re-maps one IP address space into another by modifying network address information in the IP packet header while they are in transit across a traffic routing device.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
              <div className="text-indigo-500 dark:text-indigo-400 font-semibold text-sm mb-1 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> IPv4 Conservation
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                Slows the depletion of 32-bit IPv4 addresses by allowing entire local networks to utilize a single public IPv4 address.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
              <div className="text-cyan-500 dark:text-cyan-400 font-semibold text-sm mb-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Perimeter Security
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                Hides internal device IP structures and ports from external Internet hosts, preventing unsolicited inbound scans.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
              <div className="text-purple-500 dark:text-purple-400 font-semibold text-sm mb-1 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" /> Flexible Subnetting
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                Allows organizations to change internal private address schemes freely without needing re-registration from ISPs.
              </p>
            </div>
          </div>
        </section>

        {/* NAT Terminology */}
        <section className="glass-panel p-6 md:p-8 rounded-2xl border border-border border-l-4 border-l-cyan-500 shadow-md transition-all duration-300 hover:shadow-glow-secondary">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500">
                NAT Terminology (Cisco RFC Convention)
              </h2>
              <span className="text-xs text-textMuted">The Four Standard Address Perspectives</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-surfaceElevated border border-border hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-text">Inside Local</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                  192.168.1.15:49152
                </span>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                The actual private IP address assigned to a host on the inside LAN network. Not routable across the public Internet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surfaceElevated border border-border hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-text">Inside Global</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold">
                  203.0.113.5:10001
                </span>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                The public IP address that represents the internal host to the outside world, assigned to the router's WAN interface.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surfaceElevated border border-border hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-text">Outside Local</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                  198.51.100.25:80
                </span>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                The IP address of an outside destination host as it appears to hosts on the inside private network.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surfaceElevated border border-border hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-text">Outside Global</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  198.51.100.25:80
                </span>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                The authentic public IP address allocated to a host on the outside Internet by its network owner.
              </p>
            </div>
          </div>
        </section>

        {/* Types of NAT */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Three Fundamental Types of NAT
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Static NAT */}
            <div className="glass-panel p-6 rounded-2xl border border-border border-l-4 border-l-rose-500 flex flex-col justify-between hover:shadow-glow-error transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <Lock className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    1-to-1 Mapping
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text mb-2">Static NAT</h3>
                <p className="text-xs md:text-sm text-textMuted leading-relaxed mb-4">
                  Configures an unvarying one-to-one mapping between a specific internal private IP and an assigned dedicated public IP address.
                </p>
              </div>
              <div className="p-3 bg-surfaceElevated rounded-xl border border-border text-xs space-y-1 font-mono">
                <div className="text-textMuted">Example Mapping:</div>
                <div className="text-rose-500 dark:text-rose-400 font-semibold">192.168.1.50 ↔ 203.0.113.50</div>
                <div className="text-[11px] text-textMuted pt-1">Best for: Hosting Web or Mail Servers</div>
              </div>
            </div>

            {/* Dynamic NAT */}
            <div className="glass-panel p-6 rounded-2xl border border-border border-l-4 border-l-amber-500 flex flex-col justify-between hover:shadow-glow-secondary transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Database className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Pool Allocation
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text mb-2">Dynamic NAT</h3>
                <p className="text-xs md:text-sm text-textMuted leading-relaxed mb-4">
                  Maps private IP addresses to a pool of available public IP addresses dynamically on a first-come, first-served basis.
                </p>
              </div>
              <div className="p-3 bg-surfaceElevated rounded-xl border border-border text-xs space-y-1 font-mono">
                <div className="text-textMuted">Example Pool:</div>
                <div className="text-amber-600 dark:text-amber-400 font-semibold">192.168.1.x → [203.0.113.10-20]</div>
                <div className="text-[11px] text-textMuted pt-1">Best for: Corporate office subnets with IP blocks</div>
              </div>
            </div>

            {/* PAT */}
            <div className="glass-panel p-6 rounded-2xl border border-border border-l-4 border-l-emerald-500 flex flex-col justify-between hover:shadow-glow-success transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Most Popular (Overload)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text mb-2">PAT (Port Translation)</h3>
                <p className="text-xs md:text-sm text-textMuted leading-relaxed mb-4">
                  Translates multiple internal private IP addresses to a single public IP by altering source port numbers in outbound TCP/UDP headers.
                </p>
              </div>
              <div className="p-3 bg-surfaceElevated rounded-xl border border-border text-xs space-y-1 font-mono">
                <div className="text-textMuted">Example Overload:</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">192.168.1.10:49152 → :10001</div>
                <div className="text-[11px] text-textMuted pt-1">Best for: Home & enterprise Internet gateways</div>
              </div>
            </div>
          </div>
        </section>

        {/* Translation Lifecycle */}
        <section className="glass-panel p-6 md:p-8 rounded-2xl border border-border border-l-4 border-l-purple-500 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
                PAT Packet Translation Lifecycle
              </h2>
              <span className="text-xs text-textMuted">Step-by-step stateful inspection in action</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', label: 'Outbound Request', color: 'text-primary', desc: 'Host A (192.168.1.10:5000) generates an outbound packet destined for Internet Server (93.184.216.34:80).' },
              { step: '02', label: 'Gateway Intercept', color: 'text-indigo-500', desc: 'NAT Router intercepts packet at LAN interface, allocates ephemeral WAN port 10001, and records entry in NAT table.' },
              { step: '03', label: 'Header Rewrite', color: 'text-cyan-500', desc: 'Router modifies source IP/port to 203.0.113.5:10001, recalculates checksums, and transmits across the WAN.' },
              { step: '04', label: 'Inbound Demux', color: 'text-emerald-500', desc: 'When server response arrives for :10001, router looks up NAT table and routes back to 192.168.1.10:5000.' },
            ].map(({ step, label, color, desc }) => (
              <div key={step} className="p-4 rounded-xl bg-surfaceElevated border border-border">
                <span className={`text-xs font-mono font-bold ${color} mb-1 block`}>STEP {step}</span>
                <h4 className="font-bold text-sm text-text mb-1">{label}</h4>
                <p className="text-xs text-textMuted">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
