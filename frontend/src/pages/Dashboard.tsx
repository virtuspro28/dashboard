import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  MemoryStick as Memory, 
  Thermometer, 
  Network, 
  HardDrive, 
  AlertTriangle, 
  RefreshCw,
  Zap,
  Shield,
  Wifi,
  Globe,
  X
} from 'lucide-react';
import NetworkHistoryChart from '../components/dashboard/NetworkHistoryChart';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import DiskHealthCard from '../components/DiskHealthCard';
import type { DiskHealth } from '../components/DiskHealthCard';
import SummaryRow from '../components/dashboard/SummaryRow';
import FanControlWidget from '../components/dashboard/FanControlWidget';
import PowerMonitorWidget from '../components/dashboard/PowerMonitorWidget';

interface SystemStats {
  cpu: { model: string; cores: number; usagePercent: number };
  memory: { totalMB: number; usedMB: number; freeMB: number; usagePercent: number };
  disks: any[];
  network: { rxSpeed: number; txSpeed: number; interface: string };
  diskBreakdown: { media: number; apps: number; system: number; other: number };
  temperature: { celsius: number | null };
  uptime: { system: number };
  timestamp: string;
  cpuUsage: number;
}

const formatSpeed = (bytesPerSec: number) => {
  if (bytesPerSec === 0) return '0 bps';
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const i = Math.floor(Math.log(bytesPerSec * 8) / Math.log(1024));
  return `${((bytesPerSec * 8) / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'processes'>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [diskHealth, setDiskHealth] = useState<DiskHealth[]>([]);
  const [netHistory, setNetHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState({
    latency: -1,
    cpuFreq: 0,
    model: 'Cargando...',
    history: []
  });
  const [summary, setSummary] = useState<any>(null);
  const [hardware, setHardware] = useState<any>({
    fan: { rpm: 0, pwm: 0, auto: true },
    power: { voltage: 0, current: 0, power: 0 },
    cpuTemp: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, healthRes, procRes, telRes, sumRes] = await Promise.all([
          fetch('/api/system/stats'),
          fetch('/api/storage/health'),
          activeTab === 'processes' ? fetch('/api/system/processes') : Promise.resolve({ json: () => ({ success: true, data: [] }) }),
          fetch('/api/system/telemetry'),
          fetch('/api/system/summary'),
          fetch('/api/hardware/telemetry')
        ]);
        
        const statsData = await statsRes.json();
        const healthData = await healthRes.json();
        const procData = await (procRes as any).json();
        const telData = await telRes.json();

        if (statsData.success) {
          const newStats = statsData.data;
          setStats(newStats);
          
          setNetHistory(prev => {
            const newHistory = [...prev, {
              time: new Date().toLocaleTimeString().split(' ')[0],
              rx: newStats.network.rxSpeed / 1024, // KB/s
              tx: newStats.network.txSpeed / 1024
            }];
            return newHistory.slice(-20);
          });
        }

        if (healthData.success) {
          setDiskHealth(healthData.data);
        }

        if (procData.success && activeTab === 'processes') {
          setProcesses(procData.data);
        }

        if (telData.success) {
          setTelemetry(telData.data);
          // Sync backend history with local state for the chart
          if (telData.data.history && telData.data.history.length > 0) {
            setNetHistory(telData.data.history.map((h: any) => ({
              timestamp: h.timestamp,
              rx_rate: h.rx_rate,
              tx_rate: h.tx_rate
            })));
          }
        }

        const sumData = await sumRes.json();
        if (sumData.success) {
          setSummary(sumData.data);
        }

        const hwData = await hwRes.json();
        if (hwData.success) {
          setHardware(hwData.data);
        }
      } catch (err) {
        setError('Error conectando con el backend');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleKillProcess = async (pid: number) => {
    if (!confirm(`¿Estás seguro de finalizar el proceso ${pid}?`)) return;
    try {
      await fetch(`/api/system/processes/${pid}`, { method: 'DELETE' });
      setProcesses(prev => prev.filter(p => p.pid !== pid));
    } catch (err) {
      alert("Error al finalizar el proceso");
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="p-6 bg-blue-500/10 rounded-full mb-6"
        >
          <Activity className="w-12 h-12 text-blue-500" />
        </motion.div>
        <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Telemetría...</p>
      </div>
    );
  }

  const pieData = stats ? [
    { name: 'Media', value: stats.diskBreakdown.media },
    { name: 'Apps', value: stats.diskBreakdown.apps },
    { name: 'System', value: stats.diskBreakdown.system },
    { name: 'Other', value: stats.diskBreakdown.other },
  ] : [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center space-x-1 p-1 bg-slate-900/50 backdrop-blur-md rounded-2xl w-fit border border-white/5">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Vista General
        </button>
        <button 
          onClick={() => setActiveTab('processes')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'processes' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Procesos Activos
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <SummaryRow data={summary} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-3xl group hover:border-blue-500/30 transition-all shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hardware Profile</span>
                </div>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-black text-white">{stats?.cpuUsage.toFixed(1)}%</h3>
                  <span className="text-sm font-bold text-blue-400 mb-1">{telemetry.cpuFreq} GHz</span>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-400 truncate">{telemetry.model}</p>
                <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${stats?.cpuUsage}%` }}
                  />
                </div>
              </div>
              <StatCard 
                icon={<Memory className="w-5 h-5 text-emerald-400" />} 
                label="Memoria RAM" 
                value={`${stats?.memory.usagePercent}%`} 
                subValue={`${stats?.memory.usedMB} / ${stats?.memory.totalMB} MB`}
                progress={stats?.memory.usagePercent || 0}
              />
              <StatCard 
                icon={<Thermometer className="w-5 h-5 text-red-400" />} 
                label="Temperatura" 
                value={`${stats?.temperature.celsius || '--'}°C`} 
                subValue="Umbral: 75°C"
                progress={stats?.temperature.celsius ? (stats.temperature.celsius / 90) * 100 : 0}
              />
              <StatCard 
                icon={<Wifi className="w-5 h-5 text-indigo-400" />} 
                label="Latencia" 
                value={`${telemetry.latency}ms`} 
                subValue="Conexión Estable"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <FanControlWidget 
                 rpm={hardware.fan.rpm}
                 pwm={hardware.fan.pwm}
                 auto={hardware.fan.auto}
                 cpuTemp={hardware.cpuTemp}
                 detected={hardware.fan.detected}
               />
               <PowerMonitorWidget 
                 voltage={hardware.power.voltage}
                 current={hardware.power.current}
                 power={hardware.power.power}
                 detected={hardware.power.detected}
               />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                      <Globe className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Ancho de Banda Real</h2>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <NetworkHistoryChart data={netHistory} />
                </div>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center">
                 <div className="w-full flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                      <HardDrive className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Distribución Disco</h2>
                 </div>

                 <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-2xl font-black text-white">{stats?.disks[0]?.usagePercent || 0}%</span>
                       <span className="text-[10px] text-slate-500 font-bold uppercase">Usado</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                    {pieData.map((item, index) => (
                      <div key={item.name} className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                        <span className="text-xs text-slate-400 font-medium">{item.name}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Disks List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center uppercase tracking-widest ml-1">
                 <HardDrive className="w-5 h-5 mr-3 text-blue-500" />
                 Unidades de Almacenamiento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {stats?.disks.map(disk => (
                   <div key={disk.filesystem} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-300">
                     <div className="flex justify-between items-start mb-6">
                       <div>
                         <p className="text-xs font-black text-slate-500 uppercase tracking-tighter">{disk.filesystem}</p>
                         <h4 className="text-lg font-bold text-white mt-1">{disk.mountpoint}</h4>
                       </div>
                       <div className="px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-[10px] font-bold text-blue-400">SANO</div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col"><span className="text-[10px] text-slate-500 font-bold uppercase">Utilizado</span><span className="text-lg font-black text-slate-200">{disk.usedGB} GB</span></div>
                          <div className="text-right"><span className="text-[10px] text-slate-500 font-bold uppercase">Restante</span><span className="text-lg font-black text-blue-400">{disk.freeGB} GB</span></div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${disk.usagePercent}%` }} className={`h-full rounded-full ${disk.usagePercent > 85 ? 'bg-red-500' : 'bg-blue-500'}`} />
                        </div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>

            {/* Disk Health (SMART) */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center uppercase tracking-widest ml-1">
                 <Activity className="w-5 h-5 mr-3 text-emerald-500" />
                 Estado de Salud (SMART)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {diskHealth.map(disk => (
                   <DiskHealthCard key={disk.device} disk={disk} />
                 ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="processes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
               <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Administrador de Procesos</h2>
               </div>
               <span className="text-[10px] text-slate-500 font-bold uppercase">Top 12 por carga de CPU</span>
            </div>
            
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-black/20 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                     <th className="px-8 py-4">PID</th>
                     <th className="px-4 py-4">Usuario</th>
                     <th className="px-4 py-4">CPU %</th>
                     <th className="px-4 py-4">MEM %</th>
                     <th className="px-4 py-4">Comando / Proceso</th>
                     <th className="px-8 py-4 text-right">Acción</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {processes.map(p => (
                    <tr key={p.pid} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="px-8 py-4 text-[11px] font-bold text-blue-400 font-mono">{p.pid}</td>
                       <td className="px-4 py-4 text-[11px] text-slate-400 font-bold">{p.user}</td>
                       <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                             <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, p.cpu * 5)}%` }}></div>
                             </div>
                             <span className="text-[11px] font-black text-white">{p.cpu.toFixed(1)}%</span>
                          </div>
                       </td>
                       <td className="px-4 py-4 text-[11px] text-slate-300 font-bold">{p.mem.toFixed(1)}%</td>
                       <td className="px-4 py-4 text-[11px] text-slate-400 font-mono truncate max-w-xs" title={p.name}>{p.name}</td>
                       <td className="px-8 py-4 text-right">
                          <button 
                            onClick={() => handleKillProcess(p.pid)}
                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                             <X className="w-3.5 h-3.5" />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, progress }: { icon: any, label: string, value: string, subValue: string, progress?: number }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -mr-8 -mt-8"></div>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>

      <div className="flex items-baseline space-x-2">
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        <span className="text-[10px] text-slate-500 font-bold uppercase">{subValue}</span>
      </div>

      {progress !== undefined && (
        <div className="mt-4 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-full rounded-full ${progress > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
          />
        </div>
      )}
    </div>
  );
}
