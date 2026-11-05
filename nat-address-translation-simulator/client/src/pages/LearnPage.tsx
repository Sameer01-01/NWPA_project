export default function LearnPage() {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Learn NAT (Network Address Translation)</h1>
      
      <div className="max-w-3xl space-y-8">
        <section className="glass-panel p-6">
          <h2 className="text-xl font-bold text-primary mb-3">What is NAT?</h2>
          <p className="text-text/80 leading-relaxed">
            Network Address Translation (NAT) is a method used in routers to translate private, non-routable IP addresses on an internal network to a public, routable IP address for use on the Internet. It conserves IPv4 addresses and provides a layer of security by hiding internal network structures.
          </p>
        </section>

        <section className="glass-panel p-6">
          <h2 className="text-xl font-bold text-primary mb-3">NAT Terminology</h2>
          <ul className="list-disc pl-5 space-y-2 text-text/80">
            <li><strong className="text-text">Inside Local:</strong> The actual private IP address of a host on the inner network.</li>
            <li><strong className="text-text">Inside Global:</strong> The public IP address that the outside world sees representing the internal host.</li>
            <li><strong className="text-text">Outside Local:</strong> The IP address of an outside host as it appears to the inside network.</li>
            <li><strong className="text-text">Outside Global:</strong> The actual public IP address of the outside host on the Internet.</li>
          </ul>
        </section>

        <section className="glass-panel p-6">
          <h2 className="text-xl font-bold text-primary mb-3">Types of NAT</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-text mb-1">Static NAT</h3>
              <p className="text-text/80 text-sm">A one-to-one mapping between a specific private IP and a specific public IP. Useful for hosting servers on a private network.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-text mb-1">Dynamic NAT</h3>
              <p className="text-text/80 text-sm">Maps private IPs to a pool of available public IPs on a first-come, first-served basis. If the pool is exhausted, new connections are dropped.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-text mb-1">PAT (Port Address Translation / NAT Overload)</h3>
              <p className="text-text/80 text-sm">The most common form. Maps multiple private IPs to a single public IP by changing the source port of outbound packets. The router tracks these ports in its NAT table to route returning traffic back to the correct internal host.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
