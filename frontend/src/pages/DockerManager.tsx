import { useState, useEffect } from 'react';
import { Terminal, AlertCircle, Play, Square, Loader2, Box } from 'lucide-react';

interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string; // 'running', 'exited', etc.
  status: string; // 'Up 4 hours', 'Exited (0) 2 days ago'
}

export default function DockerManager() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchContainers = async () => {
    try {
      const res = await fetch('/api/docker/containers', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Server Network Error');
      setContainers(json.data);
      if (isLoading) setIsLoading(false);
    } catch (err: unknown) {
      if (isLoading) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchContainers();
    // Auto-refresh ligero de la CLI cada 8s por salud visual
    const interval = window.setInterval(fetchContainers, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'start' | 'stop') => {
    setProcessingId(id);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/docker/containers/${id}/${action}`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Fallo al ${action}`);
      
      // Forzar resincronización visual
      await fetchContainers();
    } catch (err: unknown) {
      setErrorMsg(`[${id.substring(0, 8)}] ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <Terminal className="w-8 h-8 mr-3 text-blue-500" />
            Control de Aplicaciones
          </h1>
          <p className="text-slate-400 mt-2">Gestión nativa de contenedores Docker del NAS.</p>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* SKELETON LOADING MODE */}
        {isLoading && !errorMsg ? (
          Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 h-48 animate-pulse flex flex-col justify-between">
                <div className="flex space-x-4 items-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-2/3" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-x-4 flex">
                  <div className="flex-1 h-10 bg-slate-800 rounded-xl" />
                </div>
             </div>
          ))
        ) : (
          containers.length === 0 && !errorMsg ? (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 p-8 border border-slate-800 rounded-2xl bg-slate-900/50 text-center">
              <p className="text-slate-400 font-mono">No se detectó ningún contenedor alojado en Docker.</p>
            </div>
          ) : (
            containers.map(container => {
              const isRunning = container.state === 'running';
              const isBusy = processingId === container.id;

              return (
                <div key={container.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:bg-slate-900/70 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                          <Box className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-100 truncate w-32 md:w-44" title={container.name}>
                            {container.name}
                          </h3>
                          <p className="text-xs font-mono text-slate-400 truncate w-32 md:w-44" title={container.image}>
                            {container.image}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800">
                        <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden sm:inline">
                          {container.state}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-6 bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800/80">
                      <p className="text-[11px] font-medium text-slate-400 flex flex-col">
                        <span className="uppercase tracking-wide text-slate-500 mb-1">Status Interno</span>
                        <span className="text-slate-300 font-mono truncate">{container.status || 'Desconocido'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    {isRunning ? (
                      <button
                        onClick={() => handleAction(container.id, 'stop')}
                        disabled={isBusy}
                        className="flex-1 flex items-center justify-center py-2.5 bg-slate-800/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/20 rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Square className="w-4 h-4 text-red-500 mr-2" /> Stop</>}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(container.id, 'start')}
                        disabled={isBusy}
                        className="flex-1 flex items-center justify-center py-2.5 bg-blue-600/10 hover:bg-emerald-500/10 text-blue-400 hover:text-emerald-400 border border-blue-500/20 rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-4 h-4 text-emerald-500 mr-2" /> Iniciar</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
