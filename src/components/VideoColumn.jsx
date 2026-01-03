import React, { useState, useMemo, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { motion } from 'framer-motion';

// Components
import VideoCard from './VideoCard';
import ColumnHeader from './column/ColumnHeader';
import CollapsibleSection from './column/CollapsibleSection';
import VideoList from './column/VideoList';

const VideoColumn = ({ 
  title, 
  videos, 
  emptyMessage, 
  videoStates, 
  onToggleSeen, 
  onToggleSaved, 
  onDelete, 
  categories = [], 
  channels = [], 
  onVideoClick, 
  loading, 
  onViewSummary, 
  onUpdateTitle,
  showBin = true, 
  showSaved = false, 
  searchQuery = '' 
}) => {
  // Filtered videos are just the passed videos prop, as filtering is handled by parent or global state now
  const filteredVideos = videos;

  const deletedVideos = filteredVideos.filter(v => videoStates?.[v.id]?.deleted);
  
  // If showSaved is true, we separate saved videos from active/seen
  const savedVideos = showSaved ? filteredVideos.filter(v => videoStates?.[v.id]?.saved && !videoStates?.[v.id]?.deleted) : [];
  
  // Main list includes both seen and unseen, but excludes deleted and saved (if showSaved is true)
  const mainVideos = filteredVideos.filter(v => 
    !videoStates?.[v.id]?.deleted && 
    (!showSaved || !videoStates?.[v.id]?.saved)
  );
  
  const unwatchedCount = mainVideos.filter(v => !videoStates?.[v.id]?.seen).length;
  
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' or 'UNWATCHED'

  const [isMainCollapsed, setIsMainCollapsed] = useState(false);
  const [isDeletedCollapsed, setIsDeletedCollapsed] = useState(true);
  const [isSavedCollapsed, setIsSavedCollapsed] = useState(false); // Default open for Saved

  const [isMainFlashing, setIsMainFlashing] = useState(false);
  const [isDeletedFlashing, setIsDeletedFlashing] = useState(false);
  const [isSavedFlashing, setIsSavedFlashing] = useState(false);

  const [prevMainCount, setPrevMainCount] = useState(0);
  const [prevDeletedCount, setPrevDeletedCount] = useState(0);
  const [prevSavedCount, setPrevSavedCount] = useState(0);

  // Trigger flash animation
  useEffect(() => {
    if (mainVideos.length > prevMainCount && prevMainCount > 0 && isMainCollapsed) {
      setIsMainFlashing(true);
      const timer = setTimeout(() => setIsMainFlashing(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevMainCount(mainVideos.length);
  }, [mainVideos.length, isMainCollapsed]);

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
    onUpdateTitle
  };

  const videosToShow = useMemo(() => {
    if (filterMode === 'UNWATCHED') {
      return mainVideos.filter(v => !videoStates?.[v.id]?.seen);
    }
    return mainVideos;
  }, [mainVideos, filterMode, videoStates]);

  return (
    <div className="video-column flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 last:border-r-0 transition-colors duration-200">
      
      <ColumnHeader 
        title={title}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        mainCount={mainVideos.length}
        unwatchedCount={unwatchedCount}
      />
      
      <div className="video-column__content flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        
        {/* Saved Videos Section (Only if showSaved is true) */}
        {showSaved && savedVideos.length > 0 && (
          <CollapsibleSection
            title="Saved"
            count={savedVideos.length}
            isCollapsed={isSavedCollapsed}
            onToggle={() => setIsSavedCollapsed(!isSavedCollapsed)}
            isFlashing={isSavedFlashing}
          >
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
          </CollapsibleSection>
        )}

        {/* Main Videos List (Mixed Watched/Unwatched) */}
        <VideoList 
          videos={videosToShow}
          videoStates={videoStates}
          videoCardProps={videoCardProps}
          emptyMessage={emptyMessage}
          loading={loading}
          filterMode={filterMode}
          mainVideosCount={mainVideos.length}
          filteredVideosCount={filteredVideos.length}
        />

        {/* Deleted Videos Section (Bin) - Only if showBin is true */}
        {showBin && deletedVideos.length > 0 && (
          <div className="pt-4 border-t dark:border-gray-800 border-gray-200">
            <CollapsibleSection
              title="Bin"
              count={deletedVideos.length}
              isCollapsed={isDeletedCollapsed}
              onToggle={() => setIsDeletedCollapsed(!isDeletedCollapsed)}
              isFlashing={isDeletedFlashing}
            >
              {deletedVideos.map((video) => (
                <motion.div
                  key={video.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <VideoCard 
                    video={video} 
                    state={videoStates?.[video.id] || {}}
                    {...videoCardProps}
                  />
                </motion.div>
              ))}
            </CollapsibleSection>
          </div>
        )}

        {/* Empty State / Loading */}
        {loading ? (
          <div className="video-column__loading flex flex-col items-center justify-center mt-20 text-teal-500 dark:text-green-500">
            <Loader className="w-8 h-8 animate-spin mb-2" />
            <span className="text-xs font-mono uppercase tracking-wider">Loading...</span>
          </div>
        ) : filteredVideos.length === 0 && (
          <div className="video-column__no-results text-center text-gray-600 mt-10 font-mono text-sm">
            {searchQuery ? 'No matches found' : (emptyMessage || 'No videos found')}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoColumn;
