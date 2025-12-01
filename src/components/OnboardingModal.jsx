import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, FolderPlus, Bookmark, ArrowRight } from 'lucide-react';

const OnboardingModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to BrainTube! 🧠</h2>
            <p className="text-gray-500 dark:text-gray-400">Let's get your personal video feed set up.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <Youtube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Add Channels</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Add the YouTube channels you want to stay up to date with. We'll fetch their latest videos for you.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-400 leading-relaxed mt-1">
                  Videos will expire after 7 days.
                </p>  
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Organize with Categories</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Group your channels into categories like "Tech", "Music", or "News" to keep your feed tidy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Save for Later</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Found something interesting? Save specific videos to your personal library to watch later.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-400 leading-relaxed mt-1">
                  Saved videos won't expire.
                </p>  
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
