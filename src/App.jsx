import React, { useState, useEffect, useMemo } from 'react';
import { isToday, isWithinInterval, subDays, parseISO } from 'date-fns';
import VideoColumn from './components/VideoColumn';
import SettingsPanel from './components/SettingsPanel';
import { fetchChannelDetails, fetchVideos } from './services/youtube';
import { supabase } from './services/supabase';
import VideoModal from './components/VideoModal';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('yt_curator_api_key') || import.meta.env.VITE_YOUTUBE_API_KEY || '');
  const [channels, setChannels] = useState([]);
  const [videoStates, setVideoStates] = useState({});
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [categories, setCategories] = useState([]);
  const [soloChannelIds, setSoloChannelIds] = useState([]);

  // Persistence for API Key
  useEffect(() => {
    localStorage.setItem('yt_curator_api_key', apiKey);
  }, [apiKey]);

  // Supabase Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Categories
      const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('*').order('name');
      if (categoriesError) console.error('Error fetching categories:', categoriesError);
      if (categoriesData) setCategories(categoriesData);

      // Fetch Channels
      const { data: channelsData, error: channelsError } = await supabase.from('channels').select('*');
      if (channelsError) console.error('Error fetching channels:', channelsError);
      if (channelsData) setChannels(channelsData);

      // Fetch Video Metadata
      const { data: videoData, error: videoMetadataError } = await supabase.from('video_metadata').select('*');
      if (videoMetadataError) console.error('Error fetching video metadata:', videoMetadataError);
      if (videoData) {
        const states = videoData.reduce((acc, item) => {
          acc[item.video_id] = { 
            seen: item.seen, 
            saved: item.saved, 
            deleted: item.deleted, 
            lastUpdated: new Date(item.last_updated).getTime() 
          };
          return acc;
        }, {});
        setVideoStates(states);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Fetch Data
  useEffect(() => {
    if (!apiKey || channels.length === 0) return;

    const fetchAllVideos = async () => {
      setLoading(true);
      try {
        // If solo mode is active (any channel soloed), only fetch/show those.
        // Actually, we should probably fetch ALL videos but filter them in the UI?
        // No, fetching is expensive. But if we change solo mode, we don't want to refetch.
        // Better: Fetch from ALL channels (that are not "deleted" - wait, we removed visible property usage for hiding).
        // User said "The eye... should be... SOLO".
        // If I use `visible` property in DB for "Archived", then I should filter by `visible` here.
        // But for "Solo", it's a UI filter.
        // Let's assume `visible` in DB means "Monitored/Active".
        // So we fetch all `visible` channels.
        // Solo logic applies to *displayed* videos.
        
        const activeChannels = channels.filter(c => c.visible !== false); // Default to true if undefined
        const promises = activeChannels.map(channel => fetchVideos(apiKey, channel.uploads_playlist_id || channel.uploadsPlaylistId));
        const results = await Promise.all(promises);
        const allVideos = results.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setVideos(allVideos);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
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
        alert('Channel already added!');
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
      alert(`Could not add channel: ${error.message || error.error_description || "Unknown error"}`);
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

  const clearSolo = () => setSoloChannelIds([]);

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
      last_updated: new Date().toISOString()
    });

    if (error) console.error("Error updating video state:", error);
  };

  const toggleSeen = (videoId) => {
    updateVideoState(videoId, { seen: !videoStates[videoId]?.seen });
  };

  const toggleSaved = (videoId) => {
    updateVideoState(videoId, { saved: !videoStates[videoId]?.saved });
  };

  const deleteVideo = (videoId) => {
    updateVideoState(videoId, { deleted: !videoStates[videoId]?.deleted });
  };

  // Filtering
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  // Pass ALL videos to columns, let them handle filtering/grouping
  // Filter videos based on Solo mode
  const activeVideos = useMemo(() => {
    if (soloChannelIds.length === 0) return videos;
    return videos.filter(v => soloChannelIds.includes(v.channelId));
  }, [videos, soloChannelIds]);

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
    onVideoClick: (video) => setSelectedVideo(video)
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-gray-300 font-sans">
      {/* Left Column: Past 7 Days */}
      <div className="w-1/3 h-full">
        <VideoColumn 
          title="Past 7 Days & Saved" 
          videos={pastVideos} 
          emptyMessage={loading ? "Loading..." : "No recent videos"}
          {...commonProps}
        />
      </div>

      {/* Middle Column: Today */}
      <div className="w-1/3 h-full border-l border-gray-800">
        <VideoColumn 
          title="Today" 
          videos={todayVideos} 
          emptyMessage={loading ? "Loading..." : "No videos today"}
          {...commonProps}
        />
      </div>

      {/* Right Column: Settings */}
      <div className="w-1/3 h-full">
        <SettingsPanel 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
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
        />
      </div>
      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
          apiKey={apiKey}
        />
      )}
    </div>
  );
}

export default App;
