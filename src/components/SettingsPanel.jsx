import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Eye, Folder, ChevronDown, Search, Plus, Youtube, FolderPlus, X, Sun, Moon, User } from 'lucide-react';

const SettingsPanel = ({ 
  channels, onRemoveChannel, onToggleSolo, onClearSolo, soloChannelIds,
  categories, onDeleteCategory, updateChannelCategory,

  searchQuery, onSearchChange,
  soloCategoryIds, onToggleCategorySolo,
  onAddVideoByLink, onAddChannel, onAddCategory, apiKey,
  theme, toggleTheme
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'all'
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [activeAddMode, setActiveAddMode] = useState(null); // 'video', 'channel', 'category', null
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
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
          className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors whitespace-nowrap bg-gray-950 border-gray-800 hover:border-gray-600 ${
            currentCategory ? 'text-gray-300' : 'text-gray-500'
          }`}
        >
          {currentCategory ? currentCategory.name : 'No Category'}
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-1 w-32 bg-gray-950 border border-gray-800 rounded shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[10px] font-mono uppercase text-gray-400 hover:bg-gray-800 hover:text-gray-200"
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
                  className={`w-full text-left px-3 py-1.5 text-[10px] font-mono uppercase hover:bg-gray-800 hover:text-gray-200 ${
                    channel.categoryId === cat.id ? 'text-green-400' : 'text-gray-400'
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

  const renderChannelList = (channelList) => (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {channelList.map((channel) => (
          <motion.div 
            key={channel.id} 
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800 group hover:border-gray-700"
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <img src={channel.thumbnail} alt={channel.name} className="w-6 h-6 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-mono truncate ${soloChannelIds.includes(channel.id) ? 'text-gray-300' : 'text-gray-500'}`}>
                  {channel.name}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CategoryPillSelector 
                channel={channel} 
                categories={categories} 
                onSelect={updateChannelCategory} 
              />
              <button
                onClick={() => onToggleSolo(channel.id)}
                className={`p-1 rounded hover:bg-gray-800 transition-colors ${
                  soloChannelIds.includes(channel.id) ? 'text-green-500' : 'text-gray-600 hover:text-gray-400'
                }`}
                title={soloChannelIds.includes(channel.id) ? "Un-solo" : "Solo this channel"}
              >
                {soloChannelIds.includes(channel.id) ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onRemoveChannel(channel.id)}
                className="p-1 text-gray-600 hover:text-red-400 rounded hover:bg-gray-800 transition-colors"
                title="Remove channel"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );



  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto border-l border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4 mb-4">
          <h2 className="text-lg font-bold text-green-600 dark:text-green-500 font-mono uppercase tracking-wider">
            Explorer
          </h2>
          <button
            onClick={toggleTheme}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* User Profile Card */}
        <div className="px-4 mb-6">
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-all group text-left shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email}
              </div>
            </div>
          </button>
        </div>
      <div className="p-4 pt-0 pb-20">

        {/* Global Search */}
      <div className="mb-6 h-8">
        <AnimatePresence mode="wait">
          {!isSearchOpen && !searchQuery ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider">Search</span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              exit={{ opacity: 0, width: 0 }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-8 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none py-1.5 font-mono transition-colors"
                placeholder="Search..."
                onBlur={() => {
                  if (!searchQuery) setIsSearchOpen(false);
                }}
              />
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsSearchOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        {/* Add Content Section */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-6">
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
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400 shadow-md scale-[1.02]' 
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Add Category"
            >
              <FolderPlus className={`h-5 w-5 mb-1.5 transition-transform duration-200 ${activeAddMode === 'category' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Category</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeAddMode === 'video' && (
              <motion.div
                key="video-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
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
                }} className="flex gap-2 mb-4">
                  <input
                    autoFocus
                    name="videoUrl"
                    type="text"
                    className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-gray-300 text-[10px] focus:border-blue-500 outline-none px-2 py-1.5 font-mono transition-colors"
                    placeholder="Paste YouTube URL..."
                  />
                  <button
                    type="submit"
                    disabled={!apiKey}
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
                className="overflow-hidden"
              >
                <form onSubmit={handleAddChannel} className="flex gap-2 mb-4">
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
                    disabled={isAddingChannel || !apiKey}
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
                className="overflow-hidden"
              >
                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-mono text-gray-500 uppercase">Monitored Channels [{channels.length}]</label>
              {(soloChannelIds.length > 0 || soloCategoryIds.length > 0) && (
                <button 
                  onClick={onClearSolo}
                  className="text-[10px] font-mono uppercase text-red-400 hover:text-red-300 border border-red-900/50 bg-red-900/20 px-2 py-0.5 rounded transition-colors"
                >
                  Clear Solo ({soloChannelIds.length + soloCategoryIds.length})
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('categories')}
                className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                  viewMode === 'categories' 
                    ? 'bg-gray-950' 
                    : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-gray-950' 
                    : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'
                }`}
              >
                All
              </button>
            </div>
          </div>
          
          {viewMode === 'all' ? (
            <div className="space-y-6">
              {channels.length > 0 ? renderChannelList(channels) : (
                  <div className="text-gray-700 text-xs italic pl-5">No channels monitored</div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Categories */}
              {categories.map(cat => {
                const isCollapsed = collapsedCategories.has(cat.id);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-2 group">
                      <button 
                        onClick={() => toggleCategoryCollapse(cat.id)}
                        className="flex items-center gap-2 text-gray-400 font-mono text-xs uppercase tracking-wider hover:text-gray-200 transition-colors"
                      >
                        <div className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                          <ChevronDown className="h-3 w-3" />
                        </div>
                        <Folder className="h-3 w-3" />
                        {cat.name}
                        <span className="text-gray-600">[{groupedChannels[cat.id]?.length || 0}]</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleCategorySolo(cat.id)}
                          className={`p-1 rounded hover:bg-gray-800 transition-colors ${
                            soloCategoryIds.includes(cat.id) ? 'text-green-500' : 'text-gray-600 hover:text-gray-400'
                          }`}
                          title={soloCategoryIds.includes(cat.id) ? "Un-solo Category" : "Solo this Category"}
                        >
                          {soloCategoryIds.includes(cat.id) ? <Eye className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button 
                          onClick={() => onDeleteCategory(cat.id)}
                          className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
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
                <button 
                  onClick={() => toggleCategoryCollapse('uncategorized')}
                  className="flex items-center gap-2 mb-2 text-gray-500 font-mono text-xs uppercase tracking-wider hover:text-gray-300 transition-colors"
                >
                  <div className={`transition-transform duration-200 ${collapsedCategories.has('uncategorized') ? '-rotate-90' : 'rotate-0'}`}>
                    <ChevronDown className="h-3 w-3" />
                  </div>
                  <Folder className="h-3 w-3" />
                  Uncategorized
                  <span className="text-gray-600">[{groupedChannels.uncategorized.length}]</span>
                </button>
                <AnimatePresence>
                  {!collapsedCategories.has('uncategorized') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {groupedChannels.uncategorized.length > 0 ? (
                        renderChannelList(groupedChannels.uncategorized)
                      ) : (
                        <div className="text-gray-700 text-xs italic pl-5">No uncategorized channels</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
