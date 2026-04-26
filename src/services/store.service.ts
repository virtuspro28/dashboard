import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import { io } from "../index.js";
import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";
import { getContainers } from "./docker.service.js";
import { NotificationService } from "./notification.service.js";
import { appInventory, type AppInventoryItem } from "../data/appInventory.js";

const execAsync = promisify(exec);
const log = logger.child("store-service");

// Carpeta donde guardaremos los docker-compose.yml generados
const STORE_MANIFEST_DIR = path.join(config.paths.data, "store-manifests");

async function ensureDockerComposeAvailable(): Promise<void> {
  try {
    await execAsync("docker compose version");
  } catch {
    throw new Error("Docker Compose no está disponible. Instálalo o actualiza Docker.");
  }
}

async function checkArchitectureCompatibility(image: string, appId: string): Promise<void> {
  const arch = process.arch; // 'arm', 'arm64', 'x64'
  io.emit(`app:install:log:${appId}`, { stream: "stdout", text: `Verificando compatibilidad de la imagen ${image} con la arquitectura local (${arch})...\n` });
  
  try {
    // Si docker manifest inspect no está disponible, el catch lo omitirá y continuará
    const { stdout } = await execAsync(`docker manifest inspect ${image}`);
    const manifests = JSON.parse(stdout);
    
    // Normalizamos nombres de arquitectura de Node a Docker
    let dockerArch: string = arch;
    if (arch === 'x64') dockerArch = 'amd64';
    if (arch === 'arm') dockerArch = 'arm';
    if (arch === 'arm64') dockerArch = 'arm64';

    const isCompatible = (manifests.manifests || [manifests]).some((m: any) => 
      m.platform && m.platform.architecture && m.platform.architecture.includes(dockerArch)
    );

    if (!isCompatible) {
      const msg = `⚠️ ADVERTENCIA: La imagen ${image} podría no tener soporte oficial para tu arquitectura (${arch}). La instalación continuará, pero podría fallar con 'exec format error'.\n`;
      io.emit(`app:install:log:${appId}`, { stream: "stderr", text: msg });
      log.warn(msg);
    } else {
      io.emit(`app:install:log:${appId}`, { stream: "stdout", text: `✅ Imagen compatible con ${arch}.\n` });
    }
  } catch (err: any) {
    // ignorar fallo si docker manifest no está activo
    io.emit(`app:install:log:${appId}`, { stream: "stdout", text: `Nota: No se pudo verificar la arquitectura de antemano. Procediendo...\n` });
  }
}

export const StoreService = {
  async getCatalog(): Promise<AppInventoryItem[]> {
    try {
      // Devolvemos estrictamente nuestro inventario oficial nativo.
      // Se eliminó la dependencia de CasaOS para mayor fiabilidad y robustez.
      return appInventory;
    } catch (error: any) {
      log.errorWithStack("Error obteniendo catálogo", error);
      return [];
    }
  },

  async getInstalledStatus(): Promise<string[]> {
    try {
      const containers = await getContainers();
      return containers.map((container) => {
        const name = container.name || "";
        return name.toLowerCase().replace(/^\//, "");
      });
    } catch (error: any) {
      log.warn("Error verificando estado de instalación:", error.message);
      return [];
    }
  },

  async validateAppExists(appId: string): Promise<AppInventoryItem | null> {
    if (!appId || typeof appId !== "string") return null;
    const catalog = await this.getCatalog();
    return catalog.find((app) => app.id === appId) || null;
  },

  async generateAndDeployCompose(app: AppInventoryItem): Promise<void> {
    if (!app.image) {
      throw new Error(`La aplicación ${app.name} no tiene imagen Docker configurada`);
    }

    await ensureDockerComposeAvailable();
    await checkArchitectureCompatibility(app.image, app.id);

    // Mapeamos los datos persistentemente en la carpeta que definió el usuario / base path
    const appDataPath = path.join(config.storage.basePath, app.id);
    const manifestDir = path.join(STORE_MANIFEST_DIR, app.id);
    const manifestPath = path.join(manifestDir, "docker-compose.yml");

    await fs.mkdir(appDataPath, { recursive: true });
    await fs.mkdir(manifestDir, { recursive: true });

    // Generamos el docker-compose.yml estándar basado en el catálogo
    const portMappings = app.ports && app.ports.length > 0 
      ? `\n    ports:\n${app.ports.map(p => `      - "${p}"`).join("\n")}`
      : "";

    const envMappings = app.env && Object.keys(app.env).length > 0
      ? `\n    environment:\n${Object.entries(app.env).map(([k, v]) => `      - ${k}=${v}`).join("\n")}`
      : `\n    environment:\n      - PUID=1000\n      - PGID=1000\n      - TZ=Europe/Madrid`;

    const composeContent = `
version: "3.8"
services:
  ${app.id}:
    image: ${app.image}
    container_name: ${app.id}
    restart: unless-stopped
    volumes:
      - ${appDataPath.replace(/\\/g, '/')}:/config${envMappings}${portMappings}
`;

    await fs.writeFile(manifestPath, composeContent.trim(), "utf8");

    io.emit(`app:install:log:${app.id}`, { stream: "stdout", text: `docker-compose.yml generado en ${manifestPath}\nArrancando servicio...\n` });

    // Desplegamos usando docker compose
    await new Promise<void>((resolve, reject) => {
      const child = spawn("docker", ["compose", "-f", manifestPath, "up", "-d"], {
        cwd: manifestDir,
        shell: true,
      });

      let stderr = "";

      child.stdout?.on("data", (data: Buffer) => {
        const line = data.toString();
        io.emit(`app:install:log:${app.id}`, { stream: "stdout", text: line });
      });

      child.stderr?.on("data", (data: Buffer) => {
        const line = data.toString();
        stderr += line;
        io.emit(`app:install:log:${app.id}`, { stream: "stderr", text: line });
      });

      child.on("close", (code: number | null) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr || `docker compose salió con código ${code}`));
      });

      child.on("error", (error: Error) => {
        reject(new Error(`Error ejecutando docker compose: ${error.message}`));
      });
    });
  },

  async deployApp(appId: string): Promise<void> {
    const app = await this.validateAppExists(appId);
    if (!app) {
      throw new Error(`Aplicación ${appId} no encontrada en el catálogo local`);
    }

    log.info(`Iniciando despliegue dinámico de: ${app.name} (${app.id})`);

    try {
      await execAsync("docker ps --no-trunc");
    } catch {
      throw new Error("Docker no está disponible o el servicio NodeJS no tiene permisos de socket (usermod -aG docker).");
    }

    try {
      await this.generateAndDeployCompose(app);

      log.info(`✅ ${app.name} desplegado correctamente mediante compose`);

      await NotificationService.sendAlert(
        `🚀 INSTALACIÓN COMPLETADA\n\nLa aplicación <b>${app.name}</b> se ha desplegado correctamente desde su repositorio oficial y ya está en ejecución.`,
        "INFO",
      );
    } catch (error: any) {
      log.errorWithStack(`Error desplegando ${appId}`, error);

      try {
        await NotificationService.sendAlert(
          `❌ INSTALACIÓN FALLIDA\n\nHubo un error instalando <b>${app.name}</b>:\n\n${error.message}`,
          "WARNING",
        );
      } catch {
        // Ignorar errores de notificación
      }

      throw error;
    }
  },

  async installApp(appId: string): Promise<void> {
    return this.deployApp(appId);
  },
};
