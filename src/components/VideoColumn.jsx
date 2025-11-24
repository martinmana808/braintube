import React, { useState, useMemo, useEffect } from 'react';
import VideoCard from './VideoCard';
import { Search, ChevronDown, Loader } from 'lucide-react';

const VideoColumn = ({ title, videos, emptyMessage, videoStates, onToggleSeen, onToggleSaved, onDelete, categories = [], channels = [], onVideoClick, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Create a map for O(1) channel -> category lookup
  const channelCategoryMap = useMemo(() => {
    return channels.reduce((acc, channel) => {
      acc[channel.id] = channel.categoryId;
      return acc;
    }, {});
  }, [channels]);

  const filteredVideos = videos.filter(v => {
    // 1. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        v.title.toLowerCase().includes(query) ||
        v.channelTitle.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // 2. Category Filter
    if (selectedCategoryIds.length > 0) {
      // We need to find the channel ID for this video. 
      // The video object from YouTube API usually has snippet.channelId.
      // Our flattened video object has `channelId`.
      const categoryId = channelCategoryMap[v.channelId];
      if (!selectedCategoryIds.includes(categoryId)) return false;
    }

    return true;
  });

  const toggleCategory = (categoryId) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const clearCategories = () => setSelectedCategoryIds([]);

  const activeVideos = filteredVideos.filter(v => !videoStates?.[v.id]?.seen && !videoStates?.[v.id]?.deleted);
  const seenVideos = filteredVideos.filter(v => videoStates?.[v.id]?.seen && !videoStates?.[v.id]?.deleted);
  const deletedVideos = filteredVideos.filter(v => videoStates?.[v.id]?.deleted);

  const [isNewCollapsed, setIsNewCollapsed] = useState(false);
  const [isSeenCollapsed, setIsSeenCollapsed] = useState(true);
  const [isDeletedCollapsed, setIsDeletedCollapsed] = useState(true);
  const [isNewFlashing, setIsNewFlashing] = useState(false);
  const [isSeenFlashing, setIsSeenFlashing] = useState(false);
  const [isDeletedFlashing, setIsDeletedFlashing] = useState(false);
  const [prevNewCount, setPrevNewCount] = useState(0);
  const [prevSeenCount, setPrevSeenCount] = useState(0);
  const [prevDeletedCount, setPrevDeletedCount] = useState(0);

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

  const videoCardProps = {
    onToggleSeen,
    onToggleSaved,
    onDelete,
    onClick: onVideoClick,
    videoStates, // Pass videoStates down to VideoCard
  };

  return (
    <div className="flex flex-col h-full bg-black border-r border-gray-800 last:border-r-0">
      <div className="mb-4 border-b border-gray-800 pb-4 p-4">
        <h2 className="text-lg font-bold text-green-500 mb-3 font-mono uppercase tracking-wider">
          {title} <span className="text-gray-600 text-sm ml-2">[{filteredVideos.length - deletedVideos.length}]</span>
        </h2>
        
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-600" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 bg-gray-900 border border-gray-800 rounded text-gray-300 text-xs focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none py-1.5 font-mono"
            placeholder="Filter videos..."
          />
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={clearCategories}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                selectedCategoryIds.length === 0 
                  ? 'bg-green-900/30 border-green-500 text-green-400' 
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                  selectedCategoryIds.includes(cat.id)
                    ? 'bg-green-900/30 border-green-500 text-green-400'
                    : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Active Videos */}
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
              New [{activeVideos.length}]
            </h3>
          </button>

          {!isNewCollapsed && (
            <div className="space-y-4">
              {activeVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  state={videoStates?.[video.id] || {}}
                  {...videoCardProps}
                />
              ))}
              {activeVideos.length === 0 && filteredVideos.length > 0 && (
                <div className="text-center text-gray-600 py-8 font-mono text-sm italic">
                  All new videos have been seen already
                </div>
              )}
            </div>
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
                Seen [{seenVideos.length}]
              </h3>
            </button>
            
            {!isSeenCollapsed && (
              <div className="space-y-4">
                {seenVideos.map((video) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    state={videoStates?.[video.id] || {}}
                    {...videoCardProps}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deleted Videos Section */}
        {deletedVideos.length > 0 && (
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
                Trash [{deletedVideos.length}]
              </h3>
            </button>

            {!isDeletedCollapsed && (
              <div className="space-y-4">
                {deletedVideos.map((video) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    state={videoStates?.[video.id] || {}}
                    {...videoCardProps}
                  />
                ))}
              </div>
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
