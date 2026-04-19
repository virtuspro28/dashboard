import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight, 
  CheckCircle2, 
  Settings2,
  Trash2,
  Play
} from 'lucide-react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-toml';
import 'prismjs/themes/prism-tomorrow.css';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfigFile {
  name: string;
  path: string;
}

const ConfigEditor: React.FC = () => {
  const [files, setFiles] = useState<ConfigFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ConfigFile | null>(null);
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigFiles();
  }, []);

  const fetchConfigFiles = async () => {
    try {
      const res = await fetch('/api/config/files');
      const data = await res.json();
      if (data.success) {
        setFiles(data.data);
      }
    } catch (err) {
      setError('Failed to load file list');
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (file: ConfigFile) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/config/read?path=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      if (data.success) {
        setSelectedFile(file);
        setCode(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to read file content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (restart = false) => {
    if (!selectedFile) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    const containerHint = selectedFile.name.split('.')[0];
    try {
      const res = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedFile.path,
          content: code,
          restartContainerId: restart ? containerHint : undefined 
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(restart ? 'Config saved and service restarting...' : 'Configuration saved successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return languages.yaml;
    if (filename.endsWith('.json')) return languages.json;
    return languages.plain;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar - File List */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/20 p-6 flex flex-col h-full">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-500" />
          Config Editor
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2 custom-scrollbar">
          {files.length === 0 && !loading && (
            <div className="text-slate-600 text-sm italic p-4 text-center">
              No editable configs found in /data/configs
            </div>
          )}
          
          {files.map(file => (
            <button
              key={file.path}
              onClick={() => loadFile(file)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                selectedFile?.path === file.path 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                : 'text-slate-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 opacity-50" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${selectedFile?.path === file.path ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Editor */}
      <div className="flex-1 flex flex-col relative">
        <div className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md">
          <div>
            {selectedFile ? (
              <div className="flex items-center gap-3 text-slate-300">
                <span className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono">{selectedFile.path.split('.').pop()}</span>
                <span className="font-bold">{selectedFile.name}</span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Select a file to start editing</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSave(false)}
              disabled={!selectedFile || saving}
              className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-all border border-slate-700"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
            <button 
              onClick={() => handleSave(true)}
              disabled={!selectedFile || saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
            >
              <Play className="w-4 h-4" />
              Guardar y Reiniciar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence>
            {(error || successMsg) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              >
                {error ? (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-2 rounded-full flex items-center gap-2 backdrop-blur-md">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-6 py-2 rounded-full flex items-center gap-2 backdrop-blur-md">
                    <CheckCircle2 className="w-4 h-4" /> {successMsg}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-full overflow-auto custom-scrollbar bg-[#2d2d2d] p-8 font-mono">
            {selectedFile && (
              <Editor
                value={code}
                onValueChange={code => setCode(code)}
                highlight={code => highlight(code, getLanguage(selectedFile.name), 'yaml')}
                padding={20}
                className="min-h-full outline-none text-sm"
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                }}
              />
            )}
            {!selectedFile && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-30">
                <FileText className="w-16 h-16" />
                <p>Abra un archivo desde el panel izquierdo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigEditor;
