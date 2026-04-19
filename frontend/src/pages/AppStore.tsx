import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Download, 
  Play, Shield, Tv, Share2, Home, 
  ExternalLink, Loader2, CheckCircle2,
  Cpu, HardDrive, Info, Search as SearchIcon, 
  Film, Terminal, X, Trash2
} from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io();

interface AppTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  category: string;
  ports: string[];
  isInstalled?: boolean;
}

const iconMap: Record<string, any> = {
  Play, Shield, Download, Tv, Share2, Home, Search: SearchIcon, Film, Terminal
};

export default function AppStore() {
  const [apps, setApps] = useState<AppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [logs, setLogs] = useState<{stream: string, text: string}[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/store/apps');
      const data = await res.json();
      if (data.success) {
        setApps(data.data);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (app: AppTemplate) => {
    setInstallingId(app.id);
    setLogs([{ stream: 'stdout', text: `Iniciando instalación de ${app.name}...\n` }]);
    setShowLogs(true);

    const logListener = (data: any) => {
      setLogs(prev => [...prev, data]);
    };

    socket.on(`app:install:log:${app.id}`, logListener);

    try {
      const res = await fetch(`/api/store/install/${app.id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLogs(prev => [...prev, { stream: 'stdout', text: '\n✅ INSTALACIÓN COMPLETADA CON ÉXITO.\n' }]);
        setTimeout(() => {
          fetchApps();
          setInstallingId(null);
          // Mantenemos los logs abiertos un poco más para que el usuario los vea
        }, 3000);
      } else {
        setLogs(prev => [...prev, { stream: 'stderr', text: `\n❌ ERROR: ${data.error}\n` }]);
        setInstallingId(null);
      }
    } catch (err) {
      setLogs(prev => [...prev, { stream: 'stderr', text: '\n❌ ERROR DE CONEXIÓN CON EL SERVIDOR\n' }]);
      setInstallingId(null);
    } finally {
      // socket.off(`app:install:log:${app.id}`, logListener); // Lo quitamos cuando se cierre el modal
    }
  };

  const handleOpenApp = (app: AppTemplate) => {
    if (!app.ports || app.ports.length === 0) return;
    
    // Extraer el puerto externo del formato "EXT:INT"
    const portMapping = app.ports[0].split(':')[0];
    const host = window.location.hostname;
    window.open(`http://${host}:${portMapping}`, '_blank');
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) || 
                          app.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || app.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categories = ['All', 'Media', 'Network', 'Download', 'Tools'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Avanzado */}
      <div className="relative p-8 rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em]">Marketplace</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">App Store <span className="text-slate-500 font-light">Hub</span></h1>
            <p className="mt-3 text-slate-400 text-lg leading-relaxed">
              Despliega micro-servicios optimizados con un solo clic. Gestión inteligente de persistencia y puertos automáticos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 p-1.5 bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl w-fit">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  filter === cat 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-105' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buscar con Estilo */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-500" />
        </div>
        <input
          type="text"
          placeholder="Escribe para buscar aplicaciones..."
          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 focus:border-blue-500/50 rounded-full py-5 pl-16 pr-8 text-white text-lg transition-all shadow-xl focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-80 bg-white/5 rounded-[2rem] animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApps.map((app) => {
            const Icon = iconMap[app.icon] || Info;
            const isInstalled = app.isInstalled;
            const isInstalling = installingId === app.id;

            return (
              <div 
                key={app.id} 
                className="group relative bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/20 rounded-[2rem] p-8 transition-all duration-500 hover:bg-white/[0.06] hover:-translate-y-2 overflow-hidden shadow-2xl"
              >
                {/* Fondo Decorativo */}
                <div className={`absolute -bottom-12 -right-12 w-32 h-32 blur-[60px] rounded-full transition-colors duration-700 ${isInstalled ? 'bg-emerald-500/10' : 'bg-blue-600/10'}`}></div>

                <div className="flex items-center justify-between mb-8">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br transition-all duration-500 shadow-lg ${
                    isInstalled ? 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20' : 'from-slate-800 to-slate-900 border-white/5'
                  } border`}>
                    <Icon className={`w-8 h-8 ${isInstalled ? 'text-emerald-400' : 'text-slate-400'} group-hover:scale-110 transition-transform`} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-600 block mb-1">Categoría</span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400 border border-white/5">
                      {app.category}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-blue-400 transition-colors uppercase">{app.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-10 h-10 line-clamp-2">
                  {app.description}
                </p>

                <div className="flex flex-col gap-3">
                  {isInstalling ? (
                    <button disabled className="w-full flex items-center justify-center py-4 bg-white/5 text-blue-400 font-bold rounded-2xl border border-white/5">
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      Instalando...
                    </button>
                  ) : isInstalled ? (
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center justify-center py-4 bg-emerald-500/10 text-emerald-400 font-bold rounded-2xl border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5 mr-3" />
                        Ejecutando
                      </div>
                      <button 
                        onClick={() => handleOpenApp(app)}
                        className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-colors"
                        title="Abrir Web UI"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInstall(app)}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center justify-center group/btn"
                    >
                      <Download className="w-5 h-5 mr-3 group-hover/btn:translate-y-1 transition-transform" />
                      INSTALAR APP
                    </button>
                  )}
                </div>

                {/* Info Técnica a pie de card */}
                <div className="mt-6 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold">
                     <Cpu className="w-3 h-3" />
                     <span>MULTI-ARCH</span>
                   </div>
                   <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold">
                     <HardDrive className="w-3 h-3" />
                     <span>AUTO-DATA</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Terminal de Instalación (Overlay) */}
      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[70vh]">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-white uppercase text-xs tracking-widest">Logs de Instalación</h3>
              </div>
              <button 
                onClick={() => {
                  setShowLogs(false);
                  setLogs([]);
                  if (installingId) socket.off(`app:install:log:${installingId}`);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed bg-black/40 whitespace-pre-wrap">
              {logs.map((log, i) => (
                <div key={i} className={log.stream === 'stderr' ? 'text-red-400' : 'text-emerald-400'}>
                  <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log.text}
                </div>
              ))}
              {!installingId && logs.length > 0 && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 font-bold text-center">
                  Instalación finalizada. Ya puedes cerrar esta ventana.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

