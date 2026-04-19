import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Unlock, Trash2, Globe, AlertTriangle, Info, RefreshCw, X, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Security() {
  const [rules, setRules] = useState<any[]>([]);
  const [banned, setBanned] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGeoModal, setShowGeoModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, bannedRes, configRes] = await Promise.all([
        fetch('/api/security/firewall/rules'),
        fetch('/api/security/banned'),
        fetch('/api/security/config')
      ]);
      
      const rulesData = await rulesRes.json();
      const bannedData = await bannedRes.json();
      const configData = await configRes.json();

      if (rulesData.success) setRules(rulesData.data);
      if (bannedData.success) setBanned(bannedData.data);
      if (configData.success) setConfig(configData.data);
    } catch (err) {
      console.error("Error fetching security data:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (index: number) => {
    if (!confirm("¿Cerrar este puerto? Esto podría cortar servicios activos.")) return;
    await fetch(`/api/security/firewall/rules/${index}`, { method: 'DELETE' });
    fetchData();
  };

  const unbanIP = async (ip: string) => {
    await fetch('/api/security/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    fetchData();
  };

  const blockCountry = async () => {
    await fetch('/api/security/block-country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: selectedCountry })
    });
    alert(`Bloqueo para ${selectedCountry} iniciado en segundo plano.`);
    setShowGeoModal(false);
  };

  if (loading && !config) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Seguridad Perimetral</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Protección Firewall y Prevención de Intrusos</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-emerald-500/5 px-4 py-2 rounded-2xl border border-emerald-500/20">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Estado: Protección Alta</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Firewall Status & Geo-Block */}
        <div className="xl:col-span-1 space-y-8">
           <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center space-x-3">
                 <Lock className="w-5 h-5 text-blue-400" />
                 <h2 className="text-sm font-black uppercase tracking-widest text-white">Firewall del Sistema</h2>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <span className="text-xs font-bold text-slate-300">Estado UFW</span>
                 <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase">Activo</span>
              </div>

              <div className="pt-4 border-t border-white/5">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Bloqueo Geográfico</p>
                 <button 
                   onClick={() => setShowGeoModal(true)}
                   className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2"
                 >
                   <Globe className="w-4 h-4" />
                   <span>Bloquear País</span>
                 </button>
              </div>
           </div>

           <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-[2rem] flex items-start space-x-4">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                El Firewall (UFW) bloquea por defecto todo el tráfico entrante excepto los puertos permitidos explícitamente.
              </p>
           </div>
        </div>

        {/* Banned IPs Table */}
        <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
           <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-3">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
                 <h2 className="text-sm font-black uppercase tracking-widest text-white">Intrusos Bloqueados (Fail2Ban)</h2>
              </div>
              <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 transition-all">
                 <RefreshCw className="w-4 h-4" />
              </button>
           </div>
           
           <div className="max-h-96 overflow-y-auto">
             <table className="w-full text-left">
                <thead className="bg-black/20 text-[9px] font-black uppercase tracking-widest text-slate-500 sticky top-0 z-10">
                   <tr>
                      <th className="px-8 py-4">Dirección IP</th>
                      <th className="px-4 py-4">Motivo</th>
                      <th className="px-4 py-4">Fecha</th>
                      <th className="px-8 py-4 text-right">Acción</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {banned.length === 0 ? (
                     <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-[11px] text-slate-600 uppercase font-black tracking-widest">
                           Cero intrusiones detectadas recientemente
                        </td>
                     </tr>
                   ) : banned.map(item => (
                     <tr key={item.ip} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="font-mono text-[11px] font-bold text-red-400">{item.ip}</span>
                           </div>
                        </td>
                        <td className="px-4 py-5 text-[11px] text-slate-400 font-bold">{item.reason}</td>
                        <td className="px-4 py-5 text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-right">
                           <button 
                             onClick={() => unbanIP(item.ip)}
                             className="px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white text-[10px] font-black uppercase rounded-lg transition-all opacity-0 group-hover:opacity-100"
                           >
                             Desbloquear
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>

      {/* Firewall Rules Table */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
               <Fingerprint className="w-5 h-5 text-blue-500" />
               <h2 className="text-sm font-black uppercase tracking-widest text-white">Reglas del Firewall (UFW)</h2>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {rules.map(rule => (
              <div key={rule.index} className="bg-slate-900/60 p-6 flex flex-col justify-between group">
                 <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase">#[{rule.index}]</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${rule.action === 'ALLOW' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {rule.action}
                    </span>
                 </div>
                 <h4 className="text-xl font-black text-white font-mono tracking-tighter">{rule.to}</h4>
                 <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Desde: {rule.from}</p>
                 <div className="mt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteRule(rule.index)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all">
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* GEO BLOCK MODAL */}
      <AnimatePresence>
        {showGeoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative">
               <button onClick={() => setShowGeoModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
               <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Bloqueo por País</h2>
               <p className="text-[11px] text-slate-500 leading-relaxed mb-6">Bloquear un país añade miles de reglas al firewall para denegar todo el tráfico de sus rangos de IP conocidos.</p>
               
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código de País (ISO 3166-1)</label>
                     <input 
                       type="text" 
                       placeholder="CN (China), RU (Rusia), etc."
                       maxLength={2}
                       value={selectedCountry}
                       onChange={e => setSelectedCountry(e.target.value.toUpperCase())}
                       className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white uppercase focus:border-red-500/50"
                     />
                  </div>
                  <button 
                    onClick={blockCountry}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-900/20"
                  >
                    Confirmar Bloqueo Geográfico
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
