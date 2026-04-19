import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Folder, 
  File, 
  Search, 
  ArrowLeft, 
  Download, 
  Trash2, 
  Edit3, 
  Plus, 
  Upload, 
  ChevronRight, 
  Image as ImageIcon, 
  Film, 
  MoreVertical,
  X,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  extension: string;
  mtime: string;
}

const FileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: FileItem } | null>(null);
  
  // Preview State
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  
  // Search Results
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const fetchFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/browse?path=${encodeURIComponent(path)}`);
      const result = await response.json();
      if (result.success) {
        setItems(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSearching) {
      fetchFiles(currentPath);
    }
  }, [currentPath, fetchFiles, isSearching]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/files/search?q=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      if (result.success) {
        setItems(result.data);
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`/api/files/upload?path=${encodeURIComponent(currentPath)}`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        fetchFiles(currentPath);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (err) {
      alert('Upload error');
    }
  };

  const handleDownload = async (item: FileItem) => {
    window.open(`/api/files/download?path=${encodeURIComponent(item.path)}`, '_blank');
  };

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      const response = await fetch(`/api/files/delete?path=${encodeURIComponent(item.path)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        fetchFiles(currentPath);
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleMkdir = async () => {
    const name = prompt('New Folder Name:');
    if (!name) return;
    try {
      const response = await fetch('/api/files/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath, name }),
      });
      const result = await response.json();
      if (result.success) {
        fetchFiles(currentPath);
      }
    } catch (err) {
      alert('Create folder failed');
    }
  };

  const handleRename = async (item: FileItem) => {
    const newName = prompt('New name:', item.name);
    if (!newName || newName === item.name) return;
    
    // Construct new path
    const parts = item.path.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');

    try {
      const response = await fetch('/api/files/rename', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: item.path, newPath }),
      });
      const result = await response.json();
      if (result.success) {
        fetchFiles(currentPath);
      }
    } catch (err) {
      alert('Rename failed');
    }
  };

  const navigateTo = (path: string) => {
    setIsSearching(false);
    setSearchQuery('');
    setCurrentPath(path);
  };

  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className="h-full flex flex-col bg-slate-950 text-slate-100 p-6 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={goBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            disabled={!currentPath}
          >
            <ArrowLeft className={!currentPath ? 'text-slate-700' : 'text-slate-300'} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">File Station</h1>
            <p className="text-sm text-slate-500 font-mono">
              /mnt/storage/{currentPath}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search files..."
              className="bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <button 
            onClick={handleMkdir}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Folder
          </button>
          <button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden flex flex-col relative">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* File Navigator */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
              <Folder className="w-12 h-12 mb-4 opacity-10" />
              <p>This directory is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {items.map((item) => (
                <motion.div
                  key={item.path}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, item });
                  }}
                  onDoubleClick={() => {
                    if (item.isDirectory) {
                      navigateTo(item.path);
                    } else if (['.jpg', '.png', '.jpeg', '.mp4'].includes(item.extension)) {
                      setPreviewItem(item);
                    }
                  }}
                  className="group relative bg-slate-800/30 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 rounded-xl p-4 transition-all cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-blue-600/10 transition-colors">
                      {item.isDirectory ? (
                        <Folder className="w-10 h-10 text-blue-400" />
                      ) : (
                        item.extension === '.mp4' ? <Film className="w-10 h-10 text-purple-400" /> :
                        ['.jpg', '.png', '.jpeg'].includes(item.extension) ? <ImageIcon className="w-10 h-10 text-green-400" /> :
                        <File className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <div className="w-full">
                      <p className="text-sm font-medium text-slate-200 truncate px-2" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.isDirectory ? '--' : formatSize(item.size)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Action Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, item });
                    }}
                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded transition-all"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-2 w-48 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu(null)}
          onMouseLeave={() => setContextMenu(null)}
        >
          {!contextMenu.item.isDirectory && (
            <button 
              onClick={() => handleDownload(contextMenu.item)}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          )}
          <button 
            onClick={() => handleRename(contextMenu.item)}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Rename
          </button>
          <div className="my-1 border-t border-slate-800" />
          <button 
            onClick={() => handleDelete(contextMenu.item)}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-screen bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-slate-200">{previewItem.name}</span>
                </div>
                <button 
                  onClick={() => setPreviewItem(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/40">
                {['.jpg', '.png', '.jpeg'].includes(previewItem.extension) ? (
                  <img 
                    src={`/api/files/download?path=${encodeURIComponent(previewItem.path)}`}
                    alt={previewItem.name}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                  />
                ) : previewItem.extension === '.mp4' ? (
                  <video 
                    controls
                    className="max-w-full max-h-full"
                    autoPlay
                  >
                    <source src={`/api/files/download?path=${encodeURIComponent(previewItem.path)}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-slate-500 flex flex-col items-center gap-4">
                    <File className="w-20 h-20 opacity-20" />
                    <p>Preview not available for this file type</p>
                    <button 
                      onClick={() => handleDownload(previewItem)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-all"
                    >
                      Download to View
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileManager;
