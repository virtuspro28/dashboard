import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const log = logger.child('files-service');

export interface FileItem {
  name: string;
  path: string; // Relative path from storage root
  isDirectory: boolean;
  size: number;
  extension: string;
  mtime: Date;
}

/**
 * Validates that the target path is within the allowed BASE_STORAGE_PATH.
 * Prevents Path Traversal Attacks.
 */
function getAbsolutePath(reqPath: string = ''): string {
  const base = path.normalize(config.storage.basePath);
  const target = path.normalize(path.join(base, reqPath));

  if (!target.startsWith(base)) {
    log.warn(`Blocked traversal attempt: ${target}`);
    throw new Error('Access Denied: Path Traversal Attempt');
  }
  return target;
}

/**
 * List files and directories in a given path.
 */
export async function listFiles(reqPath: string = ''): Promise<FileItem[]> {
  const targetPath = getAbsolutePath(reqPath);

  try {
    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    const items = await fs.readdir(targetPath, { withFileTypes: true });

    const fileItems = await Promise.all(
      items.map(async (item) => {
        const itemRelativePath = path.join(reqPath, item.name).replace(/\\/g, '/');
        const fullItemPath = path.join(targetPath, item.name);

        try {
          const itemStat = await fs.stat(fullItemPath);
          return {
            name: item.name,
            path: itemRelativePath,
            isDirectory: item.isDirectory(),
            size: item.isDirectory() ? 0 : itemStat.size,
            extension: item.isDirectory() ? '' : path.extname(item.name).toLowerCase(),
            mtime: itemStat.mtime,
          };
        } catch (err) {
          return {
            name: item.name,
            path: itemRelativePath,
            isDirectory: item.isDirectory(),
            size: 0,
            extension: item.isDirectory() ? '' : path.extname(item.name).toLowerCase(),
            mtime: new Date(0),
          };
        }
      })
    );

    // Sort: directories first, then alphabetically
    return fileItems.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${reqPath || '/'}`);
    }
    throw error;
  }
}

/**
 * Create a new directory.
 */
export async function createDirectory(reqPath: string, name: string): Promise<void> {
  const targetPath = getAbsolutePath(path.join(reqPath, name));
  await fs.mkdir(targetPath, { recursive: true });
}

/**
 * Delete a file or directory.
 */
export async function deleteItem(reqPath: string): Promise<void> {
  const targetPath = getAbsolutePath(reqPath);
  await fs.rm(targetPath, { recursive: true, force: true });
}

/**
 * Rename or move an item.
 */
export async function renameItem(oldPath: string, newPath: string): Promise<void> {
  const oldAbs = getAbsolutePath(oldPath);
  const newAbs = getAbsolutePath(newPath);
  await fs.rename(oldAbs, newAbs);
}

/**
 * Search files recursively.
 * Note: For very large drives, this should be optimized with an index.
 */
export async function searchFiles(query: string, maxResults: number = 100): Promise<FileItem[]> {
  const base = path.normalize(config.storage.basePath);
  const results: FileItem[] = [];
  const lowercaseQuery = query.toLowerCase();

  async function walk(currentPath: string) {
    if (results.length >= maxResults) return;

    const items = await fs.readdir(currentPath, { withFileTypes: true });

    for (const item of items) {
      if (results.length >= maxResults) break;

      const fullPath = path.join(currentPath, item.name);
      const relativePath = path.relative(base, fullPath).replace(/\\/g, '/');

      if (item.name.toLowerCase().includes(lowercaseQuery)) {
        try {
          const itemStat = await fs.stat(fullPath);
          results.push({
            name: item.name,
            path: relativePath,
            isDirectory: item.isDirectory(),
            size: item.isDirectory() ? 0 : itemStat.size,
            extension: item.isDirectory() ? '' : path.extname(item.name).toLowerCase(),
            mtime: itemStat.mtime,
          });
        } catch (e) {
          // Skip inaccessible items
        }
      }

      if (item.isDirectory()) {
        await walk(fullPath);
      }
    }
  }

  await walk(base);
  return results;
}
