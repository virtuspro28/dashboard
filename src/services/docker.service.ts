import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";
import { appInventory, type AppDefaultConfig, type AppInventoryItem } from "../data/appInventory.js";

const execAsync = promisify(exec);
const log = logger.child("docker-service");

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  publishedPorts: DockerPublishedPort[];
  webUi: DockerWebUi | null;
}

export interface DockerWebUi {
  port: number;
  path: string;
}

export interface DockerPublishedPort {
  containerPort: number;
  hostPort: number;
  protocol: string;
}

export interface DockerContainerDetails {
  container: DockerContainer;
  command: string;
  createdAt: string | null;
  mounts: Array<{ source: string; destination: string; mode: string }>;
  ports: string[];
  restartPolicy: string;
}

export interface DockerContainerStats {
  cpu: string;
  memory: string;
  memoryPercent: string;
  networkIO: string;
  blockIO: string;
  pids: string;
}

export interface RemoveContainerOptions {
  deleteData?: boolean;
}

function resolveAppDataPath(details: DockerContainerDetails): string | null {
  const appsRoot = path.join(config.storage.basePath, "apps");

  for (const mount of details.mounts) {
    const sourcePath = mount.source.trim();
    if (!sourcePath) {
      continue;
    }

    const normalizedSource = path.normalize(sourcePath);
    const relativeToAppsRoot = path.relative(appsRoot, normalizedSource);
    const isInsideAppsRoot = relativeToAppsRoot !== ""
      && !relativeToAppsRoot.startsWith("..")
      && !path.isAbsolute(relativeToAppsRoot);

    if (!isInsideAppsRoot) {
      continue;
    }

    const [appDirectory] = relativeToAppsRoot.split(path.sep);
    if (!appDirectory) {
      continue;
    }

    return path.join(appsRoot, appDirectory);
  }

  return null;
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\//, "")
    .replace(/[_\s]+/g, "-");
}

function normalizeImageReference(value: string): string {
  const withoutTag = value.trim().toLowerCase().split("@")[0]?.split(":")[0] ?? "";
  return withoutTag.replace(/^docker\.io\//, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePublishedPorts(value: string): DockerPublishedPort[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .flatMap((entry) => {
      if (!entry) {
        return [];
      }

      if (entry.includes("->")) {
        const mappedMatch = entry.match(/(?:(?:.*:))?(\d+)->(\d+)\/([a-z0-9]+)/i);
        if (!mappedMatch) {
          return [];
        }

        const hostPort = Number(mappedMatch[1]);
        const containerPort = Number(mappedMatch[2]);
        const protocol = mappedMatch[3]?.toLowerCase() ?? "tcp";
        if (!Number.isFinite(hostPort) || !Number.isFinite(containerPort)) {
          return [];
        }

        return [{ hostPort, containerPort, protocol }];
      }

      const exposedMatch = entry.match(/^(\d+)\/([a-z0-9]+)$/i);
      if (!exposedMatch) {
        return [];
      }

      const containerPort = Number(exposedMatch[1]);
      const protocol = exposedMatch[2]?.toLowerCase() ?? "tcp";
      if (!Number.isFinite(containerPort)) {
        return [];
      }

      return [{ hostPort: containerPort, containerPort, protocol }];
    });
}

function getUiPortPriority(label: string | undefined): number {
  const normalizedLabel = label?.trim().toLowerCase() ?? "";
  if (normalizedLabel.includes("admin ui") || normalizedLabel.includes("panel web")) {
    return 4;
  }
  if (normalizedLabel.includes("web ui")) {
    return 3;
  }
  if (normalizedLabel.includes("api / ui")) {
    return 2;
  }
  if (normalizedLabel.includes("setup ui")) {
    return 1;
  }
  return 0;
}

function findMatchingApp(container: Pick<DockerContainer, "name" | "image">): AppInventoryItem | null {
  const normalizedContainerName = normalizeKey(container.name);
  const normalizedImage = normalizeImageReference(container.image);

  return appInventory.find((app) => {
    const appId = normalizeKey(app.id);
    const appName = normalizeKey(app.name);
    const appImage = normalizeImageReference(app.image ?? "");
    return normalizedContainerName === appId
      || normalizedContainerName === appName
      || normalizedImage === appImage;
  }) ?? null;
}

function resolveContainerWebUi(
  container: Pick<DockerContainer, "name" | "image">,
  publishedPortsText: string,
): DockerWebUi | null {
  const publishedPorts = parsePublishedPorts(publishedPortsText).filter((port) => port.protocol === "tcp");
  const matchedApp = findMatchingApp(container);

  if (matchedApp) {
    const preferredPort = [...matchedApp.defaultConfig.ports]
      .sort((left, right) => getUiPortPriority(right.label) - getUiPortPriority(left.label))
      .find((port) => getUiPortPriority(port.label) > 0);

    if (preferredPort) {
      const containerPort = Number(preferredPort.container);
      if (Number.isFinite(containerPort)) {
        const mappedPort = publishedPorts.find((port) => port.containerPort === containerPort);
        if (mappedPort) {
          return {
            port: mappedPort.hostPort,
            path: matchedApp.defaultConfig.webPath ?? "/",
          };
        }

        if (matchedApp.defaultConfig.networkMode === "host") {
          return {
            port: containerPort,
            path: matchedApp.defaultConfig.webPath ?? "/",
          };
        }
      }
    }
  }

  const fallbackPort = publishedPorts[0];
  if (!fallbackPort) {
    return null;
  }

  return {
    port: fallbackPort.hostPort,
    path: "/",
  };
}

