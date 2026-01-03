import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import YouTube from 'react-youtube';
import { X, Sparkles, Loader, Eye, EyeOff, Heart, Trash2, RotateCcw, MessageSquare, Send, Tag, Download, Share2, Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../services/supabase';
import { generateSummary as generateSummaryService, chatWithVideo, generateTags } from '../services/ai';
import LZString from 'lz-string';

const VideoModal = ({ video, onClose, state, onToggleSeen, onToggleSaved, onDelete }) => {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const { seen, saved, deleted } = state || {};
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'chat' | 'tags'
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const [error, setError] = useState(null);

  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState(false);
  const playerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const { data, error } = await supabase
        .from('video_metadata')
        .select('summary, tags')
        .eq('video_id', video.id)
        .maybeSingle();
      
      if (data) {
        if (data.summary) setSummary(data.summary);
        if (data.tags) setTags(data.tags);
      }
    };
    fetchSummary();

    return () => {
      // Save progress on unmount
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        localStorage.setItem(`progress_${video.id}`, time);
      }
    };
  }, [video.id]);

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const fetchTranscript = async () => {
    if (transcript) return transcript;

    try {
      const response = await fetch(`/.netlify/functions/get-transcript?videoId=${video.id}`);
      if (!response.ok) {
        if (response.status === 404) {
             throw new Error('No transcript available for this video');
        }
        throw new Error('Failed to fetch transcript');
      }
      const { transcript: fetchedTranscript } = await response.json();
      
      if (!fetchedTranscript) {
        throw new Error('No transcript available for this video');
      }
      setTranscript(fetchedTranscript);
      return fetchedTranscript;
    } catch (err) {
      console.error("Error fetching transcript:", err);
      throw err;
    }
  };

  const generateSummary = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const currentTranscript = await fetchTranscript();
      const aiSummary = await generateSummaryService(currentTranscript, GROQ_API_KEY);

      setSummary(aiSummary);

      // Save to Supabase
      await supabase.from('video_metadata').upsert({
        video_id: video.id,
        summary: aiSummary,
        last_updated: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error generating summary:', err);
      if (err.message === 'No transcript available for this video') {
          setError('No transcript available for this video. AI summary cannot be generated.');
      } else {
          setError('Failed to generate summary. Please check your API key and try again.');
      }
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoadingChat(true);

    try {
      const currentTranscript = await fetchTranscript();
      const aiResponse = await chatWithVideo(currentTranscript, chatMessages, userMessage.content, GROQ_API_KEY);
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      console.error("Error chatting with video:", err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error answering your question." }]);
    } finally {
      setLoadingChat(false);
    }
  };

/*
  const handleGenerateTags = async () => {
    setLoadingTags(true);
    try {
      const generatedTags = await generateTags(video.title, video.channelTitle, aiApiKey);
      setTags(generatedTags);

      // Save to Supabase
      // Note: User needs to add 'tags' column to video_metadata table
      await supabase.from('video_metadata').upsert({
        video_id: video.id,
        tags: generatedTags,
        last_updated: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error generating tags:", err);
      // Don't show error to user if it's just saving that failed (e.g. column missing)
      if (err.message && !err.message.includes('tags')) {
         setError(err.message);
      }
    } finally {
      setLoadingTags(false);
    }
  };
*/

  const handleShare = () => {
    const baseUrl = window.location.origin + '/share';
    const params = new URLSearchParams();
    params.set('id', video.id);
    params.set('title', video.title);
    params.set('channel', video.channelTitle);
    
    if (summary) {
      const compressed = LZString.compressToEncodedURIComponent(summary);
      params.set('s', compressed);
    }

    const shareUrl = `${baseUrl}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
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
    a.download = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_record.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyRecord = () => {
    const content = `# ${video.title}
Channel: ${video.channelTitle}
URL: https://www.youtube.com/watch?v=${video.id}
Published: ${video.publishedAt}

## Summary
${summary || 'No summary available.'}

---
This was created and copied in BrainTube`;

    navigator.clipboard.writeText(content);
    setCopiedRecord(true);
    setTimeout(() => setCopiedRecord(false), 2000);
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
        className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden w-full max-w-6xl h-[80vh] flex shadow-2xl relative" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Video Player Section */}
        <div className="w-2/3 h-full bg-black flex items-center justify-center relative">
           {/* Close button for mobile/if sidebar is collapsed? No, let's put it in sidebar header for desktop */}
          <YouTube
            videoId={video.id}
            opts={{
              height: '100%',
              width: '100%',
              playerVars: {
                autoplay: 1,
              },
            }}
            onReady={(e) => {
              playerRef.current = e.target;
              const iframe = e.target.getIframe();
              if (iframe) {
                const allow = iframe.getAttribute('allow') || '';
                if (!allow.includes('picture-in-picture')) {
                  iframe.setAttribute('allow', `${allow}; picture-in-picture`);
                }
              }
              
              const savedTime = localStorage.getItem(`progress_${video.id}`);
              if (savedTime) {
                e.target.seekTo(parseFloat(savedTime));
              }
            }}
            onStateChange={(e) => {
              // Save progress on pause (2) or buffer (3) or end (0)
              if (e.data === 2) {
                 localStorage.setItem(`progress_${video.id}`, e.target.getCurrentTime());
              }
            }}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>

        {/* Summary Section */}
        <div className="w-1/3 h-full border-l border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6 border-b border-gray-200 dark:border-gray-800 pr-12"> {/* Added pr-12 for close button space */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">{video.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-4">{video.channelTitle}</p>
            
            {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => onToggleSeen(video.id)}
                  className={`flex-1 flex items-center justify-center p-2 rounded transition-colors ${
                    seen 
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-500 border border-green-500/50' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title={seen ? "Mark as Unwatched" : "Mark as Watched"}
                >
                  {seen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => onToggleSaved(video.id)}
                  className={`flex-1 flex items-center justify-center p-2 rounded transition-colors ${
                    saved 
                      ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-500 border border-teal-500/50' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title={saved ? "Unsave Video" : "Save Video"}
                >
                  <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => onDelete(video.id)}
                  className={`flex-1 flex items-center justify-center p-2 rounded transition-colors ${
                    deleted 
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500 border border-red-500/50' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title={deleted ? "Restore from Bin" : "Move to Bin"}
                >
                 {deleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
               </button>
                <button 
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center p-2 rounded transition-colors bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Download Record (.md)"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleCopyRecord}
                  className="flex-1 flex items-center justify-center p-2 rounded transition-colors bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Copy Record to Clipboard"
                >
                  {copiedRecord ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center p-2 rounded transition-colors bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Share Public URL"
                >
                  {copiedShare ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>

            {/* Tabs */}
            <div className="flex ">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 text-sm font-bold transition-colors relative ${activeTab === 'summary' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  SUMMARY
                </div>
                
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 text-sm font-bold transition-colors relative ${activeTab === 'chat' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  CHAT
                </div>
                
              </button>
              {/* 
              <button
                onClick={() => setActiveTab('tags')}
                className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${activeTab === 'tags' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Tag className="w-4 h-4" />
                  TAGS
                </div>
                {activeTab === 'tags' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
                )}
              </button>
              */}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {activeTab === 'summary' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-green-500">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-bold uppercase tracking-wider text-sm">AI Summary</h3>
                  </div>
                  {summary && (
                    <button 
                      onClick={handleCopySummary}
                      className="text-gray-500 dark:hover:text-white hover:text-black transition-colors p-1"
                      title="Copy Summary"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {summary ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="text-gray-800 dark:text-gray-300 leading-relaxed">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 mt-10">
                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-gray-900 dark:text-gray-200 font-bold mb-2">No Summary Yet</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs">
                      Generate an AI summary to get a quick overview of this video's content.
                    </p>
                    <button
                      onClick={generateSummary}
                      disabled={loadingSummary}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-black font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingSummary ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Summary
                        </>
                      )}
                    </button>
                    {error && (
                      <p className="text-red-500 text-xs mt-4 max-w-xs">{error}</p>
                    )}
                  </div>
                )}
              </div>
            ) : /* activeTab === 'tags' ? (
              <div className="p-6">
                {tags && tags.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full text-sm font-medium border border-purple-900/50">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleGenerateTags}
                      disabled={loadingTags}
                      className="text-xs text-gray-500 hover:text-gray-300 underline"
                    >
                      Regenerate Tags
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 mt-10">
                    <div className="bg-gray-900 p-4 rounded-full mb-4">
                      <Tag className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-gray-200 font-bold mb-2">No Tags Yet</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs">
                      Generate smart tags based on the video title and channel.
                    </p>
                    <button
                      onClick={handleGenerateTags}
                      disabled={loadingTags}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingTags ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Tag className="w-4 h-4" />
                          Generate Tags
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : */ (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 mt-10">
                      <MessageSquare className="w-8 h-8 mb-3 opacity-50" />
                      <p className="text-sm">Ask anything about this video.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-200'
                        }`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a question..."
                      className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                      disabled={loadingChat}
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || loadingChat}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loadingChat ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VideoModal;
