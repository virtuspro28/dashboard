import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  ExternalLink, 
  HardDrive, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  History,
  Usb,
  FolderOpen,
  Calendar,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackupTask {
  id: string;
  machineName: string;
  sourcePath: string;
  destinationPath: string;
  schedule: string;
  status: string;
  lastBackup: string | null;
  taskType: string;
}

export default function BackupManager() {
  const [tasks, setTasks] = useState<BackupTask[]>([]);
  const [usbs, setUsbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  // Form state
  const [newTask, setNewTask] = useState({
    name: '',
    source: '',
    destination: '',
    schedule: 'DAILY',
    type: 'RSYNC_LOCAL'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        fetch('/api/backup/tasks'),
        fetch('/api/backup/usb')
      ]);
      const tData = await tRes.json();
      const uData = await uRes.json();
      if (tData.success) setTasks(tData.data);
      if (uData.success) setUsbs(uData.data);
    } catch (err) {
      console.error('Error fetching backup data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTask = async (id: string) => {
    setExecuting(id);
    try {
      const res = await fetch(`/api/backup/run/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Backup iniciado en segundo plano');
        fetchData();
      }
    } catch (err) {
      alert('Error al iniciar backup');
    } finally {
      setExecuting(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/backup/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      alert('Error creando tarea');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-xl shadow-blue-900/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight text-white uppercase">Backup Central</h1>
            <p className="text-slate-400">Implementa la regla 3-2-1 con copias locales, externas y remotas.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Tarea Rsync</span>
        </button>
      </div>

      {/* USB Discovery Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl animate-pulse">
               <Usb className="w-6 h-6 text-amber-400" />
            </div>
            <div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Discos Externos</h3>
               <p className="text-[10px] text-slate-500 font-bold">DISPOSITIVOS DETECTADOS EN /MEDIA Y /MNT</p>
            </div>
         </div>
         
         <div className="flex gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {usbs.length === 0 ? (
               <span className="text-xs text-slate-600 font-medium italic">Esperando conexión de disco...</span>
            ) : usbs.map((usb: any) => (
               <div key={usb.path} className="flex-shrink-0 flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-white uppercase">{usb.label}</span>
                     <span className="text-[8px] text-slate-500">{usb.size} • {usb.path}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          [1,2].map(i => (
            <div key={i} className="h-64 bg-slate-900/40 rounded-[2.5rem] border border-white/5 animate-pulse"></div>
          ))
        ) : tasks.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-900/40 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
             <Shield className="w-16 h-16 text-slate-700 mb-4" />
             <h3 className="text-xl font-bold text-slate-300 uppercase">Sin tareas configuradas</h3>
             <p className="text-slate-500 max-w-xs mt-2 text-sm">Crea tu primera tarea rsync para proteger tus datos fuera del pool principal.</p>
          </div>
        ) : tasks.map((task) => (
          <motion.div 
            key={task.id}
            whileHover={{ y: -5 }}
            className={`group bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 transition-all hover:bg-slate-900/60`}
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${task.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : task.status === 'running' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                   {task.status === 'running' ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{task.machineName}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-black text-slate-500 uppercase">{task.taskType}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{task.schedule}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleRunTask(task.id)}
                disabled={executing === task.id || task.status === 'running'}
                className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-90"
              >
                <Play className="w-5 h-5 fill-current" />
              </button>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Origen</span>
                     <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
                        <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">{task.sourcePath || task.storagePath}</span>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Destino</span>
                     <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">{task.destinationPath || 'Cloud Agent'}</span>
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase">
                     <Clock className="w-4 h-4" />
                     <span>Últmo Backup: {task.lastBackup ? new Date(task.lastBackup).toLocaleString() : 'Nunca'}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${task.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                     {task.status}
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Nueva Tarea */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 w-full max-w-xl shadow-2xl"
            >
              <h2 className="text-3xl font-black text-white uppercase mb-8">Nueva Tarea Rsync</h2>
              <form onSubmit={handleCreateTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Nombre de Tarea</label>
                  <input 
                    required
                    value={newTask.name}
                    onChange={e => setNewTask({...newTask, name: e.target.value})}
                    placeholder="Ej: Backup Fotos a USB"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Ruta Origen</label>
                     <input 
                       required
                       value={newTask.source}
                       onChange={e => setNewTask({...newTask, source: e.target.value})}
                       placeholder="/mnt/storage"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Ruta Destino (USB)</label>
                     <input 
                       required
                       value={newTask.destination}
                       onChange={e => setNewTask({...newTask, destination: e.target.value})}
                       placeholder="/media/disk"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Frecuencia</label>
                     <select 
                       value={newTask.schedule}
                       onChange={e => setNewTask({...newTask, schedule: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                     >
                        <option value="MANUAL">MANUAL</option>
                        <option value="DAILY">DIARIO</option>
                        <option value="WEEKLY">SEMANAL</option>
                        <option value="MONTHLY">MENSUAL</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tipo</label>
                     <select 
                       value={newTask.type}
                       onChange={e => setNewTask({...newTask, type: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                     >
                        <option value="RSYNC_LOCAL">LOCAL</option>
                        <option value="RSYNC_USB">DISCO USB</option>
                     </select>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     type="button" 
                     onClick={() => setShowModal(false)}
                     className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all uppercase"
                   >
                     Crear Tarea
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
