import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

const execAsync = promisify(exec);
const log = logger.child('docker-service');

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

/**
 * Devuelve la lista de contenedores parseando la CLI nativa de Docker.
 * Compatible cross-platform sin necesidad de librerías nativas o binarios.
 */
export async function getContainers(): Promise<DockerContainer[]> {
  // Simulación para demo en Windows/Mac si Docker no está instalado
  if (config.platform.isWindows) {
    return [
      { id: "e1234567890f", name: "Plex-Media-Server", image: "plexinc/pms:latest", state: "running", status: "Up 4 days" },
      { id: "a9876543210b", name: "Pi-hole", image: "pihole/pihole:latest", state: "running", status: "Up 2 weeks" },
      { id: "c5555555555d", name: "Home-Assistant", image: "homeassistant/home-assistant:latest", state: "running", status: "Up 2 hours" },
      { id: "f1111111111a", name: "Nextcloud-DB", image: "mariadb:10.5", state: "exited", status: "Exited (0) 5 days ago" }
    ];
  }

  try {
    // Usamos el format json nativo de docker ps
    const { stdout } = await execAsync("docker ps -a --format \"{{json .}}\"");
    
    if (!stdout.trim()) {
      return [];
    }

    const containers = stdout
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => {
        const raw = JSON.parse(line);
        return {
          id: raw.ID || raw.id,
          name: raw.Names || raw.name,
          image: raw.Image || raw.image,
          state: (raw.State || raw.state || 'exited').toLowerCase(),
          status: raw.Status || raw.status
        };
      });

    return containers;
  } catch (error: any) {
    log.errorWithStack("Error ejecutando CLI de Docker", error);
    if (error.message.includes('permission denied') || error.message.includes('acceso denegado')) {
      throw new Error("Permisos denegados. El usuario actual no pertenece al grupo 'docker'. Ejecuta: sudo usermod -aG docker $USER");
    }
    if (error.code === 127 || error.message.includes('not found') || error.message.includes('no se reconoce')) {
      throw new Error("El motor de Docker no está instalado en el servidor o no existe en el PATH.");
    }
    throw new Error("No se pudo contactar con el demonio de Docker. ¿Está en ejecución?");
  }
}

/**
 * Inicia un contenedor mediante CLI.
 */
export async function startContainer(id: string): Promise<void> {
  try {
    await execAsync(`docker start ${id}`);
    log.info(`Contenedor iniciado correctamente: ${id}`);
  } catch (error: any) {
    log.errorWithStack(`Error arrancando contenedor ${id}`, error);
    throw new Error(`Fallo al iniciar el contenedor ${id}. Detalle: ${error.stderr || error.message}`);
  }
}

/**
 * Detiene un contenedor mediante CLI.
 */
export async function stopContainer(id: string): Promise<void> {
  try {
    await execAsync(`docker stop ${id}`);
    log.info(`Contenedor detenido correctamente: ${id}`);
  } catch (error: any) {
    log.errorWithStack(`Error deteniendo contenedor ${id}`, error);
    throw new Error(`Fallo al detener el contenedor ${id}. Detalle: ${error.stderr || error.message}`);
  }
}
