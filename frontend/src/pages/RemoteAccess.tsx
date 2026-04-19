import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Globe, Key, Smartphone, Download, Plus, Trash2, ExternalLink, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RemoteAccess() {
  const [activeTab, setActiveTab] = useState<'vpn' | 'proxy'>('vpn');
  const [vpnClients, setVpnClients] = useState<any[]>([]);
  const [proxyDomains, setProxyDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showVpnModal, setShowVpnModal] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [newVpnName, setNewVpnName] = useState('');
  const [newProxy, setNewProxy] = useState({ domain: '', targetPort: '' });
  
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vpn') {
        const res = await fetch('/api/vpn/clients');
        const data = await res.json();
        if (data.success) setVpnClients(data.data);
      } else {
        const res = await fetch('/api/proxy/domains');
        const data = await res.json();
        if (data.success) setProxyDomains(data.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const addVpnClient = async () => {
    try {
      const res = await fetch('/api/vpn/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVpnName })
      });
      if (res.ok) {
        setNewVpnName('');
        setShowVpnModal(false);
        fetchData();
      }
    } catch (err) {
      alert("Error creando cliente VPN");
    }
  };

  const addProxyDomain = async () => {
    try {
      const res = await fetch('/api/proxy/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProxy, targetPort: parseInt(newProxy.targetPort) })
      });
      if (res.ok) {
        setNewProxy({ domain: '', targetPort: '' });
        setShowProxyModal(false);
        fetchData();
      }
    } catch (err) {
      alert("Error creando proxy");
    }
  };

  const issueSSL = async (id: string) => {
    try {
      const res = await fetch(`/api/proxy/domains/${id}/ssl`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert("SSL emitido correctamente");
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Error solicitando SSL");
    }
  };

  const showQR = async (id: string) => {
    const res = await fetch(`/api/vpn/clients/${id}/qr`);
    const data = await res.json();
    if (data.success) setSelectedQR(data.data);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Acceso Remoto Seguro</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">VPN WireGuard y Proxy Inverso Nginx</p>
          </div>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
           <button 
             onClick={() => setActiveTab('vpn')}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vpn' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             VPN WireGuard
           </button>
           <button 
             onClick={() => setActiveTab('proxy')}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'proxy' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Proxy Inverso
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'vpn' ? (
          <motion.div 
            key="vpn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[2.5rem] flex flex-col justify-center items-center text-center">
                 <Shield className="w-12 h-12 text-indigo-400 mb-4" />
                 <h3 className="text-white font-bold">VPN Activa</h3>
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Protocolo WireGuard</p>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center items-center text-center">
                 <h3 className="text-3xl font-black text-white">{vpnClients.length}</h3>
                 <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Dispositivos Conectados</p>
              </div>
              <button 
                onClick={() => setShowVpnModal(true)}
                className="bg-white/[0.02] border-2 border-dashed border-white/10 p-6 rounded-[2.5rem] flex flex-col justify-center items-center text-center hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all group"
              >
                 <Plus className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest group-hover:text-slate-300 transition-colors">Añadir Dispositivo</span>
              </button>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <table className="w-full text-left">
                  <thead className="bg-black/20 text-[9px] font-black uppercase tracking-widest text-slate-500">
                     <tr>
                        <th className="px-8 py-4">Dispositivo</th>
                        <th className="px-4 py-4">IP Interna</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {vpnClients.map(client => (
                       <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                   <Smartphone className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="font-bold text-white text-sm">{client.name}</span>
                             </div>
                          </td>
                          <td className="px-4 py-5 text-xs text-slate-400 font-mono">{client.address}</td>
                          <td className="px-4 py-5">
                             <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full">EN LINEA</span>
                          </td>
                          <td className="px-8 py-5 text-right space-x-2">
                             <button onClick={() => showQR(client.id)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400" title="Ver QR">
                                <Key className="w-4 h-4" />
                             </button>
                             <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="proxy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
             <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Servicios Mapeados</h2>
                <button 
                  onClick={() => setShowProxyModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  Nuevo Proxy
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {proxyDomains.map(proxy => (
                  <div key={proxy.id} className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 hover:bg-white/[0.04] transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-4">
                           <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                              <Globe className="w-6 h-6 text-slate-400" />
                           </div>
                           <div>
                              <h4 className="text-white font-bold tracking-tight">{proxy.domain}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">Mapeado al puerto {proxy.targetPort}</p>
                           </div>
                        </div>
                        <div className={`p-2 rounded-full ${proxy.sslEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                           {proxy.sslEnabled ? <Lock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                     </div>

                     <div className="flex items-center justify-between mt-8">
                        <div className="flex items-center space-x-2">
                           {!proxy.sslEnabled && (
                             <button 
                               onClick={() => issueSSL(proxy.id)}
                               className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase rounded-lg transition-all"
                             >
                               Activar SSL (Certbot)
                             </button>
                           )}
                           <a 
                             href={`http://${proxy.domain}`} 
                             target="_blank" 
                             className="p-2 hover:bg-white/10 rounded-lg text-slate-500"
                           >
                              <ExternalLink className="w-4 h-4" />
                           </a>
                        </div>
                        <button className="text-[9px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest">Eliminar</button>
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL VPN */}
      {showVpnModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative">
              <button onClick={() => setShowVpnModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-6">Nuevo Dispositivo VPN</h2>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre (ej: Mi Celular)</label>
                 <input 
                   type="text" 
                   value={newVpnName}
                   onChange={e => setNewVpnName(e.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                 />
                 <button 
                   onClick={addVpnClient}
                   className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20"
                 >
                   Generar Acceso
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* MODAL PROXY */}
      {showProxyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative">
              <button onClick={() => setShowProxyModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-6">Nuevo Proxy Inverso</h2>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dominio / Subdominio</label>
                    <input 
                      type="text" 
                      placeholder="plex.mi-nas.duckdns.org"
                      value={newProxy.domain}
                      onChange={e => setNewProxy({...newProxy, domain: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Puerto del Contenedor</label>
                    <input 
                      type="number" 
                      placeholder="32400"
                      value={newProxy.targetPort}
                      onChange={e => setNewProxy({...newProxy, targetPort: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none"
                    />
                 </div>
                 <button 
                   onClick={addProxyDomain}
                   className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20"
                 >
                   Mapear Servicio
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* QR MODAL */}
      <AnimatePresence>
        {selectedQR && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(255,255,255,0.1)]">
               <button onClick={() => setSelectedQR(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X className="w-6 h-6"/></button>
               <h3 className="text-slate-900 text-lg font-black uppercase tracking-tight mb-6">Configuración VPN</h3>
               <div className="bg-slate-50 p-6 rounded-3xl mb-6">
                 <img src={selectedQR} alt="WireGuard QR" className="w-full h-auto" />
               </div>
               <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                 Escanea este código con la App de **WireGuard** en tu móvil para conectarte instantáneamente.
               </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-indigo-600/5 border border-indigo-500/10 p-6 rounded-3xl flex items-start space-x-4">
         <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Smartphone className="w-5 h-5 text-indigo-400" />
         </div>
         <div>
            <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1">Nota de Seguridad</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
               La VPN expone el puerto UDP 51820. Para que el Proxy Inverso funcione desde el exterior, asegúrate de apuntar tu dominio a tu IP pública y abrir los puertos 80 y 443 en tu router.
            </p>
         </div>
      </div>
    </div>
  );
}
