import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Key, Info, ExternalLink, Save, LogOut, User } from 'lucide-react';

const SettingsModal = ({ 
  isOpen, 
  onClose,
  initialKeys,
  onSave,
  user,
  onSignOut
}) => {
  const [keys, setKeys] = useState(initialKeys);
  const [status, setStatus] = useState(null); // 'saved' or null

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSave(keys);
    setStatus('saved');
    setTimeout(() => setStatus(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Instructions */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">Per-User API Keys</h3>
                    <p className="text-xs text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                        To manage your own daily quota, enter your personal API keys below. They are saved <strong>locally in your browser</strong> and used only for your session.
                    </p>
                    <div className="pt-2 flex flex-col gap-2">
                        <a 
                            href="https://console.cloud.google.com/apis/credentials" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                            GET YOUTUBE KEY <ExternalLink className="w-3 h-3" />
                        </a>
                        <a 
                            href="https://console.groq.com/keys" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                            GET GROQ KEY <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">YouTube Data API (v3)</label>
                    <input 
                        type="password"
                        value={keys.youtube}
                        onChange={(e) => setKeys(prev => ({ ...prev, youtube: e.target.value }))}
                        placeholder="AIzaSy..."
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Groq API Key (AI Summaries)</label>
                    <input 
                        type="password"
                        value={keys.groq}
                        onChange={(e) => setKeys(prev => ({ ...prev, groq: e.target.value }))}
                        placeholder="gsk_..."
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <button 
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    className={`
                        flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all
                        ${status === 'saved' 
                            ? 'bg-green-500 text-white animate-pulse' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                        }
                    `}
                >
                    {status === 'saved' ? 'Saved' : <><Save className="w-4 h-4" /> Save Configuration</>}
                </button>
            </div>
          </form>

          {/* Account Section */}
          <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-1">Account</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">
                            {user?.user_metadata?.full_name || 'Active Session'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                            {user?.email}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onSignOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors border border-red-100 dark:border-red-900/30"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
