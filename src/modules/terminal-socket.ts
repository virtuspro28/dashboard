import { Server, Socket } from "socket.io";
import * as pty from "node-pty";
import os from "node:os";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

const log = logger.child("terminal-socket");

export function setupTerminalSocket(io: Server) {
  // Middleware de autenticación para Sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth["token"] || socket.handshake.query["token"];

    if (!token) {
      log.warn("Intento de conexión a Terminal sin token");
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token as string, config.auth.jwtSecret) as any;
      
      // Solo administradores pueden usar la terminal
      if (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER') {
        log.warn(`Usuario ${decoded.username} intentó acceder a terminal sin ser ADMIN/OWNER`);
        return next(new Error("Security error: Admin role required"));
      }

      (socket as any).user = decoded;
      next();
    } catch (err: unknown) {
      const errData = err instanceof Error ? { error: err.message } : { error: String(err) };
      log.error("Fallo de validación JWT en Socket:", errData);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    log.info(`Terminal abierta por usuario: ${user.username}`);

    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
    const args = os.platform() === "win32" ? [] : ["--login"];
    
    // Si estamos en Linux y somos root, intentamos usar un shell normal
    // Evitamos forzar 'pi' ya que puede no existir en todas las distros
    const ptyProcess = pty.spawn(shell, args, {
      name: "xterm-color",
      cols: 80,
      rows: 24,
      cwd: process.env["HOME"] || (os.platform() === "win32" ? process.cwd() : "/root"),
      env: process.env as any,
    });

    // Enviar datos del PTY al cliente (Frontend espera 'output')
    ptyProcess.onData((data) => {
      socket.emit("output", data);
    });

    // Recibir datos del cliente (Frontend envía 'input')
    socket.on("input", (data) => {
      ptyProcess.write(data);
    });


    // Manejar redimensionamiento
    socket.on("resize", (size) => {
      ptyProcess.resize(size.cols, size.rows);
    });

    socket.on("disconnect", () => {
      log.info(`Terminal cerrada para usuario: ${user.username}`);
      ptyProcess.kill();
    });
  });
}
