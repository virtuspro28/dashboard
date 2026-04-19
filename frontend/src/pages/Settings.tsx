import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Bell, Shield, 
  Send, Save, Loader2, CheckCircle2, 
  AlertTriangle, MessageSquare, Monitor, 
  Info, Cpu, RefreshCw, Github, Clock
} from 'lucide-react';
import { UpdateService } from '../../services/update.service'; // Mock import or types if needed on frontend? Wait, this is frontend, we use fetch.


interface NotificationConfig {
  telegramEnabled: boolean;
  telegramToken: string | null;
  telegramChatId: string | null;
  discordEnabled: boolean;
  discordWebhookUrl: string | null;
  tempThreshold: number;
}

export default function Settings() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [updateInfo, setUpdateInfo] = useState<{available: boolean, latestVersion: string, currentVersion: string} | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/notifications');
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        alert('Configuración guardada correctamente.');
      }
    } catch (err) {
      alert('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/settings/notifications/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Mensaje de prueba enviado con éxito.');
      } else {
        alert('Error en la prueba: ' + data.error);
      }
    } catch (err) {
      alert('Error al conectar con el servidor.');
    } finally {
      setTesting(false);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const res = await fetch('/api/system/update/check');
      const data = await res.json();
      if (data.success) {
        setUpdateInfo(data.data);
      }
    } catch (err) {
      console.error('Error checking for updates');
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!confirm('¿Estás seguro de actualizar? El sistema se reiniciará.')) return;
    try {
      await fetch('/api/system/update/apply', { method: 'POST' });
      alert('Actualización iniciada. El servidor se reiniciará en unos segundos.');
    } catch (err) {
      alert('Error al iniciar la actualización.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium">Cargando ajustes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-xl shadow-blue-900/20">
          <SettingsIcon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Configuración del Sistema</h1>
          <p className="text-slate-400">Personaliza las alertas, seguridad y comportamiento de tu NAS.</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'notifications' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-bold">Notificaciones</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-slate-600 cursor-not-allowed">
            <Shield className="w-5 h-5" />
            <span className="font-bold">Seguridad (Próximamente)</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-slate-600 cursor-not-allowed">
            <Monitor className="w-5 h-5" />
            <span className="font-bold">Pantalla (Próximamente)</span>
          </button>
          <div className="h-px bg-white/5 mx-2 my-2"></div>
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'maintenance' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${checkingUpdates ? 'animate-spin' : ''}`} />
            <span className="font-bold">Mantenimiento</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 space-y-10">
          {activeTab === 'notifications' && config && (
            <>
              {/* Telegram Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20">
                      <MessageSquare className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Telegram Alerts</h3>
                      <p className="text-xs text-slate-400">Recibe notificaciones vía Telegram Bot.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={config.telegramEnabled}
                      onChange={(e) => setConfig({ ...config, telegramEnabled: e.target.checked })}
                    />
                    <div className="w-14 h-7 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-100 transition-opacity">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Bot Token</label>
                    <input 
                      type="password"
                      placeholder="123456:ABC-DEF..."
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all"
                      value={config.telegramToken || ''}
                      onChange={(e) => setConfig({ ...config, telegramToken: e.target.value })}
                      disabled={!config.telegramEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Chat ID</label>
                    <input 
                      type="text"
                      placeholder="987654321"
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all"
                      value={config.telegramChatId || ''}
                      onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                      disabled={!config.telegramEnabled}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full"></div>

              {/* Discord Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                      <div className="w-6 h-6 flex items-center justify-center text-indigo-400 font-bold">D</div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Discord Webhook</h3>
                      <p className="text-xs text-slate-400">Envía alertas a un canal de Discord.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={config.discordEnabled}
                      onChange={(e) => setConfig({ ...config, discordEnabled: e.target.checked })}
                    />
                    <div className="w-14 h-7 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Webhook URL</label>
                  <input 
                    type="password"
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-all"
                    value={config.discordWebhookUrl || ''}
                    onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
                    disabled={!config.discordEnabled}
                  />
                </div>
              </div>

              <div className="h-px bg-white/5 w-full"></div>

              {/* Thresholds Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <Cpu className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Umbrales de Sistema</h3>
                    <p className="text-xs text-slate-400">Define cuándo disparar alertas críticas.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Temperatura Máxima CPU</label>
                      <span className="text-2xl font-black text-white">{config.tempThreshold}°C</span>
                    </div>
                    <input 
                      type="range" 
                      min="40" 
                      max="90" 
                      step="1"
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                      value={config.tempThreshold}
                      onChange={(e) => setConfig({ ...config, tempThreshold: parseInt(e.target.value) })}
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                      <span>40°C (Seguro)</span>
                      <span>90°C (Peligro)</span>
                    </div>
                  </div>
                  <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl max-w-[200px]">
                    <div className="flex items-center space-x-2 text-red-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Recomendado</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Para Raspberry Pi 4/5, el umbral ideal es 75°C. Por encima de 80°C se activa el throttling térmico.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  <span>Probar Notificación</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* OTA Updates Section */}
              <div className="space-y-6">
                 <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <Github className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Actualizaciones OTA</h3>
                      <p className="text-xs text-slate-400">Sincroniza tu NAS con la última versión de GitHub.</p>
                    </div>
                 </div>

                 <div className="bg-black/20 rounded-[2rem] p-8 border border-white/5 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center space-x-4">
                          <div className="flex flex-col">
                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Versión Actual</span>
                             <span className="text-2xl font-black text-slate-300">v{updateInfo?.currentVersion || '1.2.5'}</span>
                          </div>
                          <div className="h-10 w-px bg-white/10"></div>
                          <div className="flex flex-col">
                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estado</span>
                             {updateInfo?.available ? (
                               <span className="text-sm font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                 <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                                 Nueva versión v{updateInfo.latestVersion}
                               </span>
                             ) : (
                               <span className="text-sm font-bold text-slate-400">Sistema al día</span>
                             )}
                          </div>
                       </div>
                       <p className="text-xs text-slate-500 leading-relaxed">
                          HomePiNAS busca automáticamente cambios en la rama estable. La actualización incluye el panel web, los servicios core y parches de seguridad.
                       </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                       <button 
                         onClick={handleCheckUpdates}
                         disabled={checkingUpdates}
                         className="flex items-center justify-center space-x-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                       >
                         {checkingUpdates ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                         <span>Buscar Actualizaciones</span>
                       </button>
                       {updateInfo?.available && (
                         <button 
                           onClick={handleApplyUpdate}
                           className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all animate-pulse"
                         >
                            <Download className="w-4 h-4" />
                            <span>Instalar v{updateInfo.latestVersion} Ahora</span>
                         </button>
                       )}
                    </div>
                 </div>
              </div>

              {/* Logs y Debug Section (Placeholder) */}
              <div className="space-y-6">
                 <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                      <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Seguridad y Reinicio</h3>
                      <p className="text-xs text-slate-400">Acciones críticas de mantenimiento.</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-6 bg-slate-950/50 border border-white/5 rounded-3xl text-left hover:border-red-500/30 transition-all group">
                       <h4 className="text-white font-bold mb-1 group-hover:text-red-400">Limpiar Caché</h4>
                       <p className="text-[10px] text-slate-500 uppercase font-black">Libera espacio en /tmp y logs antiguos</p>
                    </button>
                    <button className="p-6 bg-slate-950/50 border border-white/5 rounded-3xl text-left hover:border-indigo-500/30 transition-all group">
                       <h4 className="text-white font-bold mb-1 group-hover:text-indigo-400">Reconstruir Base de Datos</h4>
                       <p className="text-[10px] text-slate-500 uppercase font-black">Sincroniza Prisma con el esquema local</p>
                    </button>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
