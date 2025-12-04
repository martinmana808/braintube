import React from 'react';
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react';

const SidebarHeader = ({ isCollapsed, onToggleSidebar }) => {
  return (
    <div className={`
      sidebar-header
      flex-none 
      h-[88px] 
      border-b 
      border-gray-200 
      dark:border-gray-800 
      bg-white 
      dark:bg-gray-950 
      z-10 
      flex 
      items-center 
      ${isCollapsed ? 'justify-center px-2' : 'px-4 gap-3'}
    `}>
      {/* Logo */}
      <div className="
        sidebar-header__logo
        flex 
        items-center 
        gap-2 
        overflow-hidden
      ">
        <div className="bg-gray-900 dark:bg-white p-1.5 rounded-lg flex-shrink-0">
          <Brain className="w-5 h-5 text-white dark:text-black" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white whitespace-nowrap">BrainTube</span>
        )}
      </div>
      
      {/* Sidebar Toggle Tab */}
      <button
          onClick={onToggleSidebar}
          className="
            sidebar-header__toggle
            absolute 
            -right-3 
            top-1/2 
            -translate-y-1/2 
            bg-white 
            dark:bg-gray-900 
            border 
            border-gray-200 
            dark:border-gray-800 
            rounded-full 
            p-1 
            shadow-md 
            hover:bg-gray-50 
            dark:hover:bg-gray-800 
            text-gray-400 
            hover:text-gray-600 
            dark:hover:text-gray-300 
            z-50 
            transition-colors
          "
          title={isCollapsed ? "Expand" : "Collapse"}
      >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
};

export default SidebarHeader;
