import { Protocol } from "shared";

interface PortAllocation {
  publicIP: string;
  port: number;
  protocol: Protocol;
}

export class PortManager {
  private activePorts: Set<string>; // Format: "IP:PORT:PROTOCOL"
  private portRangeStart: number;
  private portRangeEnd: number;

  constructor(portRangeStart: number = 40000, portRangeEnd: number = 50000) {
    this.activePorts = new Set();
    this.portRangeStart = portRangeStart;
    this.portRangeEnd = portRangeEnd;
  }

  private getKey(publicIP: string, port: number, protocol: Protocol): string {
    return `${publicIP}:${port}:${protocol}`;
  }

  public setPortRange(start: number, end: number) {
    this.portRangeStart = start;
    this.portRangeEnd = end;
  }

  public allocatePort(publicIP: string, protocol: Protocol): number | null {
    // Attempt to find a free port
    for (let port = this.portRangeStart; port <= this.portRangeEnd; port++) {
      const key = this.getKey(publicIP, port, protocol);
      if (!this.activePorts.has(key)) {
        this.activePorts.add(key);
        return port;
      }
    }
    return null; // No ports available
  }

  public releasePort(publicIP: string, port: number, protocol: Protocol): void {
    const key = this.getKey(publicIP, port, protocol);
    this.activePorts.delete(key);
  }

  public isPortAvailable(publicIP: string, port: number, protocol: Protocol): boolean {
    const key = this.getKey(publicIP, port, protocol);
    return !this.activePorts.has(key);
  }

  public getAvailablePortCount(): number {
    const totalPorts = (this.portRangeEnd - this.portRangeStart + 1);
    // Since activePorts can contain multiple IPs/Protocols, this is a rough estimate
    // A better approach would be per IP/Protocol, but we can return total capacity - used
    return totalPorts - this.activePorts.size; 
  }

  public getPortUtilization(): number {
    const totalPorts = (this.portRangeEnd - this.portRangeStart + 1);
    if (totalPorts === 0) return 0;
    return (this.activePorts.size / totalPorts) * 100;
  }
  
  public reset(): void {
    this.activePorts.clear();
  }
}
