import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCard from '../VideoCard';

const VideoList = ({ 
  videos, 
  videoStates, 
  videoCardProps, 
  emptyMessage, 
  loading, 
  filterMode,
  mainVideosCount,
  filteredVideosCount
}) => {
  return (
    <div className="video-column__list mb-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {videos.map((video) => {
            const isSeen = videoStates?.[video.id]?.seen;
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isSeen ? 0.5 : 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <VideoCard 
                  video={video} 
                  state={videoStates?.[video.id] || {}}
                  {...videoCardProps}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {videos.length === 0 && filteredVideosCount > 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="video-column__empty-state text-center text-gray-600 py-8 font-mono text-sm italic"
          >
            {filterMode === 'UNWATCHED' && mainVideosCount > 0 ? "All caught up!" : "All videos cleared"}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default VideoList;
