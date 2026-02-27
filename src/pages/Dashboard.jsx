import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { isToday, isWithinInterval, subDays, parseISO } from 'date-fns';
import { parseDurationToSeconds } from '../utils/formatters';
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
import SettingsModal from '../components/SettingsModal';
import { AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { getQuota } from '../services/quota';

function Dashboard() {
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('bt_api_keys');
    if (saved) return JSON.parse(saved);
    return {
      youtube: import.meta.env.VITE_YOUTUBE_API_KEY || '',
      groq: import.meta.env.VITE_GROQ_API_KEY || ''
    };
  });

  const YOUTUBE_API_KEY = apiKeys.youtube;
  const GROQ_API_KEY = apiKeys.groq;

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [channels, setChannels] = useState([]);
  const [videoStates, setVideoStates] = useState({});
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [viewingSummaryVideo, setViewingSummaryVideo] = useState(null);
  const [generatingSummaryId, setGeneratingSummaryId] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [soloChannelIds, setSoloChannelIds] = useState([]);
  const [soloCategoryIds, setSoloCategoryIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [user, setUser] = useState(null);
  const [quotaStats, setQuotaStats] = useState({ youtube: 0, groq: 0 });
  const [isSavedColumnOpen, setIsSavedColumnOpen] = useState(false);
  const [filterDuration, setFilterDuration] = useState('ALL'); // 'ALL', 'SHORT', 'LONG'

  useEffect(() => {
    // Initial load
    setQuotaStats(getQuota());

    // Listen for updates
    const handleQuotaUpdate = () => {
      setQuotaStats(getQuota());
    };

    window.addEventListener('quota-updated', handleQuotaUpdate);
    return () => window.removeEventListener('quota-updated', handleQuotaUpdate);
  }, []);

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

  const saveSettings = (newKeys) => {
    setApiKeys(newKeys);
    localStorage.setItem('bt_api_keys', JSON.stringify(newKeys));
  };

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

  const syncStaleChannels = useCallback(async () => {
    if (!YOUTUBE_API_KEY || channels.length === 0) return;
    // Prevent concurrent syncs
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // Don't start sync if quota error is already active
      if (quotaError) return;

      const now = new Date();
      const currentHourStart = new Date(now);
      currentHourStart.setMinutes(0, 0, 0); // Reset to start of the hour
      const currentHourStartMs = currentHourStart.getTime();

      const activeChannels = channels.filter(c => c.visible !== false);
      
      let updatedAny = false;
      let runningVideos = [...videos];

      for (const channel of activeChannels) {
        const lastSynced = channel.lastSyncedAt ? new Date(channel.lastSyncedAt).getTime() : 0;
        const isStale = lastSynced < currentHourStartMs;
        
        if ((isStale || channel.cachedVideos.length === 0) && !quotaError) {
          try {
            setLoading(true);
            const latestVideos = await fetchVideos(
              YOUTUBE_API_KEY, 
              channel.uploads_playlist_id || channel.uploadsPlaylistId,
              channel.cachedVideos
            );
            
            const latestIds = new Set(latestVideos.map(v => v.id));
            const mergedChannelVideos = [
              ...latestVideos, 
              ...channel.cachedVideos.filter(v => !latestIds.has(v.id))
            ];

            await supabase.from('channels').update({
              cached_videos: mergedChannelVideos,
              last_synced_at: new Date().toISOString()
            }).eq('id', channel.id);

            const others = runningVideos.filter(v => v.channelId !== channel.id);
            runningVideos = [...others, ...mergedChannelVideos].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            
            setVideos(runningVideos);
            localStorage.setItem('bt_videos_cache', JSON.stringify(runningVideos));
            
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
  }, [YOUTUBE_API_KEY, channels, quotaError, videos]);

  // Fetch Data (Smart Sync)
  useEffect(() => {

    syncStaleChannels();
    // Check for staleness every hour
    const interval = setInterval(syncStaleChannels, 1000 * 60 * 60); 
    return () => clearInterval(interval);
  }, [YOUTUBE_API_KEY, channels, quotaError, videos, syncStaleChannels]);

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
      
      // Also remove the videos belonging to this channel from active state and local cache
      setVideos(prev => {
        const filteredVideos = prev.filter(v => v.channelId !== id);
        localStorage.setItem('bt_videos_cache', JSON.stringify(filteredVideos));
        return filteredVideos;
      });
    } else {
      console.error("Error removing channel:", error);
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
      notes: newState.notes,
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
      // Check for notes before unsaving
      const hasNotes = videoStates[videoId]?.notes && videoStates[videoId]?.notes.trim().length > 0;

      if (hasNotes) {
          showConfirm({
             title: "Unsave Video with Notes",
             message: "This video has personal notes. If you unsave it, the notes might be lost or hidden. Are you sure?",
             confirmText: "Unsave & Risk Notes",
             type: "danger",
             onConfirm: () => proceedUnsave(videoId)
          });
          return; 
      }
      
      proceedUnsave(videoId);
    } else {
        // Saving
        updateVideoState(videoId, { saved: !isCurrentlySaved });
        setIsSavedColumnOpen(true);
    }
  };

  const proceedUnsave = (videoId) => {
      const video = videos.find(v => v.id === videoId);
      if (video) {
        const publishedAt = parseISO(video.publishedAt);
        const cutoffDate = subDays(new Date(), 7);
        
        if (publishedAt < cutoffDate) {
           showConfirm({
             title: "Unsave Video",
             message: "This video is older than 7 days. If you unsave it, it will be removed from your list permanently. Are you sure?",
             confirmText: "Unsave",
             type: "danger",
             onConfirm: () => updateVideoState(videoId, { saved: false })
           });
        } else {
            updateVideoState(videoId, { saved: false });
        }
      }
  };
  const deleteVideo = (videoId) => {
    updateVideoState(videoId, { deleted: !videoStates[videoId]?.deleted });
  };

  // Filtering & Stats
  const { today, sevenDaysAgo } = useMemo(() => {
    const now = new Date();
    return {
      today: now,
      sevenDaysAgo: subDays(now, 7)
    };
  }, []); // Only once per mount, or could be on a timer

  // Calculate Channel Stats (Memorized)
  const channelStats = useMemo(() => {
    const stats = {};
    videos.forEach(v => {
        if (!stats[v.channelId]) stats[v.channelId] = { today: 0, week: 0 };
        
        // Check if unseen/active? Or just published? Assuming "active/unseen" videos in columns
        // User said: "how many videos are in the TODAY and PAST 7 DAYS column"
        // Those columns filter by !seen usually. Let's count UNSEEN videos.
        if (!videoStates[v.id]?.seen && !videoStates[v.id]?.deleted) {
             if (isToday(parseISO(v.publishedAt))) {
                 stats[v.channelId].today++;
             } else if (isWithinInterval(parseISO(v.publishedAt), { start: sevenDaysAgo, end: today })) {
                 stats[v.channelId].week++;
             }
        }
    });
    return stats;
  }, [videos, videoStates, sevenDaysAgo, today]);

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

    // 3. Duration Filter
    if (filterDuration !== 'ALL') {
        filtered = filtered.filter(v => {
            const seconds = parseDurationToSeconds(v.duration);
            if (filterDuration === 'SHORT') return seconds <= 180;
            if (filterDuration === 'LONG') return seconds > 180;
            return true;
        });
    }

    // Override title with customTitle if it exists and is saved
    filtered = filtered.map(v => {
      if (videoStates[v.id]?.customTitle) {
        return { ...v, title: videoStates[v.id].customTitle, originalTitle: v.title };
      }
      return v;
    });

    return filtered;
  }, [videos, soloChannelIds, soloCategoryIds, searchQuery, channels, videoStates, filterDuration]); // Added videoStates dependency

  const todayVideos = activeVideos.filter(v => {
    // Exclude saved videos to "move" them to the Saved Column
    if (videoStates[v.id]?.saved) return false;
    return isToday(parseISO(v.publishedAt));
  });
  
  const pastVideos = activeVideos.filter(v => {
    // Exclude saved videos
    if (videoStates[v.id]?.saved) return false;
    const date = parseISO(v.publishedAt);
    return !isToday(date) && isWithinInterval(date, { start: sevenDaysAgo, end: today });
  });

  const savedVideosCount = useMemo(() => {
    return activeVideos.filter(v => videoStates[v.id]?.saved && !videoStates[v.id]?.deleted).length;
  }, [activeVideos, videoStates]);

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
    setSummaryError(null);

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
      setSummaryError(err.message || "Failed to generate summary");
    } finally {
      setGeneratingSummaryId(null);
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  const toggleCategoryCollapse = (categoryId) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
          collapsedCategories={collapsedCategories}
          toggleCategoryCollapse={toggleCategoryCollapse}
          user={user}
          onSignOut={handleSignOut}
          isSavedViewOpen={isSavedColumnOpen}
          onToggleSavedView={() => setIsSavedColumnOpen(!isSavedColumnOpen)}
          channelStats={channelStats}
          filterDuration={filterDuration}
          setFilterDuration={setFilterDuration}
          YOUTUBE_API_KEY={YOUTUBE_API_KEY}
          onRefreshFeed={syncStaleChannels}
          loading={loading}
          quotaStats={quotaStats}
          savedVideosCount={savedVideosCount}
        />
      </div>

        {/* Main Content Area (Expands to fill space) */}
      <div className={`flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#09090b] transition-all duration-300`}>

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

          {/* Saved Column (Conditional) */}
          {isSavedColumnOpen && (
            <div className="flex-1 h-full min-w-0 border-l border-gray-200 dark:border-gray-800">
               <VideoColumn 
                title="Saved Videos" 
                videos={activeVideos.filter(v => videoStates[v.id]?.saved)} 
                emptyMessage="No saved videos"
                loading={loading}
                showBin={false}
                showSaved={false} // Set to false so they render as main videos with correct counts
                searchQuery={searchQuery}
                {...commonProps}
              />
            </div>
          )}
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
            onUpdateNotes={(note) => updateVideoState(selectedVideo.id, { notes: note })}
            onNext={() => {
              const idx = activeVideos.findIndex(v => v.id === selectedVideo.id);
              if (idx < activeVideos.length - 1) setSelectedVideo(activeVideos[idx + 1]);
            }}
            onPrev={() => {
              const idx = activeVideos.findIndex(v => v.id === selectedVideo.id);
              if (idx > 0) setSelectedVideo(activeVideos[idx - 1]);
            }}
            hasNext={activeVideos.findIndex(v => v.id === selectedVideo.id) < activeVideos.length - 1}
            hasPrev={activeVideos.findIndex(v => v.id === selectedVideo.id) > 0}
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
            error={summaryError}
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
            initialKeys={apiKeys}
            onSave={saveSettings}
            user={user}
            onSignOut={handleSignOut}
          />
        )}
      </AnimatePresence>

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
