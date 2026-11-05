import { Device } from "shared";
import { generateId } from "../utils/idUtils";

export class DeviceService {
  private devices: Map<string, Device>;

  constructor() {
    this.devices = new Map();
  }

  public addDevice(deviceData: Omit<Device, "id">): Device {
    const device: Device = {
      ...deviceData,
      id: generateId(),
    };
    this.devices.set(device.id, device);
    return device;
  }

  public getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  public getDeviceByIP(ip: string): Device | undefined {
    return Array.from(this.devices.values()).find(
      d => d.privateIP === ip || d.publicIP === ip
    );
  }

  public getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  public updateDevice(id: string, updates: Partial<Device>): Device | undefined {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...updates };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  public removeDevice(id: string): boolean {
    return this.devices.delete(id);
  }

  public clear(): void {
    this.devices.clear();
  }

  public setDevices(devices: Omit<Device, "id">[]): Device[] {
    this.clear();
    return devices.map(d => this.addDevice(d));
  }
}
