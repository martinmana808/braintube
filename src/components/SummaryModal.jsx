import React from 'react';
import { X, Sparkles, Loader, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SummaryModal = ({ video, summary, onClose, loading, onWatch }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4"> {/* Added pr-4 for spacing with close button */}
            {/* Thumbnail & Watch Button */}
            <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-6 group cursor-pointer" onClick={onWatch}>
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <button 
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded-full transition-transform transform group-hover:scale-105 shadow-lg"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Video
                </button>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 leading-tight">{video.title}</h2>
            <p className="text-gray-400 text-sm mb-6">{video.channelTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="flex items-center gap-2 text-green-400 mb-4 font-mono text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              AI Summary
            </div>
            <div className="text-gray-300 leading-relaxed">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm font-mono animate-pulse">Generating Summary...</p>
                </div>
              ) : (
                <ReactMarkdown>{summary}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
