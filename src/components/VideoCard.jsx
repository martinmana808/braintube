import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Eye, EyeOff, Heart, Trash2, RotateCcw, Sparkles, Pencil, Check, X, Undo2 } from 'lucide-react';
import { formatDuration, parseDurationToSeconds } from '../utils/formatters';

const VideoCard = ({ video, state, onToggleSeen, onToggleSaved, onDelete, onClick, onViewSummary, onUpdateTitle }) => {
  const { seen, saved, deleted, summary, customTitle } = state;
  const [isExiting, setIsExiting] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(video.title);

  useEffect(() => {
    if (isRenaming) {
        setRenameValue(customTitle || video.originalTitle || video.title);
    }
  }, [isRenaming, customTitle, video.originalTitle, video.title]);

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

  const handleSaveTitle = (e) => {
    e.stopPropagation();
    if (renameValue.trim()) {
        onUpdateTitle(video.id, renameValue.trim());
        setIsRenaming(false);
    }
  };

  const handleRevertTitle = (e) => {
      e.stopPropagation();
      onUpdateTitle(video.id, null);
      setIsRenaming(false);
  };

  const handleCancelRename = (e) => {
      e.stopPropagation();
      setIsRenaming(false);
      setRenameValue(video.title);
  };

  // Calculate progress
  const savedTime = localStorage.getItem(`progress_${video.id}`);
  const totalSeconds = parseDurationToSeconds(video.duration);
  const progressPercent = savedTime && totalSeconds ? (parseFloat(savedTime) / totalSeconds) * 100 : 0;

  const timeAgo = formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true }).replace('about ', '');
  const isShort = parseDurationToSeconds(video.duration) <= 180;

  return (
    <div className={`
      video-card
      flex 
      bg-gray-50 
      dark:bg-gray-900 
      border 
      border-gray-200 
      dark:border-gray-800 
      rounded-md 
      overflow-hidden 
      group 
      transition-all 
      duration-300 
      ease-in-out
      ${isMounting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      ${isExiting ? 'opacity-0 scale-100 mb-0' : 'h-20 mb-0'}
    `}>
      {/* Thumbnail Section */}
      <div 
        className="video-card__thumbnail-wrapper relative w-36 flex-shrink-0 cursor-pointer" 
        onClick={() => onClick(video)}
      >
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="video-card__thumbnail w-full h-full object-cover transition-opacity" 
        />
        {video.duration && (
          <span className="video-card__duration absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1 rounded">
            {formatDuration(video.duration)}
          </span>
        )}
        {isShort && (
           <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 tracking-wider">SHORTS</span>
        )}
        {/* Progress Bar */}
        {progressPercent > 0 && (
          <div className="video-card__progress-bg absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div 
              className="video-card__progress-fill h-full bg-red-600" 
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Info Section */}
      <div 
        className="video-card__info flex-1 p-2 flex flex-col justify-between min-w-0 cursor-pointer" 
        onClick={() => !isRenaming && onClick(video)}
      >
        {isRenaming ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle(e);
                        if (e.key === 'Escape') handleCancelRename(e);
                    }}
                />
                <button 
                  onClick={handleSaveTitle}
                  className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                >
                    <Check className="w-3 h-3" />
                </button>
                 <button 
                  onClick={handleCancelRename}
                  className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        ) : (
             <h3 className="video-card__title text-sm font-medium text-gray-900 dark:text-gray-200 line-clamp-2 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {video.title}
            </h3>
        )}
        
        <div className="video-card__meta flex items-center text-xs text-gray-500 font-mono truncate">
          <span className="video-card__channel truncate hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            {video.channelTitle}
          </span>
          <span className="mx-2 text-gray-400 dark:text-gray-700">•</span>
          <span className="video-card__time flex-shrink-0">{timeAgo}</span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="video-card__actions flex items-center px-3 border-l border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex gap-1">
          {!deleted && (
            <>
              <button 
                onClick={(e) => handleAction(e, onToggleSeen)}
                className="video-card__action-btn p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title={seen ? "Change to Unwatched" : "Change to Watched"}
              >
                {seen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleSaved(video.id); }}
                className="video-card__action-btn p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title={saved ? "Unsave" : "Save for Later"}
              >
                <Heart className={`w-4 h-4 ${saved ? 'text-gray-900 dark:text-gray-100 fill-current' : ''}`} />
              </button>
              {saved && (
                  <button 
                    onClick={(e) => {
                         e.stopPropagation();
                         setIsRenaming(!isRenaming);
                    }}
                    className={`video-card__action-btn p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${isRenaming ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                    title="Rename Video"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
              )}
               {saved && customTitle && isRenaming && (
                  <button 
                    onClick={handleRevertTitle}
                    className="video-card__action-btn p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-orange-500 hover:text-orange-600"
                    title="Revert to Original Title"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
              )}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onViewSummary(video);
                }}
                className={`video-card__action-btn p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${summary ? 'text-gray-900 hover:text-gray-700 dark:text-gray-200 dark:hover:text-white' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                title={summary ? "View Summary" : "Generate Summary"}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </>
          )}
          <button 
            onClick={(e) => handleAction(e, onDelete)}
            className={`video-card__action-btn p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${deleted ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-500'}`}
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
