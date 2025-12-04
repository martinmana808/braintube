import React from 'react';
import { Search, X } from 'lucide-react';

const SidebarSearch = ({ 
  isCollapsed, 
  onToggleSidebar, 
  searchQuery, 
  onSearchChange, 
  searchInputRef 
}) => {
  return (
    <div className="sidebar-search mb-4">
      {isCollapsed ? (
          <div className="flex justify-center">
              <button 
                  onClick={() => {
                      onToggleSidebar();
                      // Use setTimeout to wait for the transition/render to complete before focusing
                      setTimeout(() => {
                          searchInputRef.current?.focus();
                      }, 100);
                  }} 
                  className="
                    sidebar-search__button
                    flex 
                    flex-col 
                    items-center 
                    justify-center 
                    p-3 
                    rounded-xl 
                    border 
                    transition-all 
                    duration-200 
                    bg-white 
                    dark:bg-gray-900 
                    border-gray-200 
                    dark:border-gray-800 
                    text-gray-500 
                    hover:border-gray-300 
                    dark:hover:border-gray-700 
                    hover:shadow-sm 
                    hover:text-gray-700 
                    dark:hover:text-gray-300 
                    w-full
                  "
                  title="Search"
              >
                  <Search className="h-5 w-5" />
              </button>
          </div>
      ) : (
          <div className="sidebar-search__input-wrapper relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="
                  sidebar-search__input
                  block 
                  w-full 
                  pl-10 
                  pr-4 
                  py-3 
                  bg-white 
                  dark:bg-gray-900 
                  border 
                  border-gray-200 
                  dark:border-gray-800 
                  rounded-xl 
                  text-gray-900 
                  dark:text-gray-100 
                  placeholder-gray-400 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-blue-500/20 
                  focus:border-blue-500 
                  transition-all 
                  shadow-sm 
                  text-sm 
                  font-medium
                "
                placeholder="Search videos..."
            />
            {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="
                    sidebar-search__clear
                    absolute 
                    inset-y-0 
                    right-0 
                    pr-3 
                    flex 
                    items-center 
                    text-gray-400 
                    hover:text-gray-600 
                    dark:hover:text-gray-300
                  "
                >
                  <X className="h-4 w-4" />
                </button>
            )}
          </div>
      )}
    </div>
  );
};

export default SidebarSearch;
