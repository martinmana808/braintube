import React from 'react';
import { motion } from 'framer-motion';
import { X, Key } from 'lucide-react';

const SettingsModal = ({ 
  isOpen, 
  onClose
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
          {/* API Keys - HIDDEN/MANAGED BY ENV */}
          {/* 
          <div>
            <h3 className="text-sm font-bold text-green-600 dark:text-green-500 mb-4 uppercase tracking-wider">API Configuration</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">API keys are managed by the administrator.</p>
          </div> 
          */}

        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
