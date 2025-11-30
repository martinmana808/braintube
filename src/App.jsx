import React, { useState, useEffect, useMemo } from 'react';
import { isToday, isWithinInterval, subDays, parseISO } from 'date-fns';
import VideoColumn from './components/VideoColumn';
import SettingsPanel from './components/SettingsPanel';
import { fetchChannelDetails, fetchVideos, fetchVideoDetails } from './services/youtube';
import { supabase } from './services/supabase';
import { generateSummary as generateSummaryService } from './services/ai';
import VideoModal from './components/VideoModal';
import SummaryModal from './components/SummaryModal';

import ConfirmationModal from './components/ConfirmationModal';
import SettingsModal from './components/SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('yt_curator_api_key') || import.meta.env.VITE_YOUTUBE_API_KEY || '');
  const [aiApiKey, setAiApiKey] = useState(() => localStorage.getItem('yt_curator_ai_api_key') || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [channels, setChannels] = useState([]);
  const [videoStates, setVideoStates] = useState({});
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [viewingSummaryVideo, setViewingSummaryVideo] = useState(null);
  const [generatingSummaryId, setGeneratingSummaryId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [soloChannelIds, setSoloChannelIds] = useState([]);
  const [soloCategoryIds, setSoloCategoryIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showConfirm = ({ title, message, onConfirm, confirmText = "Confirm", cancelText = "Cancel", type = "default" }) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      type
    });
  };

  const showAlert = (title, message) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: null,
      confirmText: "OK",
      type: "alert"
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Persistence for API Keys
  useEffect(() => {
    localStorage.setItem('yt_curator_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('yt_curator_ai_api_key', aiApiKey);
  }, [aiApiKey]);

  // Theme Persistence
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Supabase Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log('App: fetchData started');
      
      // Fetch Categories
      const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('*').order('name');
      if (categoriesError) console.error('Error fetching categories:', categoriesError);
      if (categoriesData) setCategories(categoriesData);

      // Fetch Channels
      const { data: channelsData, error: channelsError } = await supabase.from('channels').select('*');
      if (channelsError) console.error('Error fetching channels:', channelsError);
      if (channelsData) {
        // Map DB snake_case to frontend camelCase
        const mappedChannels = channelsData.map(c => ({
          ...c,
          categoryId: c.category_id,
          uploadsPlaylistId: c.uploads_playlist_id
        }));
        setChannels(mappedChannels);
      }

      // Fetch Video Metadata
      const { data: videoData, error: videoMetadataError } = await supabase.from('video_metadata').select('*');
      if (videoMetadataError) console.error('Error fetching video metadata:', videoMetadataError);
      if (videoData) {
        const states = videoData.reduce((acc, item) => {
          acc[item.video_id] = { 
            seen: item.seen, 
            saved: item.saved, 
            deleted: item.deleted, 
            summary: item.summary,
            lastUpdated: new Date(item.last_updated).getTime() 
          };
          return acc;
        }, {});
        setVideoStates(states);
      }
      
      setLoading(false);
      console.log('App: fetchData finished', { categories: categoriesData?.length, channels: channelsData?.length });
    };

    fetchData();
  }, []);

  // Fetch Data
  useEffect(() => {
    if (!apiKey || channels.length === 0) return;

    const fetchAllVideos = async () => {
      setLoading(true);
      console.log('App: fetchAllVideos started', { channelsCount: channels.length });
      try {
        const activeChannels = channels.filter(c => c.visible !== false); // Default to true if undefined
        const promises = activeChannels.map(channel => fetchVideos(apiKey, channel.uploads_playlist_id || channel.uploadsPlaylistId));
        const results = await Promise.all(promises);
        const allVideos = results.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setVideos(allVideos);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
        console.log('App: fetchAllVideos finished');
      }
    };

    fetchAllVideos();
    const interval = setInterval(fetchAllVideos, 1000 * 60 * 60); // Refresh every hour
    return () => clearInterval(interval);
  }, [apiKey, channels]);

  const addChannel = async (channelIdOrUrl) => {
    if (!apiKey) return;
    
    let channelId = channelIdOrUrl;
    
    // Handle URL input
    if (channelIdOrUrl.includes('youtube.com') || channelIdOrUrl.includes('youtu.be')) {
      // ... (URL parsing logic remains same, but we need to fetch details first)
      // For simplicity, let's assume we fetch details inside fetchChannelDetails
    }

    try {
      const details = await fetchChannelDetails(apiKey, channelId);
      if (channels.some(c => c.id === details.id)) {
        showAlert('Duplicate Channel', 'This channel has already been added to your list.');
        return;
      }

      const newChannel = {
        id: details.id,
        name: details.name,
        thumbnail: details.thumbnail,
        uploads_playlist_id: details.uploadsPlaylistId,
        visible: true,
        category_id: null
      };

      const { error } = await supabase.from('channels').insert([newChannel]);
      if (error) throw error;

      // Map category_id from DB to categoryId for state consistency
      setChannels(prev => [...prev, { ...newChannel, categoryId: newChannel.category_id }]); 
    } catch (error) {
      console.error("Error adding channel:", error);
      showAlert('Error', `Could not add channel: ${error.message || error.error_description || "Unknown error"}`);
    }
  };

  const addVideoByLink = async (url, onDuplicate) => {
    if (!apiKey) return;
    
    try {
      // 1. Fetch Video Details
      const videoDetails = await fetchVideoDetails(apiKey, url);
      
      // 2. Check for Duplicate
      if (videoStates[videoDetails.id]?.saved) {
        showConfirm({
          title: 'Video Already Exists',
          message: 'This video is already in your Saved list.',
          confirmText: 'Add another video',
          cancelText: 'Close',
          onConfirm: () => {
            if (onDuplicate) onDuplicate();
          }
        });
        return;
      }
      
      // 3. Check if channel exists
      const channelExists = channels.some(c => c.id === videoDetails.channelId);
      
      if (!channelExists) {
        // Add Channel
        const channelDetails = await fetchChannelDetails(apiKey, videoDetails.channelId);
        const newChannel = {
          id: channelDetails.id,
          name: channelDetails.name,
          thumbnail: channelDetails.thumbnail,
          uploads_playlist_id: channelDetails.uploadsPlaylistId,
          visible: true,
          category_id: null
        };

        const { error } = await supabase.from('channels').insert([newChannel]);
        if (error) throw error;
        
        setChannels(prev => [...prev, { ...newChannel, categoryId: null }]);
      }

      // 4. Save Video
      const newVideo = {
        ...videoDetails,
      };
      
      setVideos(prev => {
        if (prev.some(v => v.id === newVideo.id)) return prev;
        return [...prev, newVideo].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      });

      // 5. Mark as Saved
      await updateVideoState(newVideo.id, { saved: true });
      
      showConfirm({
        title: 'Success',
        message: `Video "${videoDetails.title}" added and saved! ${!channelExists ? `Channel "${videoDetails.channelTitle}" was also added to your list.` : ''}`,
        confirmText: 'Watch Now',
        cancelText: 'OK',
        onConfirm: () => setSelectedVideo(newVideo)
      });

    } catch (error) {
      console.error("Error adding video by link:", error);
      showAlert('Error', `Could not add video: ${error.message}`);
    }
  };

  const removeChannel = async (id) => {
    const { error } = await supabase.from('channels').delete().eq('id', id);
    if (!error) {
      setChannels(prev => prev.filter(c => c.id !== id));
    } else {
      console.error("Error removing channel:", error);
    }
  };

  const toggleChannelVisibility = async (id) => {
    const channel = channels.find(c => c.id === id);
    if (!channel) return;
    const { error } = await supabase.from('channels').update({ visible: !channel.visible }).eq('id', id);
    if (!error) {
      setChannels(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    } else {
      console.error("Error toggling channel visibility:", error);
    }
  };

  const toggleChannelSolo = (id) => {
    setSoloChannelIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const clearSolo = () => {
    setSoloChannelIds([]);
    setSoloCategoryIds([]);
  };

  const toggleCategorySolo = (categoryId) => {
    setSoloCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Category Actions
  const addCategory = async (name) => {
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Category already exists');
    }
    const { data, error } = await supabase.from('categories').insert([{ name }]).select();
    if (error) {
      console.error("Error adding category:", error);
    } else if (data && data.length > 0) {
      setCategories(prev => [...prev, data[0]]);
    }
  };

  const deleteCategory = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id));
      // Also update channels in state and DB to remove categoryId
      const { error: channelUpdateError } = await supabase.from('channels').update({ category_id: null }).eq('category_id', id);
      if (channelUpdateError) {
        console.error("Error updating channels after category deletion:", channelUpdateError);
      }
      setChannels(prev => prev.map(c => c.categoryId === id ? { ...c, categoryId: null } : c));
    } else {
      console.error("Error deleting category:", error);
    }
  };

  const updateChannelCategory = async (channelId, categoryId) => {
    const { error } = await supabase.from('channels').update({ category_id: categoryId }).eq('id', channelId);
    if (!error) {
      setChannels(prev => prev.map(c => c.id === channelId ? { ...c, categoryId } : c));
    } else {
      console.error("Error updating channel category:", error);
    }
  };

  // Video Actions
  const updateVideoState = async (videoId, updates) => {
    const currentState = videoStates[videoId] || {};
    const newState = { ...currentState, ...updates, lastUpdated: Date.now() };
    
    // Optimistic Update
    setVideoStates(prev => ({
      ...prev,
      [videoId]: newState
    }));

    // Supabase Update
    const { error } = await supabase.from('video_metadata').upsert({
      video_id: videoId,
      seen: newState.seen || false,
      saved: newState.saved || false,
      deleted: newState.deleted || false,
      summary: newState.summary,
      last_updated: new Date().toISOString()
    });

    if (error) console.error("Error updating video state:", error);
  };

  const toggleSeen = (videoId) => {
    updateVideoState(videoId, { seen: !videoStates[videoId]?.seen });
  };

  const toggleSaved = (videoId) => {
    const isCurrentlySaved = videoStates[videoId]?.saved;
    
    if (isCurrentlySaved) {
      const video = videos.find(v => v.id === videoId);
      if (video) {
        const publishedAt = parseISO(video.publishedAt);
        const cutoffDate = subDays(new Date(), 7);
        
        // If older than 7 days (using a slightly generous buffer or exact comparison)
        // We want to warn if it's NOT in the "recent" window, i.e., older than 7 days.
        if (publishedAt < cutoffDate) {
           showConfirm({
             title: "Unsave Video",
             message: "This video is older than 7 days. If you unsave it, it will be removed from your list permanently. Are you sure?",
             confirmText: "Unsave",
             type: "danger",
             onConfirm: () => updateVideoState(videoId, { saved: !isCurrentlySaved })
           });
           return;
        }
      }
    }
    updateVideoState(videoId, { saved: !isCurrentlySaved });
  };

  const deleteVideo = (videoId) => {
    updateVideoState(videoId, { deleted: !videoStates[videoId]?.deleted });
  };

  // Filtering
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  // Pass ALL videos to columns, let them handle filtering/grouping
  // Filter videos based on Solo mode and Search
  const activeVideos = useMemo(() => {
    let filtered = videos;

    // 1. Solo Filter (Channels OR Categories)
    if (soloChannelIds.length > 0 || soloCategoryIds.length > 0) {
      filtered = filtered.filter(v => {
        const channel = channels.find(c => c.id === v.channelId);
        const isChannelSolo = soloChannelIds.includes(v.channelId);
        const isCategorySolo = channel && channel.categoryId && soloCategoryIds.includes(channel.categoryId);
        return isChannelSolo || isCategorySolo;
      });
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(query) || 
        v.channelTitle.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [videos, soloChannelIds, soloCategoryIds, searchQuery, channels]);

  const todayVideos = activeVideos.filter(v => isToday(parseISO(v.publishedAt)));
  
  const pastVideos = activeVideos.filter(v => {
    const date = parseISO(v.publishedAt);
    const isSaved = videoStates[v.id]?.saved;
    // Include if it's NOT today AND (within last 7 days OR is saved)
    return !isToday(date) && (isWithinInterval(date, { start: sevenDaysAgo, end: today }) || isSaved);
  });

  const commonProps = {
    videoStates,
    onToggleSeen: toggleSeen,
    onToggleSaved: toggleSaved,
    onDelete: deleteVideo,
    categories,
    channels,
    onVideoClick: (video) => setSelectedVideo(video),
    onViewSummary: (video) => handleViewSummary(video)
  };

  const handleViewSummary = async (video) => {
    setViewingSummaryVideo(video);

    // If summary already exists, do nothing
    if (videoStates[video.id]?.summary) return;

    // Generate Summary
    setGeneratingSummaryId(video.id);
    try {
      // 1. Fetch Transcript
      const response = await fetch(`/.netlify/functions/get-transcript?videoId=${video.id}`);
      if (!response.ok) throw new Error('Failed to fetch transcript');
      const { transcript } = await response.json();
      
      if (!transcript) throw new Error('No transcript available');

      // 2. Generate Summary
      const aiSummary = await generateSummaryService(transcript, aiApiKey);

      // 3. Update State & DB
      updateVideoState(video.id, { summary: aiSummary });

    } catch (err) {
      console.error("Error generating summary from listing:", err);
      // Optionally show error in modal or toast
      // For now, we might want to close the modal if it failed, or show error state in modal
      // But SummaryModal currently only shows loading or content.
      // Let's just log it for now.
    } finally {
      setGeneratingSummaryId(null);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-gray-300 font-sans transition-colors duration-200">
      {/* Left Column: Past 7 Days */}
      <div className="w-1/3 h-full">
        <VideoColumn 
          title="Past 7 Days & Saved" 
          videos={pastVideos} 
          emptyMessage="No recent videos"
          loading={loading}
          showBin={false}
          showSaved={true}
          searchQuery={searchQuery} // Pass for highlighting if we want, or just to trigger updates
          {...commonProps}
        />
      </div>

      {/* Middle Column: Today */}
      <div className="w-1/3 h-full border-l border-gray-800">
        <VideoColumn 
          title="Today" 
          videos={todayVideos} 
          emptyMessage="No videos today"
          loading={loading}
          showBin={true}
          showSaved={false}
          searchQuery={searchQuery}
          {...commonProps}
        />
      </div>

      {/* Right Column: Explorer */}
      <div className="w-1/3 h-full">
        <SettingsPanel 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
          aiApiKey={aiApiKey}
          setAiApiKey={setAiApiKey}
          channels={channels} 
          onAddChannel={addChannel} 
          onRemoveChannel={removeChannel} 
          onToggleSolo={toggleChannelSolo}
          onClearSolo={clearSolo}
          soloChannelIds={soloChannelIds}
          categories={categories}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          updateChannelCategory={updateChannelCategory}
          onAddVideoByLink={addVideoByLink}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          soloCategoryIds={soloCategoryIds}
          onToggleCategorySolo={toggleCategorySolo}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </div>


      <AnimatePresence>
        {selectedVideo && (
          <VideoModal 
            key="video-modal"
            video={selectedVideo} 
            onClose={() => setSelectedVideo(null)} 
            apiKey={apiKey}
            aiApiKey={aiApiKey}
            state={videoStates[selectedVideo.id] || {}}
            onToggleSeen={toggleSeen}
            onToggleSaved={toggleSaved}
            onDelete={deleteVideo}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingSummaryVideo && (
          <SummaryModal
            key="summary-modal"
            video={viewingSummaryVideo}
            summary={videoStates[viewingSummaryVideo.id]?.summary}
            loading={generatingSummaryId === viewingSummaryVideo.id}
            onClose={() => setViewingSummaryVideo(null)}
            onWatch={() => {
              setViewingSummaryVideo(null);
              setSelectedVideo(viewingSummaryVideo);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfig.isOpen && (
          <ConfirmationModal 
            key="confirmation-modal"
            isOpen={modalConfig.isOpen}
            onClose={closeModal}
            {...modalConfig}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            apiKey={apiKey}
            setApiKey={setApiKey}
            aiApiKey={aiApiKey}
            setAiApiKey={setAiApiKey}
            onAddVideoByLink={addVideoByLink}
            onAddChannel={addChannel}
            onAddCategory={addCategory}
          />
        )}
      </AnimatePresence>

      {/* Floating Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full shadow-lg transition-colors border border-gray-700"
        title="System Settings"
      >
        <Settings className="w-6 h-6" />
      </button>
    </div>
  );
}

export default App;
