import React from 'react';
import { HardDrive, Thermometer, Activity, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export interface DiskHealth {
  device: string;
  model: string;
  status: 'PASSED' | 'FAILED' | 'UNKNOWN' | 'WARNING' | 'OK';
  temperature: number | null;
  powerOnHours: number | null;
  serialNumber: string;
  interface?: 'USB' | 'SATA' | 'NVME';
}

interface DiskHealthCardProps {
  disk: DiskHealth;
}

const DiskHealthCard: React.FC<DiskHealthCardProps> = ({ disk }) => {
  const isOptimal = disk.status === 'PASSED' || disk.status === 'OK';
  const isHighTemp = disk.temperature && disk.temperature > 50;
  const isCriticalTemp = disk.temperature && disk.temperature > 60;

  const getHealthColor = (status: string) => {
    if (status === 'PASSED' || status === 'OK') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (status === 'WARNING') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getInterfaceBadge = (type?: string, device?: string) => {
    // Si no viene tipo, intentamos inferir
    const inferredType = type || (device?.includes('sd') ? 'SATA' : 'USB');
    const colorClass = inferredType === 'USB' 
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    
    return { label: inferredType, class: colorClass };
  };

  const iface = getInterfaceBadge(disk.interface, disk.device);

  const getTempColor = () => {
    if (!disk.temperature) return 'text-slate-500';
    if (isCriticalTemp) return 'text-red-500';
    if (isHighTemp) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group shadow-lg"
    >
      {/* Decoración de fondo */}
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full -mr-12 -mt-12 transition-colors duration-500 ${
        isOptimal ? 'bg-emerald-500/10' : 'bg-red-500/10'
      }`}></div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-2xl border transition-colors ${
            isOptimal ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}>
            <HardDrive className={`w-6 h-6 ${isOptimal ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight leading-tight truncate max-w-[150px]">{disk.model}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              {disk.device} • {disk.serialNumber}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${iface.class}`}>
            {iface.label}
          </span>
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tighter ${getHealthColor(disk.status)}`}>
            {isOptimal ? <ShieldCheck className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
            <span>{disk.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Temperatura */}
        <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Thermometer className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Temp</span>
          </div>
          <p className={`text-xl font-black ${getTempColor()}`}>
            {disk.temperature ? `${disk.temperature}°C` : '--'}
          </p>
        </div>

        {/* Tiempo de encendido */}
        <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Power-on</span>
          </div>
          <p className="text-xl font-black text-slate-200">
            {disk.powerOnHours ? `${(disk.powerOnHours / 24 / 365).toFixed(0)}y` : '--'}
          </p>
        </div>

        {/* Diagnóstico */}
        <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest leading-none">SMART</span>
          </div>
          <p className={`text-sm font-black uppercase ${isOptimal ? 'text-blue-400' : 'text-red-400'}`}>
            {disk.status === 'PASSED' ? 'OK' : disk.status}
          </p>
        </div>
      </div>

      {/* Mensaje de alerta si es necesario */}
      {!isOptimal && (
        <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-300 leading-tight">
            Atención: Se han detectado irregularidades SMART. Se recomienda respaldar datos.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default DiskHealthCard;
