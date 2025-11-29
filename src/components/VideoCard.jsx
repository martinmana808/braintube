import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Eye, EyeOff, Heart, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { formatDuration, parseDurationToSeconds } from '../utils/formatters';

const VideoCard = ({ video, state, onToggleSeen, onToggleSaved, onDelete, onClick, onViewSummary }) => {
  const { seen, saved, deleted, summary } = state;
  const [isExiting, setIsExiting] = useState(false);
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsMounting(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleAction = (e, callback) => {
    e.stopPropagation();
    setIsExiting(true);
    // Wait for animation to finish before calling the actual handler
    setTimeout(() => {
      callback(video.id);
    }, 300); // Match transition duration
  };

  // Calculate progress
  const savedTime = localStorage.getItem(`progress_${video.id}`);
  const totalSeconds = parseDurationToSeconds(video.duration);
  const progressPercent = savedTime && totalSeconds ? (parseFloat(savedTime) / totalSeconds) * 100 : 0;

  const timeAgo = formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true }).replace('about ', '');

  return (
    <div className={`flex bg-gray-900 border border-gray-800 rounded-md overflow-hidden group transition-all duration-300 ease-in-out
      ${isMounting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      ${isExiting ? 'opacity-0 scale-95 h-0 mb-0 border-0' : 'h-20 mb-0'}
    `}>
      {/* Thumbnail Section */}
      <div className="relative w-36 flex-shrink-0 cursor-pointer" onClick={() => onClick(video)}>
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 transition-opacity" />
        {video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1 rounded">
            {formatDuration(video.duration)}
          </span>
        )}
        {/* Progress Bar */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div 
              className="h-full bg-red-600" 
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Info Section */}
      <div className="flex-1 p-2 flex flex-col justify-between min-w-0 cursor-pointer" onClick={() => onClick(video)}>
        <h3 className="text-sm font-medium text-gray-200 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center text-xs text-gray-500 font-mono truncate">
          <span className="truncate hover:text-gray-300 transition-colors">{video.channelTitle}</span>
          <span className="mx-2 text-gray-700">•</span>
          <span className="flex-shrink-0">{timeAgo}</span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center px-3 border-l border-gray-800 bg-gray-900/50">
        <div className="flex gap-1">
          {!deleted && (
            <>
              <button 
                onClick={(e) => handleAction(e, onToggleSeen)}
                className="p-1.5 rounded hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-300"
                title={seen ? "Change to Unwatched" : "Change to Watched"}
              >
                {seen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleSaved(video.id); }}
                className="p-1.5 rounded hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-300"
                title={saved ? "Unsave" : "Save for Later"}
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onViewSummary(video);
                }}
                className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${summary ? 'text-gray-200 hover:text-white' : 'text-gray-500 hover:text-gray-300'}`}
                title={summary ? "View Summary" : "Generate Summary"}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </>
          )}
          <button 
            onClick={(e) => handleAction(e, onDelete)}
            className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${deleted ? 'text-blue-500 hover:text-blue-400' : 'text-gray-600 hover:text-red-500'}`}
            title={deleted ? "Restore from bin" : "Put video in the bin"}
          >
            {deleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
