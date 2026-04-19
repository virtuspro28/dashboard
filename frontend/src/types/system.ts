export interface CpuInfo {
  model: string;
  cores: number;
  usagePercent: number;
}

export interface MemoryInfo {
  totalMB: number;
  usedMB: number;
  freeMB: number;
  usagePercent: number;
}

export interface DiskInfo {
  filesystem: string;
  mountpoint: string;
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usagePercent: number;
}

export interface TemperatureInfo {
  celsius: number | null;
  source: string;
  available: boolean;
}

export interface SystemStats {
  cpu: CpuInfo;
  memory: MemoryInfo;
  disks: DiskInfo[];
  temperature: TemperatureInfo;
  uptime: {
    system: number;
    process: number;
  };
  loadAverage: number[];
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
