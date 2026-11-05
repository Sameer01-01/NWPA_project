export function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255 || String(num) !== part) {
      return false;
    }
  }
  return true;
}

export function isPrivateIPv4(ip: string): boolean {
  if (!isValidIPv4(ip)) return false;
  const parts = ip.split(".");
  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // 10.0.0.0/8
  if (first === 10) return true;
  // 172.16.0.0/12
  if (first === 172 && second >= 16 && second <= 31) return true;
  // 192.168.0.0/16
  if (first === 192 && second === 168) return true;

  return false;
}

export function isPublicIPv4(ip: string): boolean {
  return isValidIPv4(ip) && !isPrivateIPv4(ip) && !isLoopbackIPv4(ip);
}

export function isLoopbackIPv4(ip: string): boolean {
  return ip.startsWith("127.");
}

export function isValidPort(port: number | undefined): boolean {
  if (port === undefined) return false;
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

export function isValidSubnet(subnet: string): boolean {
  // Simple check for something like 192.168.1.0/24
  const [ip, cidrStr] = subnet.split("/");
  if (!isValidIPv4(ip)) return false;
  if (!cidrStr) return false;
  const cidr = parseInt(cidrStr, 10);
  return cidr >= 0 && cidr <= 32;
}
