import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const log = logger.child('fs-service');

export interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  extension: string;
  mtime: Date;
}

/**
 * Valida de forma estricta que la ruta objetivo pertenezca al árbol de archivos permitido
 * por BASE_STORAGE_PATH. Previene Path Traversal Attacks (e.g. ../../../etc/passwd).
 */
function isSafePath(targetPath: string): boolean {
  const base = path.normalize(config.storage.basePath);
  const target = path.normalize(targetPath);
  
  // En Windows comprobamos el disco y path. En Linux, comprobamos que inicie exactamente por el base
  return target.startsWith(base);
}

/**
 * Devuelve un array con el contenido de un directorio si este es seguro y existe.
 * @param reqPath Ruta relativa o absoluta solicitada
 */
export async function browsePath(reqPath?: string): Promise<FileItem[]> {
  // Construye la ruta absoluta
  const targetPath = reqPath 
    ? path.normalize(path.join(config.storage.basePath, reqPath))
    : path.normalize(config.storage.basePath);

  if (!isSafePath(targetPath)) {
    log.warn(`Bloqueado intento de acceso fuera de root (Path Traversal): ${targetPath}`);
    throw new Error('Access Denied: Path Traversal Attempt');
  }

  try {
    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    const items = await fs.readdir(targetPath, { withFileTypes: true });
    
    // Obtenemos los metadatos de tamaño y fecha (requiere stat por cada archivo)
    // Para grandes directorios esto puede ser pesado. Usamos map => Promise.all
    const fileItems = await Promise.all(items.map(async (item) => {
      const fullItemPath = path.join(targetPath, item.name);
      
      try {
        const itemStat = await fs.stat(fullItemPath);
        return {
          name: item.name,
          isDirectory: item.isDirectory(),
          size: item.isDirectory() ? 0 : itemStat.size,
          extension: item.isDirectory() ? '' : path.extname(item.name).toLowerCase(),
          mtime: itemStat.mtime
        };
      } catch (err) {
        // En Linux, ficheros extraños (ej. pipes o symlinks rotos) pueden fallar en el stat
        return {
          name: item.name,
          isDirectory: item.isDirectory(),
          size: 0,
          extension: item.isDirectory() ? '' : path.extname(item.name).toLowerCase(),
          mtime: new Date(0) // Safe fallback
        };
      }
    }));

    // Ordenamos carpetas primero, y luego alfabéticamente
    fileItems.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });

    return fileItems;
  } catch (error: any) {
    // Si no existe, tiramos throw limpio
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${reqPath || '/'}`);
    }
    throw error;
  }
}