function buildDockerError(error: any): Error {
  const message = error?.stderr || error?.message || "Error de Docker desconocido.";
  if (message.includes("permission denied") || message.includes("acceso denegado")) {
    return new Error("Permisos denegados. El usuario actual no pertenece al grupo docker.");
  }
  if (message.includes("not found") || message.includes("no se reconoce") || error?.code === 127) {
    return new Error("El motor de Docker no esta instalado o no existe en el PATH del servidor.");
  }
  return new Error("No se pudo contactar con el demonio de Docker.");
}

function getMockContainers(): DockerContainer[] {
  return [
    { id: "e1234567890f", name: "plex", image: "plexinc/pms-docker:latest", state: "running", status: "Up 4 days", publishedPorts: [{ hostPort: 32400, containerPort: 32400, protocol: "tcp" }], webUi: { port: 32400, path: "/" } },
    { id: "a9876543210b", name: "pihole", image: "pihole/pihole:latest", state: "running", status: "Up 2 weeks", publishedPorts: [{ hostPort: 8081, containerPort: 80, protocol: "tcp" }], webUi: { port: 8081, path: "/admin" } },
    { id: "c5555555555d", name: "home-assistant", image: "ghcr.io/home-assistant/home-assistant:stable", state: "running", status: "Up 2 hours", publishedPorts: [{ hostPort: 8123, containerPort: 8123, protocol: "tcp" }], webUi: { port: 8123, path: "/" } },
    { id: "f1111111111a", name: "nextcloud-db", image: "mariadb:10.5", state: "exited", status: "Exited (0) 5 days ago", publishedPorts: [], webUi: null },
  ];
}

export async function getContainers(): Promise<DockerContainer[]> {
  if (config.platform.isWindows) {
    return getMockContainers();
  }

  try {
    const { stdout } = await execAsync('docker ps -a --format "{{json .}}"');
    if (!stdout.trim()) {
      return [];
    }

    return stdout
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const raw: unknown = JSON.parse(line);
        if (!isRecord(raw)) {
          return null;
        }

        const name = typeof raw["Names"] === "string" ? raw["Names"] : typeof raw["name"] === "string" ? raw["name"] : "";
        const image = typeof raw["Image"] === "string" ? raw["Image"] : typeof raw["image"] === "string" ? raw["image"] : "";
        const ports = typeof raw["Ports"] === "string" ? raw["Ports"] : typeof raw["ports"] === "string" ? raw["ports"] : "";
        return {
          id: typeof raw["ID"] === "string" ? raw["ID"] : typeof raw["id"] === "string" ? raw["id"] : "",
          name,
          image,
          state: String(raw["State"] ?? raw["state"] ?? "exited").toLowerCase(),
          status: String(raw["Status"] ?? raw["status"] ?? ""),
          publishedPorts: parsePublishedPorts(ports),
          webUi: resolveContainerWebUi({ name, image }, ports),
        };
      })
      .filter((container): container is DockerContainer => container !== null && container.id.length > 0);
  } catch (error: any) {
    log.errorWithStack("Error ejecutando CLI de Docker", error);
    throw buildDockerError(error);
  }
}

async function runDockerAction(command: string, errorMessage: string): Promise<void> {
  try {
    await execAsync(command);
  } catch (error: any) {
    log.errorWithStack(errorMessage, error);
    throw new Error(`${errorMessage}. Detalle: ${error.stderr || error.message}`);
  }
}

export async function startContainer(id: string): Promise<void> {
  await runDockerAction(`docker start ${id}`, `Fallo al iniciar el contenedor ${id}`);
}

export async function stopContainer(id: string): Promise<void> {
  await runDockerAction(`docker stop ${id}`, `Fallo al detener el contenedor ${id}`);
}

export async function restartContainer(id: string): Promise<void> {
  await runDockerAction(`docker restart ${id}`, `Fallo al reiniciar el contenedor ${id}`);
}

