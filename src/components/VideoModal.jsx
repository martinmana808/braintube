import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { X, Sparkles, Loader, Eye, EyeOff, Heart, Trash2, RotateCcw, MessageSquare, Send, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../services/supabase';
import { generateSummary as generateSummaryService, chatWithVideo, generateTags } from '../services/ai';

const VideoModal = ({ video, onClose, apiKey, aiApiKey, state, onToggleSeen, onToggleSaved, onDelete }) => {
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
  const playerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const { data, error } = await supabase
        .from('video_metadata')
        .select('summary, tags')
        .eq('video_id', video.id)
        .single();
      
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
      const aiSummary = await generateSummaryService(currentTranscript, aiApiKey);

      setSummary(aiSummary);

      // Save to Supabase
      await supabase.from('video_metadata').upsert({
        video_id: video.id,
        summary: aiSummary,
        last_updated: new Date().toISOString()
      });

    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err.message);
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
      const aiResponse = await chatWithVideo(currentTranscript, chatMessages, userMessage.content, aiApiKey);
      
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden w-full max-w-6xl h-[80vh] flex shadow-2xl relative" onClick={e => e.stopPropagation()}>
        
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
        <div className="w-1/3 h-full border-l border-gray-800 flex flex-col bg-gray-900 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6 border-b border-gray-800 pr-12"> {/* Added pr-12 for close button space */}
            <h2 className="text-xl font-bold text-gray-100 line-clamp-2 mb-2">{video.title}</h2>
            <p className="text-sm text-gray-500 font-mono mb-4">{video.channelTitle}</p>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mb-6">
               <button 
                 onClick={() => onToggleSeen(video.id)}
                 className={`flex-1 flex items-center justify-center gap-2 p-2 rounded transition-colors ${seen ? 'bg-gray-800 text-gray-400' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
                 title={seen ? "Mark as Unseen" : "Mark as Seen"}
               >
                 {seen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 <span className="text-xs font-bold">{seen ? 'SEEN' : 'MARK SEEN'}</span>
               </button>
               <button 
                 onClick={() => onToggleSaved(video.id)}
                 className={`flex-1 flex items-center justify-center gap-2 p-2 rounded transition-colors ${saved ? 'bg-pink-900/30 text-pink-500' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
                 title={saved ? "Unsave" : "Save for Later"}
               >
                 <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                 <span className="text-xs font-bold">{saved ? 'SAVED' : 'SAVE'}</span>
               </button>
               <button 
                 onClick={() => onDelete(video.id)}
                 className={`flex-1 flex items-center justify-center gap-2 p-2 rounded transition-colors ${deleted ? 'bg-blue-900/30 text-blue-500' : 'bg-gray-800 text-gray-200 hover:bg-red-900/30 hover:text-red-500'}`}
                 title={deleted ? "Restore from bin" : "Put video in the bin"}
               >
                 {deleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                 <span className="text-xs font-bold">{deleted ? 'RESTORE' : 'BIN'}</span>
               </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${activeTab === 'summary' ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  SUMMARY
                </div>
                {activeTab === 'summary' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${activeTab === 'chat' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  CHAT
                </div>
                {activeTab === 'chat' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
                )}
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
                {summary ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-gray-300 leading-relaxed">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 mt-10">
                    <div className="bg-gray-900 p-4 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-gray-200 font-bold mb-2">No Summary Yet</h3>
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
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-900">
                  <div className="relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a question..."
                      className="w-full bg-gray-800 text-white rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={loadingChat}
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || loadingChat}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loadingChat ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
