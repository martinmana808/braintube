import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SavedChannelItem = ({ 
  isCollapsed, 
  setHoveredChannel, 
  soloCategoryIds, 
  soloChannelIds,
  activeAddMode,
  setActiveAddMode,
  onAddVideoByLink,
  YOUTUBE_API_KEY,
  isSavedViewOpen,
  onToggleSavedView,
  savedVideosCount = 0
}) => {
  return (
    <div className="flex flex-col mb-3">
    <div className={`
      saved-channel-item
      flex 
      items-center 
      ${isCollapsed ? 'justify-center' : 'justify-between'} 
      group
    `}>
        <div className="saved-channel-item__info flex items-center gap-3 min-w-0">
            <div 
                className="saved-channel-item__avatar-wrapper relative group/avatar cursor-pointer"
                onClick={onToggleSavedView}
                onMouseEnter={(e) => {
                    if (isCollapsed) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredChannel({
                            id: 'saved-category',
                            name: 'Saved Videos',
                            top: rect.top,
                            left: rect.right + 10
                        });
                    }
                }}
                onMouseLeave={() => setHoveredChannel(null)}
            >
                <div className={`
                  saved-channel-item__avatar
                  w-8 
                  h-8 
                  rounded-full 
                  overflow-hidden 
                  flex 
                  items-center 
                  justify-center 
                  flex-shrink-0 
                  border-2 
                  transition-all 
                  duration-300 
                  ${isSavedViewOpen
                      ? 'bg-teal-100 dark:bg-green-900/30 text-teal-600 dark:text-green-400 border-teal-500 dark:border-green-500 ring-2 ring-teal-500/30 dark:ring-green-500/30 shadow-[0_0_12px_rgba(20,184,166,0.4)] scale-110'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-transparent opacity-100'
                  } 
                  ${
                      ((soloChannelIds.length > 0 || soloCategoryIds.length > 0) && !isSavedViewOpen)
                          ? 'opacity-40 grayscale'
                          : ''
                  }
                `}>
                    <Heart className={`w-4 h-4 ${isSavedViewOpen ? 'fill-current' : ''}`} />
                </div>
            </div>
            
            {!isCollapsed && (
                <div className="saved-channel-item__label-wrapper flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title="Saved Videos">
                            Saved
                        </span>
                        {savedVideosCount > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-mono leading-none">
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1 py-0.5 rounded-full" title="Total saved videos">
                                    {savedVideosCount}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {!isCollapsed && (
            <button
                onClick={() => setActiveAddMode(activeAddMode === 'saved-video' ? null : 'saved-video')}
                className={`
                    p-1.5 
                    rounded-lg 
                    transition-colors 
                    ${activeAddMode === 'saved-video' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100'
                    }
                `}
                title="Add Video to Saved"
            >
                <Plus className="w-4 h-4" />
            </button>
        )}
    </div>

    <AnimatePresence>
        {!isCollapsed && activeAddMode === 'saved-video' && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        const url = e.target.elements.videoUrl.value;
                        if (url.trim()) {
                            onAddVideoByLink(url, () => {
                                // Optional callback
                            });
                            e.target.elements.videoUrl.value = '';
                            setActiveAddMode(null); // Close after adding
                        }
                    }} 
                    className="flex gap-2 mb-2 mt-2 pl-11"
                >
                    <input
                        autoFocus
                        name="videoUrl"
                        type="text"
                        className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-[10px] focus:border-blue-500 outline-none px-2 py-1.5 font-mono transition-colors"
                        placeholder="Paste YouTube URL..."
                    />
                    <button
                        type="submit"
                        disabled={!YOUTUBE_API_KEY}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </form>
            </motion.div>
        )}
    </AnimatePresence>
    </div>
  );
};

export default SavedChannelItem;
