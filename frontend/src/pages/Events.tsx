import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  HardDrive,
  Cpu,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemEvent {
  id: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'SECURITY' | 'STORAGE' | 'POWER' | 'SYSTEM' | 'DOCKER' | 'BACKUP';
  timestamp: string;
  isRead: boolean;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    level: '', 
    category: '', 
    search: '' 
  });

  useEffect(() => {
    fetchEvents();
  }, [filters.level, filters.category]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters as any).toString();
      const res = await fetch(`/api/system/events?${query}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm("¿Estás seguro de que deseas vaciar todo el historial de eventos?")) return;
    try {
      await fetch('/api/system/events', { method: 'DELETE' });
      fetchEvents();
    } catch (err) {
      alert("Error al limpiar logs");
    }
  };

  const exportCSV = () => {
    const headers = "ID,Fecha,Nivel,Categoría,Mensaje\n";
    const rows = events.map(e => 
      `${e.id},${new Date(e.timestamp).toLocaleString()},${e.level},${e.category},"${e.message.replace(/"/g, '""')}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HomePiNAS_Events_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'WARNING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'SECURITY': return <Shield className="w-3 h-3" />;
      case 'POWER': return <Zap className="w-3 h-3" />;
      case 'STORAGE': return <HardDrive className="w-3 h-3" />;
      case 'DOCKER': return <Layers className="w-3 h-3" />;
      default: return <Cpu className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <History className="w-8 h-8 mr-3 text-blue-500" />
            Visor de Eventos
          </h1>
          <p className="mt-2 text-slate-400">Monitoriza toda la actividad crítica de tu HomePiNAS en un solo lugar.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all text-sm font-bold"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button 
            onClick={clearLogs}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all text-sm font-bold"
          >
            <Trash2 className="w-4 h-4" /> Vaciar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar en mensajes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
            onKeyDown={e => e.key === 'Enter' && fetchEvents()}
          />
        </div>
        <select 
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none cursor-pointer"
          value={filters.level}
          onChange={e => setFilters({...filters, level: e.target.value})}
        >
          <option value="">Todos los Niveles</option>
          <option value="INFO">Información</option>
          <option value="WARNING">Advertencia</option>
          <option value="CRITICAL">Crítico</option>
        </select>
        <select 
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none cursor-pointer"
          value={filters.category}
          onChange={e => setFilters({...filters, category: e.target.value})}
        >
          <option value="">Todas las Categorías</option>
          <option value="SYSTEM">Sistema</option>
          <option value="SECURITY">Seguridad</option>
          <option value="STORAGE">Almacenamiento</option>
          <option value="POWER">Energía</option>
          <option value="DOCKER">Docker</option>
        </select>
        <button 
          onClick={fetchEvents}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 text-sm font-bold transition-all"
        >
          <Filter className="w-4 h-4" /> Aplicar Filtros
        </button>
      </div>

      {/* Tabla de Eventos */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nivel</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha y Hora</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Categoría</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Mensaje de Evento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  <p className="text-slate-500 text-sm">Cargando eventos del sistema...</p>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center text-slate-600 italic text-sm">No se encontraron eventos con estos criterios</td>
              </tr>
            ) : (
              events.map(event => (
                <tr key={event.id} className={`hover:bg-white/5 transition-colors group ${!event.isRead ? 'bg-blue-500/5' : ''}`}>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase ${getLevelColor(event.level)}`}>
                      {event.level === 'CRITICAL' && <AlertCircle className="w-3 h-3" />}
                      {event.level === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                      {event.level}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-200 font-medium">{new Date(event.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-500 tabular-nums">{new Date(event.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800/50 px-3 py-1 rounded-lg w-fit border border-slate-700/50">
                      {getCategoryIcon(event.category)}
                      {event.category}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-slate-300 leading-relaxed max-w-xl">{event.message}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Events;
