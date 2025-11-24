import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { X, Sparkles, Loader } from 'lucide-react';
import { supabase } from '../services/supabase';

const VideoModal = ({ video, onClose, apiKey }) => {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const { data, error } = await supabase
        .from('video_metadata')
        .select('summary')
        .eq('video_id', video.id)
        .single();
      
      if (data?.summary) {
        setSummary(data.summary);
      }
    };
    fetchSummary();
  }, [video.id]);

  const generateSummary = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      // 1. Fetch Transcript (Mock for now as we don't have a proxy)
      // In a real app, we'd call a backend function here.
      // For this demo, we'll simulate a delay and a generic summary if we can't get real text.
      
      // TODO: Replace with actual AI call
      // const transcript = await fetchTranscript(video.id); 
      // const aiSummary = await callGemini(transcript);

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const mockSummary = `**AI Summary for ${video.title}**\n\nThis is a simulated summary because we need a backend to fetch YouTube transcripts securely. \n\n- Key point 1: The video discusses important topics.\n- Key point 2: The creator explains the details.\n- Key point 3: Conclusion and final thoughts.`;
      
      setSummary(mockSummary);

      // Save to Supabase
      await supabase.from('video_metadata').upsert({
        video_id: video.id,
        summary: mockSummary,
        last_updated: new Date().toISOString()
      });

    } catch (err) {
      console.error("Error generating summary:", err);
      setError("Failed to generate summary. (Transcript fetching requires a backend)");
    } finally {
      setLoadingSummary(false);
    }
  };

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
            <p className="text-sm text-gray-500 font-mono">{video.channelTitle}</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {summary ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="flex items-center gap-2 text-green-400 mb-4 font-mono text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  AI Summary
                </div>
                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                  {summary}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
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
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
