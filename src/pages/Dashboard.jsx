import React, { useState, useEffect, useMemo, useRef } from 'react';
import { isToday, isWithinInterval, subDays, parseISO } from 'date-fns';
import VideoColumn from '../components/VideoColumn';
import SettingsPanel from '../components/SettingsPanel';
import { fetchChannelDetails, fetchVideos, fetchVideoDetails } from '../services/youtube';
import { supabase } from '../services/supabase';
import { generateSummary as generateSummaryService } from '../services/ai';
import VideoModal from '../components/VideoModal';
import SummaryModal from '../components/SummaryModal';
import OnboardingModal from '../components/OnboardingModal';
import HelpModal from '../components/HelpModal';

import ConfirmationModal from '../components/ConfirmationModal';
// import SettingsModal from '../components/SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';

function Dashboard() {
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [user, setUser] = useState(null);

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

  // Supabase Auth and Data Fetching
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchData(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchData(session.user.id);
      } else {
        setChannels([]);
        setCategories([]);
        setVideoStates({});
      }
    });

    return () => subscription.unsubscribe();
  }, []);



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
  const fetchData = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    console.log('Dashboard: fetchData started');
    
    // Fetch Categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (categoriesError) console.error('Error fetching categories:', categoriesError);
    if (categoriesData) setCategories(categoriesData);

    // Fetch Channels
    const { data: channelsData, error: channelsError } = await supabase
      .from('channels')
      .select('*, cached_videos, last_synced_at'); // Explicitly select cache columns
      
    if (channelsError) console.error('Error fetching channels:', channelsError);
    if (channelsData) {
      // Map DB snake_case to frontend camelCase
      const mappedChannels = channelsData.map(c => ({
        ...c,
        categoryId: c.category_id,
        uploadsPlaylistId: c.uploads_playlist_id,
        cachedVideos: c.cached_videos || [],
        lastSyncedAt: c.last_synced_at
      }));
      setChannels(mappedChannels);

      // Hydrate videos from Cache (Supabase) if not in LocalStorage
      const localCache = localStorage.getItem('bt_videos_cache');
      if (localCache) {
        setVideos(JSON.parse(localCache));
      } else {
        const allCached = mappedChannels.flatMap(c => c.cachedVideos);
        if (allCached.length > 0) {
          const sorted = allCached.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
          setVideos(sorted);
          localStorage.setItem('bt_videos_cache', JSON.stringify(sorted));
        }
      }
    }

    // Fetch Video Metadata
    const { data: videoData, error: videoMetadataError } = await supabase
      .from('video_metadata')
      .select('*');
      
    if (videoMetadataError) console.error('Error fetching video metadata:', videoMetadataError);
    if (videoData) {
      const states = videoData.reduce((acc, item) => {
        acc[item.video_id] = { 
          seen: item.seen, 
          saved: item.saved, 
          deleted: item.deleted, 
          summary: item.summary,
          customTitle: item.custom_title,
          lastUpdated: new Date(item.last_updated).getTime() 
        };
        return acc;
      }, {});
      setVideoStates(states);
    }
    
    setLoading(false);
    console.log('Dashboard: fetchData finished', { categories: categoriesData?.length, channels: channelsData?.length });

    // Check for onboarding condition
    if (channelsData && channelsData.length === 0) {
        // Check if we've already shown it this session
        const hasShownSession = sessionStorage.getItem('hasShownOnboarding');
        if (!hasShownSession) {
            setShowOnboarding(true);
            sessionStorage.setItem('hasShownOnboarding', 'true');
        }
    }
  };

  const isSyncingRef = useRef(false);

  // Fetch Data (Smart Sync)
  useEffect(() => {
    if (!YOUTUBE_API_KEY || channels.length === 0) return;

    const syncStaleChannels = async () => {
      // Prevent concurrent syncs
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        // Don't start sync if quota error is already active
        if (quotaError) return;

        // Strict Hourly Sync: Max 1 sync per hour slot
        // We check if the lastSyncedAt timestamp falls within the CURRENT hour's window.
        // e.g. If now is 10:45, the window is 10:00:00 - 10:59:59.
        // If last sync was at 09:55, it's outside the window -> SYNC.
        // If last sync was at 10:05, it's inside the window -> SKIP.
        
        const now = new Date();
        const currentHourStart = new Date(now);
        currentHourStart.setMinutes(0, 0, 0); // Reset to start of the hour
        const currentHourStartMs = currentHourStart.getTime();

        const activeChannels = channels.filter(c => c.visible !== false);
        
        let updatedAny = false;
        let runningVideos = [...videos];

        for (const channel of activeChannels) {
          const lastSynced = channel.lastSyncedAt ? new Date(channel.lastSyncedAt).getTime() : 0;
          
          // Check if lastSynced is BEFORE the start of the current hour
          // AND if we haven't already hit quota error
          const isStale = lastSynced < currentHourStartMs;
          
          if ((isStale || channel.cachedVideos.length === 0) && !quotaError) {
            console.log(`Syncing stale channel: ${channel.name}`);
            try {
              setLoading(true);
              const latestVideos = await fetchVideos(
                YOUTUBE_API_KEY, 
                channel.uploads_playlist_id || channel.uploadsPlaylistId,
                channel.cachedVideos
              );
              
              // Merge with existing cache for this channel
              const latestIds = new Set(latestVideos.map(v => v.id));
              const mergedChannelVideos = [
                ...latestVideos, 
                ...channel.cachedVideos.filter(v => !latestIds.has(v.id))
              ];

              // Update Supabase Cache
              await supabase.from('channels').update({
                cached_videos: mergedChannelVideos,
                last_synced_at: new Date().toISOString()
              }).eq('id', channel.id);

              // Update running main videos list (the global state)
              const others = runningVideos.filter(v => v.channelId !== channel.id);
              runningVideos = [...others, ...mergedChannelVideos].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
              
              setVideos(runningVideos);
              localStorage.setItem('bt_videos_cache', JSON.stringify(runningVideos));
              
              // Also update the channel state itself so subsequent iterations have the new cache
              setChannels(prev => prev.map(c => c.id === channel.id ? { 
                ...c, 
                cachedVideos: mergedChannelVideos, 
                lastSyncedAt: new Date().toISOString() 
              } : c));

              updatedAny = true;
            } catch (error) {
              console.error(`Error syncing channel ${channel.name}:`, error);
              if (error.message === 'DAILY_QUOTA_EXCEEDED') {
                 setQuotaError(true);
                 break; 
              }
            }
          }
        }

        if (updatedAny) {
          setQuotaError(false);
        }
        setLoading(false);

      } finally {
        isSyncingRef.current = false;
      }
    };

    syncStaleChannels();
    // Check for staleness every hour
    const interval = setInterval(syncStaleChannels, 1000 * 60 * 60); 
    return () => clearInterval(interval);
  }, [YOUTUBE_API_KEY, channels, quotaError]);

  const addChannel = async (channelIdOrUrl) => {
    if (!YOUTUBE_API_KEY) return;
    
    let channelId = channelIdOrUrl;
    
    // Handle URL input
    if (channelIdOrUrl.includes('youtube.com') || channelIdOrUrl.includes('youtu.be')) {
      // ... (URL parsing logic remains same, but we need to fetch details first)
      // For simplicity, let's assume we fetch details inside fetchChannelDetails
    }

    try {
      const details = await fetchChannelDetails(YOUTUBE_API_KEY, channelId);
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
        category_id: null,
        user_id: user.id,
        cached_videos: [], // Initialize cache
        last_synced_at: null
      };

      const { error } = await supabase.from('channels').insert([newChannel]);
      if (error) throw error;

      // Immediately fetch videos for the new channel to seed the cache
      const initialVideos = await fetchVideos(YOUTUBE_API_KEY, newChannel.uploads_playlist_id);
      await supabase.from('channels').update({
        cached_videos: initialVideos,
        last_synced_at: new Date().toISOString()
      }).eq('id', newChannel.id);

      // Update state
      setChannels(prev => [...prev, { 
        ...newChannel, 
        categoryId: newChannel.category_id,
        cachedVideos: initialVideos,
        lastSyncedAt: new Date().toISOString()
      }]); 

      const updatedAllVideos = [...videos, ...initialVideos].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      setVideos(updatedAllVideos);
      localStorage.setItem('bt_videos_cache', JSON.stringify(updatedAllVideos));

    } catch (error) {
      console.error("Error adding channel:", error);
      showAlert('Error', `Could not add channel: ${error.message || error.error_description || "Unknown error"}`);
    }
  };

  const addVideoByLink = async (url, onDuplicate) => {
    if (!YOUTUBE_API_KEY) return;
    
    try {
      // 1. Fetch Video Details
      const videoDetails = await fetchVideoDetails(YOUTUBE_API_KEY, url);
      
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
      const channelExists = channels.find(c => c.id === videoDetails.channelId);
      
      if (!channelExists) {
        // Add Channel
        const channelDetails = await fetchChannelDetails(YOUTUBE_API_KEY, videoDetails.channelId);
        const newChannel = {
          id: channelDetails.id,
          name: channelDetails.name,
          thumbnail: channelDetails.thumbnail,
          uploads_playlist_id: channelDetails.uploadsPlaylistId,
          visible: true,
          category_id: null,
          user_id: user.id,
          cached_videos: [],
          last_synced_at: null
        };

        const { error } = await supabase.from('channels').insert([newChannel]);
        if (error) throw error;
        
        // Seed new channel cache
        const initialVideos = await fetchVideos(YOUTUBE_API_KEY, newChannel.uploads_playlist_id);
        await supabase.from('channels').update({
           cached_videos: initialVideos,
           last_synced_at: new Date().toISOString()
        }).eq('id', newChannel.id);

        setChannels(prev => [...prev, { 
          ...newChannel, 
          categoryId: null,
          cachedVideos: initialVideos,
          lastSyncedAt: new Date().toISOString()
        }]);

        const merged = [...videos, ...initialVideos].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setVideos(merged);
        localStorage.setItem('bt_videos_cache', JSON.stringify(merged));
      }

      // 4. Save Video state (Saved: true)
      await updateVideoState(videoDetails.id, { saved: true });
      
      // Ensure the specifically added video is in the main list
      setVideos(prev => {
        if (prev.some(v => v.id === videoDetails.id)) return prev;
        const updated = [...prev, videoDetails].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        localStorage.setItem('bt_videos_cache', JSON.stringify(updated));
        return updated;
      });

      showConfirm({
        title: 'Success',
        message: `Video "${videoDetails.title}" added and saved! ${!channelExists ? `Channel "${videoDetails.channelTitle}" was also added to your list.` : ''}`,
        confirmText: 'Watch Now',
        cancelText: 'OK',
        onConfirm: () => setSelectedVideo(videoDetails)
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
    const { data, error } = await supabase.from('categories').insert([{ name, user_id: user.id }]).select();
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
      custom_title: newState.customTitle,
      last_updated: new Date().toISOString(),
      user_id: user.id
    });

    if (error) console.error("Error updating video state:", error);
  };

  const updateTitle = (videoId, newTitle) => {
    updateVideoState(videoId, { customTitle: newTitle });
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
        // Special handling for Saved Category
        if (soloCategoryIds.includes('saved-category')) {
            if (videoStates[v.id]?.saved) return true;
        }

        const channel = channels.find(c => c.id === v.channelId);
        const isChannelSolo = soloChannelIds.includes(v.channelId);
        const isCategorySolo = channel && channel.categoryId && soloCategoryIds.includes(channel.categoryId);
        
        // If we are filtering by Saved, we might want to ONLY show saved, or show saved AND other soloed things.
        // The current logic is OR, so it will show if it matches ANY solo condition.
        return isChannelSolo || isCategorySolo || (soloCategoryIds.includes('saved-category') && videoStates[v.id]?.saved);
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

    // Override title with customTitle if it exists and is saved
    filtered = filtered.map(v => {
      if (videoStates[v.id]?.customTitle) {
        return { ...v, title: videoStates[v.id].customTitle, originalTitle: v.title };
      }
      return v;
    });

    return filtered;
  }, [videos, soloChannelIds, soloCategoryIds, searchQuery, channels, videoStates]); // Added videoStates dependency

  const todayVideos = activeVideos.filter(v => {
    // If Saved category is active, we might want to show saved videos here too if they are from today?
    // Or maybe just let them flow naturally.
    // The previous logic excluded saved videos from Today if they were saved.
    // "return isToday(parseISO(v.publishedAt)) && !isSaved;"
    // Now that Saved is a category, maybe we don't need to hide them from Today?
    // But the user said "Saved videos can live anywhere".
    // Let's keep the exclusion for now to avoid duplicates if they are shown in a "Saved" column, 
    // BUT wait, we removed the Saved column section.
    // So they MUST appear in the main lists if they are to be seen.
    // If 'saved-category' is soloed, 'activeVideos' ONLY contains saved videos (and other soloed stuff).
    // So they will appear in Today or Past based on date.
    
    // However, if we are NOT soloing Saved, they should just appear in their respective columns.
    // The original logic hid them from Today if saved.
    // "Saved videos can live anywhere" implies they should just be treated as normal videos that happen to be saved.
    // So I will REMOVE the "!isSaved" check.
    return isToday(parseISO(v.publishedAt));
  });
  
  const pastVideos = activeVideos.filter(v => {
    const date = parseISO(v.publishedAt);
    // Same here, remove special handling for saved videos
    return !isToday(date) && isWithinInterval(date, { start: sevenDaysAgo, end: today });
  });

  const commonProps = {
    videoStates,
    onToggleSeen: toggleSeen,
    onToggleSaved: toggleSaved,
    onDelete: deleteVideo,
    categories,
    channels,
    onVideoClick: (video) => setSelectedVideo(video),
    onViewSummary: (video) => handleViewSummary(video),
    onUpdateTitle: updateTitle
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Transcript fetch failed:', errorData);
        throw new Error(errorData.details || 'Failed to fetch transcript');
      }
      const { transcript } = await response.json();
      
      if (!transcript) throw new Error('No transcript available');

      // 2. Generate Summary
      const aiSummary = await generateSummaryService(transcript, GROQ_API_KEY);

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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-gray-300 font-sans transition-colors duration-200">
      {/* Quota Error Banner */}
      {quotaError && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 p-3 text-center text-sm font-medium animate-in fade-in slide-in-from-top duration-500">
          ⚠️ YouTube API Quota Exceeded. Videos will refresh automatically once the limit resets (usually at Midnight Pacific Time).
        </div>
      )}

      <div className="flex h-full w-full overflow-hidden">
        {/* Left Column: Explorer (Collapsible) */}
        <div className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} h-full border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex-shrink-0`}>
        <SettingsPanel 
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
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main Content Area (Expands to fill space) */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#09090b]">
        {/* Main Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Feed</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Force sync by clearing timestamps in local state
                setChannels(prev => prev.map(c => ({ ...c, lastSyncedAt: 0 })));
              }}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700 disabled:opacity-50"
              title="Force check for new videos"
            >
              <div className={loading ? "animate-spin" : ""}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              {loading ? 'Refreshing...' : 'Refresh Feed'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Middle Column: Today */}
          <div className="flex-1 h-full border-r border-gray-200 dark:border-gray-800 min-w-0">
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

          {/* Right Column: Past 7 Days */}
          <div className="flex-1 h-full min-w-0">
            <VideoColumn 
              title="Past 7 Days" 
              videos={pastVideos} 
              emptyMessage="No recent videos"
              loading={loading}
              showBin={false}
              showSaved={false} // Changed to false
              searchQuery={searchQuery} // Pass for highlighting if we want, or just to trigger updates
              {...commonProps}
            />
          </div>
        </div>
      </div>
    </div>

      <AnimatePresence>
        {selectedVideo && (
          <VideoModal 
            key="video-modal"
            video={selectedVideo} 
            onClose={() => setSelectedVideo(null)} 
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

      {/* <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onAddVideoByLink={addVideoByLink}
            onAddChannel={addChannel}
            onAddCategory={addCategory}
          />
        )}
      </AnimatePresence> */}

      <AnimatePresence>
        {showOnboarding && (
            <OnboardingModal 
                isOpen={showOnboarding} 
                onClose={() => setShowOnboarding(false)} 
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHelpOpen && (
            <HelpModal 
                isOpen={isHelpOpen} 
                onClose={() => setIsHelpOpen(false)} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
