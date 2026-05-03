import { useState } from 'react';
import { Play, Square, Loader2, Box, RotateCcw, Terminal, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import type { ContainerInfo } from '../../types/docker';
import { resolveAppIconAsset } from '../../lib/appIcons';

interface ContainerCardProps {
  container: ContainerInfo;
  isProcessing?: boolean;
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onRestart?: (id: string) => void;
  onDelete?: (id: string, options: { deleteData: boolean }) => void;
  onDetails?: (id: string) => void;
  showExtendedActions?: boolean;
}

function resolveContainerWebUiUrl(container: ContainerInfo): string | null {
  const hostname = window.location.hostname;

  if (container.webUi) {
    return `http://${hostname}:${container.webUi.port}${container.webUi.path}`;
  }

  const firstPublicTcpPort = container.publishedPorts.find((port) => port.protocol === 'tcp');
  if (!firstPublicTcpPort) {
    return null;
  }

  return `http://${hostname}:${firstPublicTcpPort.hostPort}`;
}

export default function ContainerCard({
  container,
  isProcessing = false,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onDetails,
  showExtendedActions = false,
}: ContainerCardProps) {
  const isRunning = container.state === 'running';
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const appIcon = resolveAppIconAsset(container.name, container.image);
  const webUiUrl = resolveContainerWebUiUrl(container);
  const canOpenWebUi = isRunning && webUiUrl !== null;

  return (
    <>
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:bg-slate-900/60 transition-all shadow-xl shadow-black/20 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                {appIcon && !iconFailed ? (
                  <img
                    src={appIcon}
                    alt={container.name}
                    className="w-6 h-6 rounded-lg object-contain"
                    onError={() => setIconFailed(true)}
                  />
                ) : (
                  <Box className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 truncate w-32 md:w-48" title={container.name}>
                  {container.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 truncate w-32 md:w-48" title={container.image}>
                  {container.image}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {container.state}
              </span>
            </div>
          </div>

          <div className="mb-6 bg-slate-950/30 p-3 rounded-xl border border-slate-800/50">
            <p className="text-xs font-medium text-slate-400 flex justify-between">
              <span>Server Status</span>
              <span className="text-slate-300">{container.status || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className={showExtendedActions ? 'grid grid-cols-3 gap-3 sm:grid-cols-5' : 'flex space-x-3'}>
          {isRunning ? (
            <button
              onClick={() => onStop?.(container.id)}
              disabled={isProcessing}
              className={showExtendedActions
                ? 'flex items-center justify-center py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-medium transition-colors disabled:opacity-50'
                : 'flex-1 flex items-center justify-center py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-medium transition-colors disabled:opacity-50'}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : showExtendedActions ? <Square className="w-4 h-4" /> : <><Square className="w-4 h-4 mr-2" /> Apagar</>}
            </button>
          ) : (
            <button
              onClick={() => onStart?.(container.id)}
              disabled={isProcessing}
              className={showExtendedActions
                ? 'flex items-center justify-center py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium transition-colors disabled:opacity-50'
                : 'flex-1 flex items-center justify-center py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium transition-colors disabled:opacity-50'}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : showExtendedActions ? <Play className="w-4 h-4" /> : <><Play className="w-4 h-4 mr-2" /> Iniciar</>}
            </button>
          )}

          {webUiUrl && (
            <a
              href={canOpenWebUi ? webUiUrl : undefined}
              target="_blank"
              rel="noreferrer"
              title="Abrir Interfaz Web"
              aria-label="Abrir Interfaz Web"
              onClick={(event) => {
                if (!canOpenWebUi) {
                  event.preventDefault();
                }
              }}
              className={showExtendedActions
                ? `flex items-center justify-center py-2.5 rounded-xl border font-medium transition-colors ${
                  canOpenWebUi
                    ? 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/30'
                    : 'bg-white/5 text-slate-500 border-white/10 opacity-50 cursor-not-allowed'
                }`
                : `flex items-center justify-center px-4 py-2.5 rounded-xl border font-medium transition-colors ${
                  canOpenWebUi
                    ? 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/30'
                    : 'bg-white/5 text-slate-500 border-white/10 opacity-50 cursor-not-allowed'
                }`}
            >
              {showExtendedActions ? <ExternalLink className="w-4 h-4" /> : <><ExternalLink className="w-4 h-4 mr-2" /> Abrir</>}
            </a>
          )}

          {showExtendedActions && (
            <>
              <button
                onClick={() => onRestart?.(container.id)}
                disabled={isProcessing}
                className="flex items-center justify-center py-2.5 bg-white/5 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 border border-white/10 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onDetails?.(container.id)}
                className="flex items-center justify-center py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-medium transition-colors"
              >
                <Terminal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                disabled={isProcessing}
                className="flex items-center justify-center py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      {confirmingDelete && onDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-red-500/10 p-3">
                <AlertTriangle className="w-6 h-6 text-red-300" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Eliminar contenedor</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Se eliminará <span className="font-bold text-white">{container.name}</span>. Puedes conservar sus datos persistentes o eliminar también su carpeta de aplicación.
                </p>
              </div>
            </div>
            <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={deleteData}
                onChange={(event) => setDeleteData(event.target.checked)}
                className="h-5 w-5 rounded accent-red-500"
              />
              ¿Eliminar también carpeta de datos?
            </label>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteData(false);
                }}
                className="flex-1 rounded-2xl bg-white/5 px-4 py-3 font-bold text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  onDelete(container.id, { deleteData });
                  setDeleteData(false);
                }}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-black text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
