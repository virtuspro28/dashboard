import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import { Terminal as TerminalIcon, ShieldAlert, RefreshCw, Maximize2 } from 'lucide-react';
import 'xterm/css/xterm.css';

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar Socket.io con el token JWT
    const token = localStorage.getItem('token'); // Asumimos que el token está aquí
    socketRef.current = io('/', {
      auth: { token }
    });

    // Inicializar XTerm
    const term = new XTerm({
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0f172a', // slate-900
        foreground: '#f8fafc',
        cursor: '#3b82f6',
        black: '#1e293b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f8fafc',
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Conectar Sockets
    socketRef.current.on('connect', () => {
      term.write('\r\n\x1b[1;34m[HomePiNAS]\x1b[0m Conectado a la terminal segura...\r\n');
      // Enviar tamaño inicial
      socketRef.current?.emit('resize', { cols: term.cols, rows: term.rows });
    });

    socketRef.current.on('connect_error', (err) => {
      setError(err.message);
      term.write(`\r\n\x1b[1;31m[ERROR]\x1b[0m ${err.message}\r\n`);
    });

    socketRef.current.on('data', (data) => {
      term.write(data);
    });

    term.onData((data) => {
      socketRef.current?.emit('data', data);
    });

    // Manejar redimensionamiento
    const handleResize = () => {
      fitAddon.fit();
      socketRef.current?.emit('resize', { cols: term.cols, rows: term.rows });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socketRef.current?.disconnect();
      term.dispose();
    };
  }, []);

  if (error) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] flex flex-col items-center max-w-md text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Acceso Denegado</h2>
          <p className="text-slate-400 mt-4 leading-relaxed">
            {error === 'Security error: Admin role required' 
              ? 'Esta terminal requiere privilegios de administrador global. Tu cuenta actual no tiene permisos para abrir una shell.'
              : `Error de conexión: ${error}`}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 flex items-center space-x-2 px-6 py-3 bg-red-500 text-white font-bold rounded-2xl"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-slate-800 rounded-2xl border border-white/5">
            <TerminalIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Terminal SSH</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Acceso directo a la shell del sistema</p>
          </div>
        </div>

        <button 
          onClick={() => fitAddonRef.current?.fit()}
          className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase">Ajustar Pantalla</span>
        </button>
      </div>

      <div className="flex-1 bg-black rounded-[2.5rem] border border-white/5 p-6 overflow-hidden shadow-2xl relative">
        <div ref={terminalRef} className="h-full w-full" />
      </div>

      <div className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-2xl flex items-center space-x-3">
         <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
         <p className="text-[11px] text-slate-400 leading-tight">
            <span className="text-blue-400 font-black uppercase mr-2">Aviso de Seguridad:</span> 
            Estás conectado como el usuario que ejecuta el NAS. Evita comandos destructivos como 'rm -rf' en rutas raíz sin precaución.
         </p>
      </div>
    </div>
  );
}
