import React from 'react';
import { createPortal } from 'react-dom';
import { Plus, Youtube, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarAddMenu = ({
  isCollapsed,
  onToggleSidebar,
  activeAddMode,
  setActiveAddMode,
  isAddMenuOpen,
  setIsAddMenuOpen,
  addMenuPos,
  setAddMenuPos,
  addBtnRef,
  onAddVideoByLink,
  onAddChannel,
  onAddCategory,
  YOUTUBE_API_KEY,
  isAddingChannel,
  newChannelId,
  setNewChannelId,
  newCategoryName,
  setNewCategoryName
}) => {
  
  const handleAddChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannelId.trim()) return;
    // Logic handled by parent via props, but we need to trigger it
    // The parent passed 'onAddChannel' which is async.
    // We should probably wrap it here or just call it.
    // The parent's handleAddChannel does state management for isAddingChannel.
    // Let's assume onAddChannel passed here is the WRAPPER function from parent if possible,
    // OR we re-implement the wrapper logic here if the parent passed the raw function.
    // Looking at SettingsPanel, it passes 'handleAddChannel' as 'onAddChannel' prop? 
    // No, it passes 'addChannel' (raw) as 'onAddChannel'.
    // Wait, SettingsPanel defines 'handleAddChannel' (lines 55-69) which calls 'onAddChannel' (prop).
    // We should probably pass 'handleAddChannel' from SettingsPanel to this component.
    // For now, let's assume the prop passed 'onAddChannel' is the one we should call, 
    // but we need to handle the event.
    
    // Actually, let's look at how it was used. 
    // <form onSubmit={handleAddChannel}>
    // So we need to receive handleAddChannel as a prop, OR implement it here.
    // Let's implement a local handler that calls the prop.
    onAddChannel(e);
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    onAddCategory(e);
  };

  return (
    <div className="sidebar-add-menu mb-4 border-gray-200 dark:border-gray-800 pb-4">
      {isCollapsed ? (
          <div className="relative">
              <button
                  ref={addBtnRef}
                  onClick={() => {
                      if (!isAddMenuOpen && addBtnRef.current) {
                          const rect = addBtnRef.current.getBoundingClientRect();
                          setAddMenuPos({ top: rect.top, left: rect.right + 10 });
                      }
                      setIsAddMenuOpen(!isAddMenuOpen);
                  }}
                  className="
                    sidebar-add-menu__button
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
                  title="Add..."
              >
                  <Plus className="h-5 w-5" />
              </button>
              {isAddMenuOpen && createPortal(
                  <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsAddMenuOpen(false)} />
                      <div 
                          className="
                            sidebar-add-menu__dropdown
                            fixed 
                            z-[70] 
                            w-32 
                            bg-white 
                            dark:bg-gray-900 
                            border 
                            border-gray-200 
                            dark:border-gray-800 
                            rounded-xl 
                            shadow-xl 
                            overflow-hidden
                          "
                          style={{ top: addMenuPos.top, left: addMenuPos.left }}
                      >

                          <button
                              onClick={() => {
                                  onToggleSidebar();
                                  setActiveAddMode('channel');
                                  setIsAddMenuOpen(false);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-xs font-mono uppercase hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          >
                              <Youtube className="h-3 w-4" /> Channel
                          </button>
                          <button
                              onClick={() => {
                                  onToggleSidebar();
                                  setActiveAddMode('category');
                                  setIsAddMenuOpen(false);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-xs font-mono uppercase hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          >
                              <FolderPlus className="h-3 w-4" /> Category
                          </button>
                      </div>
                  </>,
                  document.body
              )}
          </div>
      ) : (
          <div className="grid grid-cols-2 gap-3">

          <button
              onClick={() => setActiveAddMode(activeAddMode === 'channel' ? null : 'channel')}
              className={`
                sidebar-add-menu__item
                flex 
                flex-col 
                items-center 
                justify-center 
                p-3 
                rounded-xl 
                border 
                transition-all 
                duration-200 
                group 
                relative 
                overflow-hidden 
                ${activeAddMode === 'channel' 
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-600 dark:text-purple-400 shadow-md scale-[1.02]' 
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
              title="Add Channel"
          >
              <Youtube className={`h-5 w-5 mb-1.5 transition-transform duration-200 ${activeAddMode === 'channel' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Channel</span>
          </button>
          <button
              onClick={() => setActiveAddMode(activeAddMode === 'category' ? null : 'category')}
              className={`
                sidebar-add-menu__item
                flex 
                flex-col 
                items-center 
                justify-center 
                p-3 
                rounded-xl 
                border 
                transition-all 
                duration-200 
                group 
                relative 
                overflow-hidden 
                ${activeAddMode === 'category' 
                  ? 'bg-teal-50 dark:bg-green-900/20 border-teal-500 dark:border-green-500 text-teal-600 dark:text-green-400 shadow-md scale-[1.02]' 
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
              title="Add Category"
          >
              <FolderPlus className={`h-5 w-5 mb-1.5 transition-transform duration-200 ${activeAddMode === 'category' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Category</span>
          </button>
          </div>
      )}

      <AnimatePresence mode="wait">


        {activeAddMode === 'channel' && (
          <motion.div
            key="channel-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            // className="overflow-hidden"
          >
            <form onSubmit={handleAddChannelSubmit} className="flex gap-2 mb-4 mt-4">
              <input
                autoFocus
                type="text"
                value={newChannelId}
                onChange={(e) => setNewChannelId(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-[10px] focus:border-blue-500 outline-none px-2 py-1.5 font-mono transition-colors"
                placeholder="Channel ID or Handle..."
              />
              <button
                type="submit"
                disabled={isAddingChannel || !YOUTUBE_API_KEY}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}

        {activeAddMode === 'category' && (
          <motion.div
            key="category-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            // className="overflow-hidden"
          >
            <form onSubmit={handleAddCategorySubmit} className="flex gap-2 mb-4 mt-4">
              <input
                autoFocus
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-[10px] focus:border-blue-500 outline-none px-2 py-1.5 font-mono transition-colors"
                placeholder="New Category Name..."
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarAddMenu;
