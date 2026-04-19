import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Database, RefreshCw, Layers, HardDrive, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoragePool() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disks, setDisks] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, diskRes] = await Promise.all([
        fetch('/api/storage/pool/status'),
        fetch('/api/storage/disks')
      ]);
      const statusData = await statusRes.json();
      const diskData = await diskRes.json();

      if (statusData.success) setStatus(statusData.data);
      if (diskData.success) setDisks(diskData.data);
    } catch (err) {
      console.error("Error fetching pool data:", err);
    } finally {
      setLoading(false);
    }
  };

  const runSync = async () => {
    try {
      await fetch('/api/storage/pool/sync', { method: 'POST' });
      fetchData();
    } catch (err) {
      alert("Error al iniciar sincronización");
    }
  };

  if (loading && !status) return null;

  // Calculamos capacidad combinada (excluyendo el disco de paridad si podemos identificarlo)
  // Por ahora sumamos todos los discos devueltos por el backend
  const totalBytes = disks.reduce((acc, d) => acc + d.sizeBytes, 0);
  const usedBytes = disks.reduce((acc, d) => acc + d.usedBytes, 0);
  const usagePercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

  const isSyncing = status?.status === 'syncing';
  const isProtected = status?.lastSync != null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <Layers className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Storage Pool (MergerFS)</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestión de paridad y almacenamiento combinado</p>
          </div>
        </div>

        <button 
          onClick={runSync}
          disabled={isSyncing}
          className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
            isSyncing 
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' 
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? `Sincronizando ${status?.progress}%` : 'Sincronizar Paridad'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Protection Shield Card */}
        <div className="md:col-span-1 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center">
           <div className={`p-8 rounded-full mb-6 relative ${isProtected ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <AnimatePresence mode="wait">
                {isProtected ? (
                  <motion.div
                    key="protected"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10"
                  >
                    <ShieldCheck className="w-20 h-20 text-emerald-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="unprotected"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10"
                  >
                    <Shield className="w-20 h-20 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
              {isSyncing && (
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
           </div>
           <h2 className={`text-xl font-black uppercase tracking-tighter ${isProtected ? 'text-emerald-400' : 'text-red-400'}`}>
             {isProtected ? 'Datos Protegidos' : 'Vulnerable'}
           </h2>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 px-4">
             {isProtected 
              ? `Último Sync: ${new Date(status?.lastSync).toLocaleString()}` 
              : 'Se requiere una sincronización inicial para habilitar la paridad'}
           </p>
        </div>

        {/* Combined Capacity Card */}
        <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-8">
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <Database className="w-6 h-6 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Capacidad del Pool</h2>
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Espacio Utilizado</p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    {(usedBytes / 1024 / 1024 / 1024 / 1024).toFixed(2)} <span className="text-xl text-slate-500">TB</span>
                  </p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Combinado</p>
                   <p className="text-2xl font-black text-slate-300 tracking-tighter">
                     {(totalBytes / 1024 / 1024 / 1024 / 1024).toFixed(2)} TB
                   </p>
                </div>
              </div>

              <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${usagePercent}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className={`h-full rounded-full ${usagePercent > 85 ? 'bg-red-500' : 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}
                 />
              </div>

              <div className="grid grid-cols-3 gap-6 pt-4">
                 <div className="space-y-1">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Discos Datos</p>
                    <p className="font-bold text-slate-100">{disks.length}</p>
                 </div>
                 <div className="space-y-1 text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Discos Paridad</p>
                    <p className="font-bold text-slate-100">1 (Recomendado)</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Tipo de Pool</p>
                    <p className="font-bold text-blue-400 uppercase text-xs">MergerFS</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Info Warning */}
      {!isProtected && (
        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl flex items-start space-x-4">
           <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
           <div>
              <h4 className="text-sm font-black text-red-400 uppercase tracking-widest mb-1">Riesgo de pérdida de datos</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                 Tu pool de discos no tiene paridad calculada. Si un disco físico falla ahora, perderás los datos de esa unidad. 
                 Ejecuta una sincronización de paridad para proteger tu información.
              </p>
           </div>
        </div>
      )}

      {/* Persistence Banner */}
      <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-3xl flex items-center justify-between">
         <div className="flex items-center space-x-4">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            <div>
               <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest">Persistencia en el arranque</h4>
               <p className="text-xs text-slate-500">¿Quieres que el pool se monte automáticamente al reiniciar la RPi?</p>
            </div>
         </div>
         <button 
           onClick={async () => {
             await fetch('/api/storage/pool/persist-pool', { method: 'POST' });
             alert("Pool persistido en fstab correctamente.");
           }}
           className="px-6 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
         >
           Fijar en /etc/fstab
         </button>
      </div>
    </div>
  );
}
