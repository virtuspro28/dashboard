import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Download, Trash2, Search } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Auto-refresh cada 10s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/system/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-slate-800 rounded-2xl border border-white/5">
            <Terminal className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight text-xl uppercase">System Logs</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Monitoreo en tiempo real de journalctl</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold uppercase">Refrescar</span>
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            <span className="text-[10px] font-black tracking-widest text-slate-500 ml-4">HOMEPI-NAS-DAEMON</span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono">journalctl -u homepinas -n 50</div>
        </div>

        {/* Terminal Text Area */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-800"
        >
          {loading && !logs ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 text-slate-800 animate-spin" />
            </div>
          ) : (
            <pre className="text-slate-300 whitespace-pre-wrap">
              {logs || 'No hay registros disponibles en este momento.'}
            </pre>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-blue-600/5 px-6 py-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-[10px] text-blue-400 font-bold uppercase">Estado: Conectado</span>
            <span className="text-[10px] text-slate-600 font-bold">Auto-Sync: Habilitado (10s)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
