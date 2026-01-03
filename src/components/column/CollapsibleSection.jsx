import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CollapsibleSection = ({ 
  title, 
  count, 
  isCollapsed, 
  onToggle, 
  isFlashing, 
  children,
  flashColorClass = 'text-teal-600 dark:text-green-500'
}) => {
  return (
    <div className="video-column__section mb-4">
      <button 
        onClick={onToggle}
        className="video-column__section-header flex items-center gap-2 w-full text-left mb-4 group"
      >
        <div className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-300" />
        </div>
        <h3 className={`text-xs uppercase tracking-wider group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors font-mono ${
          isFlashing ? flashColorClass : 'text-gray-500'
        }`}>
          {title} [{count}]
        </h3>
      </button>

      {!isCollapsed && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="video-column__section-content space-y-4 overflow-hidden"
        >
          <AnimatePresence mode="popLayout">
            {children}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default CollapsibleSection;
