import { Server, Socket } from "socket.io";
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

const execAsync = promisify(exec);
const log = logger.child("monitor-socket");

export function setupMonitorSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    let statsInterval: NodeJS.Timeout | null = null;
    let logProcess: any = null;

    log.debug(`Client connected to monitor: ${socket.id}`);

    // Docker Stats
    socket.on("docker:stats:subscribe", () => {
      if (statsInterval) return;
      
      log.info(`Broadcasting stats for client ${socket.id}`);
      
      const fetchStats = async () => {
        try {
          if (config.platform.isWindows) {
            // Mock stats for Windows testing
            const mock = [
              { ID: "e1234", Name: "Plex", CPUPerc: "2.5%", MemUsage: "450MiB", MemPerc: "12%", NetIO: "1MB/2MB", BlockIO: "0B/0B", PIDs: "12" },
              { ID: "a9876", Name: "Pi-hole", CPUPerc: "0.5%", MemUsage: "80MiB", MemPerc: "2%", NetIO: "500KB/100KB", BlockIO: "0B/0B", PIDs: "5" }
            ];
            socket.emit("docker:stats:data", mock);
            return;
          }

          const { stdout } = await execAsync('docker stats --no-stream --format "{{json .}}"');
          const lines = stdout.trim().split('\n').filter(l => l.length > 0);
          const stats = lines.map(l => JSON.parse(l));
          socket.emit("docker:stats:data", stats);
        } catch (err: any) {
          log.error(`Error fetching docker stats: ${err.message}`);
          socket.emit("docker:stats:error", err.message);
        }
      };

      fetchStats();
      statsInterval = setInterval(fetchStats, 2000);
    });

    socket.on("docker:stats:unsubscribe", () => {
      if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
        log.info(`Stopped stats for client ${socket.id}`);
      }
    });

    // Docker Logs
    socket.on("docker:logs:subscribe", (containerId: string) => {
      if (logProcess) {
        logProcess.kill();
      }

      log.info(`Streaming logs for container ${containerId} to client ${socket.id}`);
      
      logProcess = spawn('docker', ['logs', '-f', '--tail', '100', containerId]);

      logProcess.stdout.on('data', (data: Buffer) => {
        socket.emit(`docker:logs:data:${containerId}`, data.toString());
      });

      logProcess.stderr.on('data', (data: Buffer) => {
        socket.emit(`docker:logs:data:${containerId}`, data.toString());
      });

      logProcess.on('error', (err: Error) => {
        socket.emit(`docker:logs:error:${containerId}`, err.message);
      });

      logProcess.on('close', () => {
        log.info(`Logs stream closed for ${containerId}`);
      });
    });

    socket.on("docker:logs:unsubscribe", () => {
      if (logProcess) {
        logProcess.kill();
        logProcess = null;
      }
    });

    socket.on("disconnect", () => {
      if (statsInterval) clearInterval(statsInterval);
      if (logProcess) logProcess.kill();
      log.debug(`Client disconnected from monitor: ${socket.id}`);
    });
  });
}
