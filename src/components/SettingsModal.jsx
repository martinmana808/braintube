import React from 'react';
import { motion } from 'framer-motion';
import { X, Key } from 'lucide-react';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  apiKey, 
  setApiKey, 
  aiApiKey, 
  setAiApiKey
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden w-full max-w-lg shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* API Keys */}
          <div>
            <h3 className="text-sm font-bold text-green-600 dark:text-green-500 mb-4 uppercase tracking-wider">API Configuration</h3>
            
            <div className="mb-4">
              <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">YouTube Data API Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full pl-10 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none py-2 font-mono"
                  placeholder="Enter YouTube API Key"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Groq API Key (AI Summary)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                </div>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  className="block w-full pl-10 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none py-2 font-mono"
                  placeholder="Enter Groq API Key"
                />
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-600 mt-1">
                Required for AI summaries. Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-500 hover:underline">console.groq.com</a>
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
