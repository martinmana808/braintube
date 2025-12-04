import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, FolderPlus, Bookmark, Sparkles, Copy, Trash2, Eye, X, Plus, FileText, Heart } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Help & Guide</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Getting Started */}
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Getting Started</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Add Channels</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add YouTube channels to your feed. We'll track their latest uploads.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Categories</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Organize channels into custom categories to filter your view.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Add Video</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manually add a specific video by its YouTube URL.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Video Actions */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Video Actions</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">AI Summary</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Generate a concise AI summary of the video content without watching it.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Save Video</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Save interesting videos to your personal library for later viewing.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Mark as Seen</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mark videos as watched to dim them in your feed.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Copy Link</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Quickly copy the YouTube URL to your clipboard.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Remove</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hide a video from your feed (it won't be deleted from YouTube).</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Download Entry</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Download the video metadata and summary as a Markdown file.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Solo Channels</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click on the channel's image to solo it and hide all other channels from your feed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <button
              onClick={onClose}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              Got it
            </button>
        </div>
      </motion.div>
    </div>
  );
};

export default HelpModal;
