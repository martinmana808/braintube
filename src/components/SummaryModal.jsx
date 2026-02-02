import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader, Play, Copy, Download, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';

const SummaryModal = ({ video, summary, onClose, loading, onWatch, error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `# ${video.title}
Channel: ${video.channelTitle}
URL: https://www.youtube.com/watch?v=${video.id}
Published: ${video.publishedAt}

## Summary
${summary || 'No summary available.'}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start">
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

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">{video.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{video.channelTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-green-400 font-mono text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                AI Summary
              </div>
              {!loading && summary && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs transition-colors"
                    title="Copy Summary"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs transition-colors"
                    title="Download Record (.md)"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              )}
            </div>
            <div className="text-gray-800 dark:text-gray-300 leading-relaxed">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm font-mono animate-pulse">Generating Summary...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-3">
                    <Sparkles className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-gray-900 dark:text-gray-200 font-bold mb-1">Summary Generation Failed</h3>
                  <p className="text-red-500 text-sm max-w-xs">{error}</p>
                </div>
              ) : (
                <ReactMarkdown>{summary}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SummaryModal;
