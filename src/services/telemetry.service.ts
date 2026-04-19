import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";
import { getContainers } from "./docker.service.js";
import { getDatabase } from "../database/connection.js";

const execAsync = promisify(exec);
const log = logger.child("telemetry-service");

interface NetworkSnapshot {
  timestamp: number;
  rx_bytes: number;
  tx_bytes: number;
  rx_rate: number; // bps
  tx_rate: number; // bps
}

export const TelemetryService = {
  private: {
    networkHistory: [] as NetworkSnapshot[],
    lastSnapshot: null as { time: number; rx: number; tx: number } | null,
    latency: -1,
    cpuFreq: 0,
    model: "Detectando...",
    maxHistoryPoints: 30, // 30 minutos (si guardamos cada 60s)
  },

  async init() {
    log.info("Inicializando Telemetry Service...");
    this.detectModel();
    this.startLoops();
  },

  startLoops() {
    // Loop de Ping (cada 5 segundos)
    setInterval(() => this.measureLatency(), 5000);

    // Loop de Telemetría Hardware (cada 3 segundos)
    setInterval(() => this.measureHardware(), 3000);

    // Loop de Historial de Red (cada 1 minuto para la gráfica)
    setInterval(() => this.snapshotNetwork(), 60000);
  },

  async measureLatency() {
    try {
      const target = "8.8.8.8";
      const cmd = os.platform() === "win32" ? `ping -n 1 ${target}` : `ping -c 1 ${target}`;
      const { stdout } = await execAsync(cmd);
      
      let match;
      if (os.platform() === "win32") {
        match = stdout.match(/tiempo[=<](\d+)ms/i);
      } else {
        match = stdout.match(/time=(\d+\.?\d*)\ ms/i);
      }

      if (match && match[1]) {
        this.private.latency = parseFloat(match[1]);
      }
    } catch (err) {
      this.private.latency = -1;
    }
  },

  async detectModel() {
    if (config.platform.isWindows) {
      this.private.model = "Windows PC (Dev Mode)";
      return;
    }

    try {
      if (fs.existsSync("/proc/device-tree/model")) {
        this.private.model = fs.readFileSync("/proc/device-tree/model", "utf8").replace(/\0/g, "");
      } else {
        const { stdout } = await execAsync("grep Model /proc/cpuinfo");
        this.private.model = stdout.split(":")[1]?.trim() || "Genérico Linux";
      }
    } catch (err) {
      this.private.model = "Desconocido";
    }
  },

  async measureHardware() {
    if (config.platform.isWindows) {
      this.private.cpuFreq = 2.4; // Mock
      return;
    }

    try {
      const freqPath = "/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq";
      if (fs.existsSync(freqPath)) {
        const freqKHz = parseInt(fs.readFileSync(freqPath, "utf8"));
        this.private.cpuFreq = parseFloat((freqKHz / 1000000).toFixed(2));
      }
    } catch (err) {
      this.private.cpuFreq = 0;
    }
  },

  async snapshotNetwork() {
    // Nota: El cálculo real de bps se hace en el frontend o se puede pre-calcular aquí.
    // Usaremos los datos de system-monitor si están disponibles o leeremos directamente.
    // Para simplificar, guardamos una entrada con el timestamp.
    const now = Date.now();
    
    // Solo un placeholder por ahora, el dashboard ya tiene el tráfico actual
    // La idea es que system-monitor.ts ya provee rx_bytes/tx_bytes.
    // Aquí solo guardamos el registro.
  },

  getTelemetry() {
    return {
      latency: this.private.latency,
      cpuFreq: this.private.cpuFreq,
      model: this.private.model,
      history: this.private.networkHistory
    };
  },

  // Método para inyectar datos desde el monitor principal
  pushNetworkData(rx: number, tx: number) {
    const now = Date.now();
    const snapshot: NetworkSnapshot = {
      timestamp: now,
      rx_bytes: rx,
      tx_bytes: tx,
      rx_rate: rx, // En este contexto asumimos que ya viene como tasa bps
      tx_rate: tx,
    };

    this.private.networkHistory.push(snapshot);
    if (this.private.networkHistory.length > this.private.maxHistoryPoints) {
      this.private.networkHistory.shift();
    }
  },

  async getSummary() {
    // 1. Contenedores activos
    const containers = await getContainers();
    const activeServices = containers.filter(c => c.state === 'running').length;

    // 2. Discos saludables
    // Simulamos/Obtenemos salud (En este entorno simplificado, asumimos todos OK por ahora o consultamos DB)
    const healthyDisks = 1; // Próximamente linkear con StorageService

    // 3. Seguridad (Bloqueos)
    const blockedIPs = config.platform.isWindows ? 15 : 0; // Simulamos en Windows

    // 4. Uptime formateado
    const uptimeSec = os.uptime();
    const days = Math.floor(uptimeSec / (3600 * 24));
    const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const uptimeStr = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

    return {
      activeServices,
      healthyDisks,
      blockedIPs,
      uptime: uptimeStr
    };
  }
};

