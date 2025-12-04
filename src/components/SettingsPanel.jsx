import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Eye, FolderDown, FolderUp, Folder, Search, Plus, Youtube, FolderPlus, X, Sun, Moon, User, Settings, LogOut, Brain, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const SettingsPanel = ({ 
  channels, onRemoveChannel, onToggleSolo, onClearSolo, soloChannelIds,


  searchQuery, onSearchChange,
  soloCategoryIds, onToggleCategorySolo,
  categories, onAddCategory, onDeleteCategory, updateChannelCategory,
  onAddVideoByLink, onAddChannel,
  theme, toggleTheme,
  onOpenSettings,
  onOpenHelp,
  isCollapsed,
  onToggleSidebar
}) => {
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'categories' or 'all'
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [activeAddMode, setActiveAddMode] = useState(null); // 'video', 'channel', 'category', null
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredChannel, setHoveredChannel] = useState(null); // { id, name, top, left }
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false); // For compressed view dropdown
  const [addMenuPos, setAddMenuPos] = useState({ top: 0, left: 0 });
  const searchInputRef = React.useRef(null);
  const addBtnRef = React.useRef(null);
  const toggleBtnRef = React.useRef(null);
  
  // Clear active add mode and focus toggle when collapsing
  useEffect(() => {
    if (isCollapsed) {
      setActiveAddMode(null);
      if (toggleBtnRef.current) {
        toggleBtnRef.current.focus();
      }
    }
  }, [isCollapsed]);
  
  // Form State
  const [newChannelId, setNewChannelId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!newChannelId.trim()) return;
    
    setIsAddingChannel(true);
    try {
      await onAddChannel(newChannelId);
      setNewChannelId('');
    } catch (error) {
      // Error handled by parent or alert
      console.error(error);
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName);
    setNewCategoryName('');
  };

  const toggleCategoryCollapse = (categoryId) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Group channels by category
  const groupedChannels = {
    uncategorized: channels.filter(c => !c.categoryId),
    ...categories.reduce((acc, cat) => ({
      ...acc,
      [cat.id]: channels.filter(c => c.categoryId === cat.id)
    }), {})
  };

  const CategoryPillSelector = ({ channel, categories, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentCategory = categories.find(c => c.id === channel.categoryId);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${
            currentCategory 
              ? 'bg-gray-100 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600' 
              : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          {currentCategory ? currentCategory.name : '+'}
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[10px] font-mono uppercase text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200"
              >
                No Category
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelect(cat.id);
                    onSelect(channel.id, cat.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[10px] font-mono uppercase hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 ${
                    channel.categoryId === cat.id ? 'text-teal-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };



  const renderChannelList = (channelsToRender) => {
    return channelsToRender.map(channel => (
      <div key={channel.id} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-3 group`}>
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="relative group/avatar cursor-pointer"
            onClick={() => onToggleSolo(channel.id)}
            onMouseEnter={(e) => {
                if (isCollapsed) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredChannel({
                        id: channel.id,
                        name: channel.name,
                        top: rect.top,
                        left: rect.right + 10 // 10px offset
                    });
                }
            }}
            onMouseLeave={() => setHoveredChannel(null)}
          >
            <div className={`w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0 border-2 transition-all duration-300 ${
                soloChannelIds.includes(channel.id) 
                    ? 'border-teal-500 dark:border-green-500 ring-2 ring-teal-500/30 dark:ring-green-500/30 shadow-[0_0_12px_rgba(20,184,166,0.4)] scale-110' 
                    : 'border-transparent opacity-100'
            } ${
                // Dim others if some are soloed
                (soloChannelIds.length > 0 && !soloChannelIds.includes(channel.id)) 
                    ? 'opacity-40 grayscale' 
                    : ''
            }`}>
              <img src={channel.thumbnail} alt={channel.name} className="w-full h-full object-cover" />
            </div>
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={channel.name}>
                {channel.name}
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CategoryPillSelector 
                channel={channel} 
                categories={categories} 
                onSelect={updateChannelCategory} 
            />
            <button
              onClick={() => onRemoveChannel(channel.id)}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Remove Channel"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 relative">
      {/* Fixed App Header */}
      <div className={`flex-none h-[88px] border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-10 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-gray-900 dark:bg-white p-1.5 rounded-lg flex-shrink-0">
            <Brain className="w-5 h-5 text-white dark:text-black" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white whitespace-nowrap">BrainTube</span>
          )}
        </div>
        
        {/* Sidebar Toggle Tab */}
        <button
            ref={toggleBtnRef}
            onClick={onToggleSidebar}
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-1 shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-50 transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
        >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto  custom-scrollbar">
        <div className='p-4 pt-4 pb-20'>
          {/* Global Search - Always Visible */}
          <div className="mb-4">
            {isCollapsed ? (
                <div className="flex justify-center">
                    <button 
                        onClick={() => {
                            onToggleSidebar();
                            // Use setTimeout to wait for the transition/render to complete before focusing
                            setTimeout(() => {
                                searchInputRef.current?.focus();
                            }, 100);
                        }} 
                        className="flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm hover:text-gray-700 dark:hover:text-gray-300 w-full"
                        title="Search"
                    >
                        <Search className="h-5 w-5" />
                    </button>
                </div>
            ) : (
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm font-medium"
                    placeholder="Search videos..."
                />
                {searchQuery && (
                    <button
                    onClick={() => onSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                    <X className="h-4 w-4" />
                    </button>
                )}
                </div>
            )}
          </div>

          {/* Add Content Section */}
          <div className="mb-4 border-gray-200 dark:border-gray-800 pb-4">
            {isCollapsed ? (
                <div className="relative">
                    <button
                        ref={addBtnRef}
                        onClick={() => {
                            if (!isAddMenuOpen && addBtnRef.current) {
                                const rect = addBtnRef.current.getBoundingClientRect();
                                setAddMenuPos({ top: rect.top, left: rect.right + 10 });
                            }
                            setIsAddMenuOpen(!isAddMenuOpen);
                        }}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm hover:text-gray-700 dark:hover:text-gray-300 w-full"
                        title="Add..."
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                    {isAddMenuOpen && createPortal(
                        <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setIsAddMenuOpen(false)} />
                            <div 
                                className="fixed z-[70] w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
                                style={{ top: addMenuPos.top, left: addMenuPos.left }}
                            >
                                <button
                                    onClick={() => {
                                        onToggleSidebar();
                                        setActiveAddMode('video');
                                        setIsAddMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-xs font-mono uppercase hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                    <Plus className="h-3 w-4" /> Video
                                </button>
                                <button
                                    onClick={() => {
                                        onToggleSidebar();
                                        setActiveAddMode('channel');
                                        setIsAddMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-xs font-mono uppercase hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                    <Youtube className="h-3 w-4" /> Channel
                                </button>
                                <button
                                    onClick={() => {
                                        onToggleSidebar();
                                        setActiveAddMode('category');
                                        setIsAddMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-xs font-mono uppercase hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                    <FolderPlus className="h-3 w-4" /> Category
                                </button>
                            </div>
                        </>,
                        document.body
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => setActiveAddMode(activeAddMode === 'video' ? null : 'video')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                    activeAddMode === 'video' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-md scale-[1.02]' 
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title="Add Video"
                >
                    <Plus className={`h-5 w-5 mb-1.5 transition-transform duration-200 ${activeAddMode === 'video' ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Video</span>
                </button>
                <button
                    onClick={() => setActiveAddMode(activeAddMode === 'channel' ? null : 'channel')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                    activeAddMode === 'channel' 
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-600 dark:text-purple-400 shadow-md scale-[1.02]' 
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title="Add Channel"
                >
                    <Youtube className={`h-5 w-5 mb-1.5 transition-transform duration-200 ${activeAddMode === 'channel' ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Channel</span>
                </button>
                <button
                    onClick={() => setActiveAddMode(activeAddMode === 'category' ? null : 'category')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                    activeAddMode === 'category' 
                        ? 'bg-teal-50 dark:bg-green-900/20 border-teal-500 dark:border-green-500 text-teal-600 dark:text-green-400 shadow-md scale-[1.02]' 
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title="Add Category"
                >
                    <FolderPlus className={`h-5 w-5 mb-1.5 transition-transform duration-200 ${activeAddMode === 'category' ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Category</span>
                </button>
                </div>
            )}

            <AnimatePresence mode="wait">
              {activeAddMode === 'video' && (
                <motion.div
                  key="video-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  // className="overflow-hidden"
                >
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const url = e.target.elements.videoUrl.value;
                    if (url.trim()) {
                      onAddVideoByLink(url, () => {
                          e.target.elements.videoUrl.focus();
                      });
                      e.target.elements.videoUrl.value = '';
                    }
                  }} className="flex gap-2 mb-4 mt-4">
                    <input
                      autoFocus
                      name="videoUrl"
                      type="text"
                      className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-[10px] focus:border-blue-500 outline-none px-2 py-1.5 font-mono transition-colors"
                      placeholder="Paste YouTube URL..."
                    />
                    <button
                      type="submit"
                      disabled={!YOUTUBE_API_KEY}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {activeAddMode === 'channel' && (
                <motion.div
                  key="channel-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  // className="overflow-hidden"
                >
                  <form onSubmit={handleAddChannel} className="flex gap-2 mb-4 mt-4">
                    <input
                      autoFocus
                      type="text"
                      value={newChannelId}
                      onChange={(e) => setNewChannelId(e.target.value)}
                      className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-[10px] focus:border-blue-500 outline-none px-2 py-1.5 font-mono transition-colors"
                      placeholder="Channel ID or Handle..."
                    />
                    <button
                      type="submit"
                      disabled={isAddingChannel || !YOUTUBE_API_KEY}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {activeAddMode === 'category' && (
                <motion.div
                  key="category-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  // className="overflow-hidden"
                >
                  <form onSubmit={handleAddCategory} className="flex gap-2 mb-4 mt-4">
                    <input
                      autoFocus
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-[10px] focus:border-blue-500 outline-none px-2 py-1.5 font-mono transition-colors"
                      placeholder="New Category Name..."
                    />
                    <button
                      type="submit"
                      disabled={!newCategoryName.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1">
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-' : 'justify-between'} mb-8`}>
              <div className="flex items-center gap-2">
                {!isCollapsed && (
                    <>
                        <label className="block text-xs font-mono text-gray-500 uppercase">Channels [{channels.length}]</label>
                    </>
                )}
              </div>
              <div className={`flex ${isCollapsed ? 'flex-col' : ''} gap-2`}>
                {(!isCollapsed && (soloChannelIds.length > 0 || soloCategoryIds.length > 0)) ? (
                  <button 
                    onClick={onClearSolo}
                    className="px-2 py-1 rounded text-[10px] font-mono uppercase text-red-400 hover:bg-red-100 border border-red-400 px-2 py-0.5 rounded transition-colors"
                  >
                    Clear Solo ({soloChannelIds.length + soloCategoryIds.length})
                  </button>
                ) : (
                  categories.length > 0 && (
                    <>
                        <button
                        onClick={() => setViewMode('all')}
                        className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-700 dark:hover:border-gray-300 ${
                            viewMode === 'all' 
                            ? 'bg-white dark:bg-gray-950 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100' 
                            : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title="All Channels View"
                        >
                        {isCollapsed ? <User className="w-3.5 h-3.5" /> : 'All'}
                        </button>
                        <button
                        onClick={() => setViewMode('categories')}
                        className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-700 dark:hover:border-gray-300 ${
                            viewMode === 'categories' 
                            ? 'bg-white dark:bg-gray-950 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100' 
                            : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title="Categories View"
                        >
                        {isCollapsed ? <Folder className="w-3.5 h-3.5" /> : 'Categories'}
                        </button>
                    </>
                  )
                )}
              </div>
            </div>
            
            {viewMode === 'all' ? (
              <div className="">
                {channels.length > 0 ? renderChannelList(channels) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-xs mb-3">No channels monitored</p>
                        <button
                            onClick={() => setActiveAddMode('channel')}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Plus className="w-3 h-3" /> {!isCollapsed && "Add a channel to start"}
                        </button>
                    </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Categories */}
                {categories.map(cat => {
                  const isCategoryCollapsed = collapsedCategories.has(cat.id);
                  
                  if (isCollapsed) {
                      // Compressed View: Just render channels with a spacer
                      return (
                          <div key={cat.id} className="mb-8">
                             {groupedChannels[cat.id]?.length > 0 && renderChannelList(groupedChannels[cat.id])}
                          </div>
                      );
                  }

                  // Expanded View: Render with header and collapse logic
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-3 group">
                        <button 
                          onClick={() => toggleCategoryCollapse(cat.id)}
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono text-xs uppercase tracking-wider hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                          {isCategoryCollapsed ? <FolderDown className="h-4 w-4" /> : <FolderUp className="h-4 w-4" />}
                          {cat.name}
                          <span className="text-gray-600">[{groupedChannels[cat.id]?.length || 0}]</span>
                        </button>
                        <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleCategorySolo(cat.id)}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${
                            soloCategoryIds.includes(cat.id) ? 'text-teal-600 dark:text-green-500' : 'text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                            }`}
                            title={soloCategoryIds.includes(cat.id) ? "Un-solo Category" : "Solo this Category"}
                        >
                            {soloCategoryIds.includes(cat.id) ? <Eye className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                            onClick={() => onDeleteCategory(cat.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {!isCategoryCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            // className="overflow-hidden"
                          >
                            {groupedChannels[cat.id]?.length > 0 ? (
                              renderChannelList(groupedChannels[cat.id])
                            ) : (
                              <div className="text-gray-700 text-xs italic pl-5">Empty category</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Uncategorized */}
                <div>
                  {isCollapsed ? (
                      // Compressed View: Just render channels
                      groupedChannels.uncategorized.length > 0 && (
                          <div className="mb-8">
                              {renderChannelList(groupedChannels.uncategorized)}
                          </div>
                      )
                  ) : (
                      // Expanded View
                      <>
                        <button 
                            onClick={() => toggleCategoryCollapse('uncategorized')}
                            className="flex items-center gap-2 mb-3 text-gray-600 dark:text-gray-400 font-mono text-xs uppercase tracking-wider hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                          >
                            
                            Uncategorized
                            <span className="text-gray-600">[{groupedChannels.uncategorized.length}]</span>
                        </button>
                        <AnimatePresence>
                            {!collapsedCategories.has('uncategorized') && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                // className="overflow-hidden"
                            >
                                {groupedChannels.uncategorized.length > 0 ? (
                                renderChannelList(groupedChannels.uncategorized)
                                ) : (
                                <div className="text-gray-700 text-xs italic pl-5">No uncategorized channels</div>
                                )}
                            </motion.div>
                            )}
                        </AnimatePresence>
                      </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear Solo Button at Bottom for Compressed View */}
          {isCollapsed && (soloChannelIds.length > 0 || soloCategoryIds.length > 0) && (
            <div className="flex justify-center mt-4">
                <button 
                    onClick={onClearSolo}
                    className="w-2 h-2 rounded-full bg-red-500 hover:bg-red-400"
                    title="Clear Solos"
                />
            </div>
          )}
        </div>
      </div>

      {/* Fixed User Profile Card at Bottom */}
      <div className={`flex-none p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-10 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-700 cursor-pointer" onClick={onToggleSidebar}>
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-gray-400" />
                )}
            </div>
        ) : (
            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-700 flex-shrink-0">
                {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                <User className="w-4 h-4 text-gray-400" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                {user?.user_metadata?.full_name || 'User'}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                {user?.app_metadata?.provider ? `Via ${user.app_metadata.provider}` : user?.email}
                </div>
            </div>
            
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none border ${
                theme === 'dark' ? 'border-gray-700 ' : 'border-gray-300 '
                }`}
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                <span
                className={`${
                    theme === 'dark' ? 'translate-x-4' : 'translate-x-1 '
                } bg-gray-500 inline-block h-3 w-4 transform rounded-full  transition-transform duration-200`}
                />
            </button>

            <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-2 ml-1">
                <button
                onClick={onOpenHelp}
                className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Help"
                >
                <HelpCircle className="w-3.5 h-3.5" />
                </button>
                {/* <button
                onClick={onOpenSettings}
                className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Settings"
                >
                <Settings className="w-3.5 h-3.5" />
                </button> */}
                <button
                onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/login');
                }}
                className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Sign Out"
                >
                <LogOut className="w-3.5 h-3.5" />
                </button>
            </div>
            </div>
        )}
      </div>

      {/* Fixed Tooltip Portal */}
      {hoveredChannel && createPortal(
        <div 
            className="fixed z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap"
            style={{ 
                top: hoveredChannel.top + 4, // Align slightly below top of avatar
                left: hoveredChannel.left 
            }}
        >
            {hoveredChannel.name}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SettingsPanel;
