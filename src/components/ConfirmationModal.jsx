import React from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "default" // default, danger, alert
}) => {
  // if (!isOpen) return null; // Handled by AnimatePresence in parent

  const isAlert = type === 'alert';
  const isDanger = type === 'danger';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden w-full max-w-md shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${
              isDanger ? 'bg-red-500/10 text-red-500' : 
              isAlert ? 'bg-blue-500/10 text-blue-500' : 
              'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
            }`}>
              {isDanger ? <AlertTriangle className="w-6 h-6" /> : 
               isAlert ? <Info className="w-6 h-6" /> : 
               <CheckCircle className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            {!isAlert && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-lg ${
                isDanger 
                  ? 'bg-red-600 hover:bg-red-500' 
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmationModal;
