import { exec } from "node:child_process";
import type { Request, Response } from "express";

export interface DiskStorageInfo {
  filesystem: string;
  sizeBytes: number;
  usedBytes: number;
  availableBytes: number;
  usePercentage: number;
  mountPoint: string;
}

export async function getDisks(_req: Request, res: Response): Promise<void> {
  try {
    // Envolvemos exec en una Promesa para usar async/await limpiamente
    const stdout = await new Promise<string>((resolve, reject) => {
      exec("df -B1 -x tmpfs -x devtmpfs", (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Fallo ejecutando df: ${stderr || error.message}`));
          return;
        }
        resolve(stdout);
      });
    });

    const lines = stdout.trim().split("\n");
    // Omitimos la primera línea (cabeceras: Filesystem 1B-blocks Used Available Use% Mounted on)
    lines.shift();

    const disks: DiskStorageInfo[] = lines.filter(line => line.trim().length > 0).map((line) => {
      // split(/\s+/) agrupa múltiples espacios en un solo delimitador
      const parts = line.trim().split(/\s+/);
      
      return {
        filesystem: parts[0] ?? "",
        sizeBytes: parseInt(parts[1] ?? "0", 10),
        usedBytes: parseInt(parts[2] ?? "0", 10),
        availableBytes: parseInt(parts[3] ?? "0", 10),
        // Eliminamos el símbolo "%" antes de parsearlo
        usePercentage: parseInt((parts[4] ?? "0").replace("%", ""), 10),
        mountPoint: parts.slice(5).join(" "), // En caso de que el mountpoint tenga espacios
      };
    });

    res.status(200).json({ success: true, data: disks });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido leyendo discos";
    
    // NOTA: Si pruebas este endpoint en Windows nativo (CMD/Powershell sin WSL), fallará.
    // Solo funcionará en sistemas tipo POSIX (Linux, OSX, RPi).
    res.status(500).json({ 
      success: false, 
      error: "Error interno del gestor de almacenamiento",
      details: errorMsg 
    });
  }
}
