import React, { useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import ReactMarkdown from 'react-markdown';
import LZString from 'lz-string';
import { Sparkles, Play, ExternalLink, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const SharePage = () => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const title = params.get('title');
      const channel = params.get('channel');
      const compressedSummary = params.get('s');

      if (!id) {
        throw new Error('Invalid share URL: Missing video ID');
      }

      let summary = null;
      if (compressedSummary) {
        summary = LZString.decompressFromEncodedURIComponent(compressedSummary);
      }

      setVideoData({
        id,
        title: title || 'Unknown Video',
        channel: channel || 'Unknown Channel',
        summary
      });
    } catch (err) {
      console.error("Error parsing share URL:", err);
      setError("Failed to load shared video. The link might be invalid.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4">
          <Sparkles className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-gray-400 mb-8 text-center">{error || "Something went wrong."}</p>
        <a href="/" className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded-full transition-colors">
          Go to BrainTube
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-black fill-current" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">BrainTube</span>
          </div>
          <a 
            href="/" 
            className="flex items-center gap-2 text-sm font-bold text-green-500 hover:text-green-400 transition-colors"
          >
            Try BrainTube <ExternalLink className="w-4 h-4" />
          </a>
        </header>

        <main className="space-y-8">
          {/* Video Player */}
          <div className="aspect-video w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            <YouTube
              videoId={videoData.id}
              opts={{
                height: '100%',
                width: '100%',
                playerVars: {
                  autoplay: 0,
                },
              }}
              className="w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>

          {/* Title & Channel */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{videoData.title}</h1>
            <p className="text-lg text-gray-400 font-mono">{videoData.channel}</p>
          </div>

          {/* AI Summary */}
          {videoData.summary && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 md:p-8"
            >
              <div className="flex items-center gap-2 text-green-400 mb-6 font-mono text-sm uppercase tracking-wider">
                <Sparkles className="w-5 h-5" />
                AI Summary
              </div>
              <div className="prose prose-invert prose-lg max-w-none">
                <ReactMarkdown>{videoData.summary}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </main>

        <footer className="mt-16 py-8 border-t border-gray-800 text-center text-gray-600 text-sm">
          <p>Shared via BrainTube • AI-Powered Video Curator</p>
        </footer>
      </div>
    </div>
  );
};

export default SharePage;