export async function removeContainer(id: string, options: RemoveContainerOptions = {}): Promise<void> {
  const { deleteData = false } = options;

  if (config.platform.isWindows) {
    return;
  }

  const details = await getContainerDetails(id);

  try {
    if (details.container.state === "running") {
      await execAsync(`docker stop ${id}`);
    }

    await execAsync(`docker rm ${id}`);

    if (deleteData) {
      const dataPath = resolveAppDataPath(details);
      if (!dataPath) {
        throw new Error(`No se encontró una carpeta de datos de app asociada al contenedor ${details.container.name}.`);
      }
      await fs.rm(dataPath, { recursive: true, force: true });
    }
  } catch (error: any) {
    log.errorWithStack(`Error eliminando el contenedor ${id}`, error);
    throw new Error(`No se pudo eliminar el contenedor ${details.container.name}. Detalle: ${error.stderr || error.message}`);
  }
}

export async function getContainerLogs(id: string, tail = 120): Promise<string[]> {
  if (config.platform.isWindows) {
    return [
      `[mock:${id}] Boot sequence completed`,
      `[mock:${id}] Healthcheck OK`,
      `[mock:${id}] Waiting for incoming connections`,
    ];
  }

  try {
    const { stdout, stderr } = await execAsync(`docker logs --tail ${tail} ${id}`);
    return `${stdout}\n${stderr}`
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0)
      .slice(-tail);
  } catch (error: any) {
    log.errorWithStack(`Error obteniendo logs del contenedor ${id}`, error);
    throw new Error(`No se pudieron recuperar los logs del contenedor ${id}.`);
  }
}

export async function getContainerStats(id: string): Promise<DockerContainerStats> {
  if (config.platform.isWindows) {
    return {
      cpu: "2.14%",
      memory: "312MiB / 2GiB",
      memoryPercent: "15.2%",
      networkIO: "32MB / 12MB",
      blockIO: "84MB / 16MB",
      pids: "19",
    };
  }

  try {
    const { stdout } = await execAsync(`docker stats ${id} --no-stream --format "{{json .}}"`);
    const raw = JSON.parse(stdout.trim());
    return {
      cpu: raw.CPUPerc ?? raw.CPU ?? "0%",
      memory: raw.MemUsage ?? raw.Memory ?? "N/A",
      memoryPercent: raw.MemPerc ?? "N/A",
      networkIO: raw.NetIO ?? "N/A",
      blockIO: raw.BlockIO ?? "N/A",
      pids: raw.PIDs ?? "N/A",
    };
  } catch (error: any) {
    log.errorWithStack(`Error obteniendo stats del contenedor ${id}`, error);
    throw new Error(`No se pudieron recuperar las metricas del contenedor ${id}.`);
  }
}

export async function getContainerDetails(id: string): Promise<DockerContainerDetails> {
  const containers = await getContainers();
  const container = containers.find((entry) => entry.id === id);
  if (!container) {
    throw new Error("Contenedor no encontrado.");
  }

  if (config.platform.isWindows) {
    return {
      container,
      command: "docker-entrypoint.sh",
      createdAt: new Date().toISOString(),
      mounts: [
        { source: "C:\\mock\\config", destination: "/config", mode: "rw" },
        { source: "C:\\mock\\data", destination: "/data", mode: "rw" },
      ],
      ports: ["8080->80/tcp", "8443->443/tcp"],
      restartPolicy: "unless-stopped",
    };
  }

  try {
    const { stdout } = await execAsync(`docker inspect ${id}`);
    const parsed = JSON.parse(stdout);
    const raw = parsed[0];
    return {
      container,
      command: Array.isArray(raw.Config?.Cmd) ? raw.Config.Cmd.join(" ") : raw.Path || "",
      createdAt: raw.Created ?? null,
      mounts: (Array.isArray(raw.Mounts) ? raw.Mounts : []).map((mount: unknown) => {
        if (!isRecord(mount)) {
          return {
            source: "",
            destination: "",
            mode: "",
          };
        }

        return {
          source: typeof mount["Source"] === "string" ? mount["Source"] : "",
          destination: typeof mount["Destination"] === "string" ? mount["Destination"] : "",
          mode: typeof mount["Mode"] === "string" ? mount["Mode"] : "",
        };
      }),
      ports: Object.entries(isRecord(raw.NetworkSettings) && isRecord(raw.NetworkSettings["Ports"]) ? raw.NetworkSettings["Ports"] : {}).flatMap(([containerPort, bindings]) => {
        if (!Array.isArray(bindings) || bindings.length === 0) {
          return [containerPort];
        }
        return bindings.map((binding: unknown) => {
          if (!isRecord(binding)) {
            return containerPort;
          }

          const hostPort = typeof binding["HostPort"] === "string" ? binding["HostPort"] : "";
          return hostPort ? `${hostPort}->${containerPort}` : containerPort;
        });
      }),
      restartPolicy: isRecord(raw.HostConfig) && isRecord(raw.HostConfig["RestartPolicy"]) && typeof raw.HostConfig["RestartPolicy"]["Name"] === "string"
        ? raw.HostConfig["RestartPolicy"]["Name"]
        : "no",
    };
  } catch (error: any) {
    log.errorWithStack(`Error inspeccionando el contenedor ${id}`, error);
    throw new Error(`No se pudo inspeccionar el contenedor ${id}.`);
  }
}
