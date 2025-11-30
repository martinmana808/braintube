import React, { useState, useMemo, useEffect } from 'react';
import VideoCard from './VideoCard';
import { Search, ChevronDown, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoColumn = ({ title, videos, emptyMessage, videoStates, onToggleSeen, onToggleSaved, onDelete, categories = [], channels = [], onVideoClick, loading, onViewSummary, showBin = true, showSaved = false, searchQuery = '' }) => {
  // Filtered videos are just the passed videos prop, as filtering is handled by parent or global state now
  const filteredVideos = videos;

  const deletedVideos = filteredVideos.filter(v => videoStates?.[v.id]?.deleted);
  
  // If showSaved is true, we separate saved videos from active/seen
  const savedVideos = showSaved ? filteredVideos.filter(v => videoStates?.[v.id]?.saved && !videoStates?.[v.id]?.deleted) : [];
  
  // Active/Seen should exclude saved videos IF showSaved is true
  const activeVideos = filteredVideos.filter(v => 
    !videoStates?.[v.id]?.seen && 
    !videoStates?.[v.id]?.deleted && 
    (!showSaved || !videoStates?.[v.id]?.saved)
  );
  
  const seenVideos = filteredVideos.filter(v => 
    videoStates?.[v.id]?.seen && 
    !videoStates?.[v.id]?.deleted &&
    (!showSaved || !videoStates?.[v.id]?.saved)
  );

  const [isNewCollapsed, setIsNewCollapsed] = useState(false);
  const [isSeenCollapsed, setIsSeenCollapsed] = useState(true);
  const [isDeletedCollapsed, setIsDeletedCollapsed] = useState(true);
  const [isSavedCollapsed, setIsSavedCollapsed] = useState(false); // Default open for Saved

  const [isNewFlashing, setIsNewFlashing] = useState(false);
  const [isSeenFlashing, setIsSeenFlashing] = useState(false);
  const [isDeletedFlashing, setIsDeletedFlashing] = useState(false);
  const [isSavedFlashing, setIsSavedFlashing] = useState(false);

  const [prevNewCount, setPrevNewCount] = useState(0);
  const [prevSeenCount, setPrevSeenCount] = useState(0);
  const [prevDeletedCount, setPrevDeletedCount] = useState(0);
  const [prevSavedCount, setPrevSavedCount] = useState(0);

  // Trigger flash animation when items are added to New, Seen or Trash
  useEffect(() => {
    if (activeVideos.length > prevNewCount && prevNewCount > 0 && isNewCollapsed) {
      setIsNewFlashing(true);
      const timer = setTimeout(() => setIsNewFlashing(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevNewCount(activeVideos.length);
  }, [activeVideos.length, isNewCollapsed]);

  useEffect(() => {
    if (seenVideos.length > prevSeenCount && prevSeenCount > 0 && isSeenCollapsed) {
      setIsSeenFlashing(true);
      const timer = setTimeout(() => setIsSeenFlashing(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevSeenCount(seenVideos.length);
  }, [seenVideos.length, isSeenCollapsed]);

  useEffect(() => {
    if (deletedVideos.length > prevDeletedCount && prevDeletedCount > 0 && isDeletedCollapsed) {
      setIsDeletedFlashing(true);
      const timer = setTimeout(() => setIsDeletedFlashing(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevDeletedCount(deletedVideos.length);
  }, [deletedVideos.length, isDeletedCollapsed]);

  useEffect(() => {
    if (savedVideos.length > prevSavedCount && prevSavedCount > 0 && isSavedCollapsed) {
      setIsSavedFlashing(true);
      const timer = setTimeout(() => setIsSavedFlashing(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevSavedCount(savedVideos.length);
  }, [savedVideos.length, isSavedCollapsed]);

  const videoCardProps = {
    onToggleSeen,
    onToggleSaved,
    onDelete,
    onClick: onVideoClick,
    videoStates, // Pass videoStates down to VideoCard
    onViewSummary,
  };

  return (
    <div className="flex flex-col h-full bg-black border-r border-gray-800 last:border-r-0">
      <div className="mb-4 border-b border-gray-800 pb-4 p-4">
        <h2 className="text-lg font-bold text-green-500 mb-3 font-mono uppercase tracking-wider">
          {title} <span className="text-gray-600 text-sm ml-2">[{filteredVideos.length - (showBin ? deletedVideos.length : 0)}]</span>
        </h2>
        
        

      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        
        {/* Saved Videos Section (Only if showSaved is true) */}
        {showSaved && savedVideos.length > 0 && (
          <div className="mb-4">
            <button 
              onClick={() => setIsSavedCollapsed(!isSavedCollapsed)}
              className="flex items-center gap-2 w-full text-left mb-4 group"
            >
              <div className={`transition-transform duration-200 ${isSavedCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
              </div>
              <h3 className={`text-xs font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors font-mono ${
                isSavedFlashing ? 'text-green-500' : 'text-gray-500'
              }`}>
                Saved [{savedVideos.length}]
              </h3>
            </button>

            {!isSavedCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <AnimatePresence mode="popLayout">
                  {savedVideos.map((video) => (
                    <motion.div
                      key={video.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <VideoCard 
                        video={video} 
                        state={videoStates?.[video.id] || {}}
                        {...videoCardProps}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {/* Active Videos (Unwatched) */}
        <div className="mb-4">
          <button 
            onClick={() => setIsNewCollapsed(!isNewCollapsed)}
            className="flex items-center gap-2 w-full text-left mb-4 group"
          >
            <div className={`transition-transform duration-200 ${isNewCollapsed ? '-rotate-90' : 'rotate-0'}`}>
              <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
            </div>
            <h3 className={`text-xs font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors font-mono ${
              isNewFlashing ? 'text-green-500' : 'text-gray-500'
            }`}>
              Unwatched [{activeVideos.length}]
            </h3>
          </button>

          {!isNewCollapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <AnimatePresence mode="popLayout">
                {activeVideos.map((video) => (
                  <motion.div
                    key={video.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VideoCard 
                      video={video} 
                      state={videoStates?.[video.id] || {}}
                      {...videoCardProps}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {activeVideos.length === 0 && filteredVideos.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-600 py-8 font-mono text-sm italic"
                >
                  All videos watched
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Seen Videos Section */}
        {seenVideos.length > 0 && (
          <div className="pt-4 border-t border-gray-800">
            <button 
              onClick={() => setIsSeenCollapsed(!isSeenCollapsed)}
              className="flex items-center gap-2 w-full text-left mb-4 group"
            >
              <div className={`transition-transform duration-200 ${isSeenCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
              </div>
              <h3 className={`text-xs font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors font-mono ${
                isSeenFlashing ? 'text-green-500' : 'text-gray-500'
              }`}>
                Watched [{seenVideos.length}]
              </h3>
            </button>
            
            {!isSeenCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <AnimatePresence mode="popLayout">
                  {seenVideos.map((video) => (
                    <motion.div
                      key={video.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <VideoCard 
                        video={video} 
                        state={videoStates?.[video.id] || {}}
                        {...videoCardProps}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {/* Deleted Videos Section (Bin) - Only if showBin is true */}
        {showBin && deletedVideos.length > 0 && (
          <div className="pt-4 border-t border-gray-800">
            <button 
              onClick={() => setIsDeletedCollapsed(!isDeletedCollapsed)}
              className="flex items-center gap-2 w-full text-left mb-4 group"
            >
              <div className={`transition-transform duration-200 ${isDeletedCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
              </div>
              <h3 className={`text-xs font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors font-mono ${
                isDeletedFlashing ? 'text-green-500' : 'text-gray-500'
              }`}>
                Bin [{deletedVideos.length}]
              </h3>
            </button>

            {!isDeletedCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <AnimatePresence mode="popLayout">
                  {deletedVideos.map((video) => (
                    <motion.div
                      key={video.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <VideoCard 
                        video={video} 
                        state={videoStates?.[video.id] || {}}
                        {...videoCardProps}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {/* Empty State / Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center mt-20 text-green-500">
            <Loader className="w-8 h-8 animate-spin mb-2" />
            <span className="text-xs font-mono uppercase tracking-wider">Loading...</span>
          </div>
        ) : filteredVideos.length === 0 && (
          <div className="text-center text-gray-600 mt-10 font-mono text-sm">
            {searchQuery ? 'No matches found' : (emptyMessage || 'No videos found')}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoColumn;
