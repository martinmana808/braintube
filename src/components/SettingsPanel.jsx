import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { FolderDown, FolderUp, User, Folder, Plus } from 'lucide-react';

// Sidebar Components
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarSearch from './sidebar/SidebarSearch';
import SidebarAddMenu from './sidebar/SidebarAddMenu';
import CategoryItem from './sidebar/CategoryItem';
import ChannelRow from './sidebar/ChannelRow';
import SavedChannelItem from './sidebar/SavedChannelItem';
import UserProfile from './sidebar/UserProfile';

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
  onToggleSidebar,
  collapsedCategories,
  toggleCategoryCollapse,
  isSavedSelected,
  onToggleSavedSelected,
  YOUTUBE_API_KEY,
  user,
  onSignOut,
  isSavedViewOpen,
  onToggleSavedView
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('all'); // 'categories' or 'all'
  const [activeAddMode, setActiveAddMode] = useState(null); // 'video', 'channel', 'category', null
  const [hoveredChannel, setHoveredChannel] = useState(null); // { id, name, top, left }
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false); // For compressed view dropdown
  const [addMenuPos, setAddMenuPos] = useState({ top: 0, left: 0 });
  const searchInputRef = React.useRef(null);
  const addBtnRef = React.useRef(null);
  
  // Clear active add mode when collapsing
  useEffect(() => {
    if (isCollapsed) {
      setActiveAddMode(null);
    }
  }, [isCollapsed]);
  
  // Form State
  const [newChannelId, setNewChannelId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingChannel, setIsAddingChannel] = useState(false);

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

  // Group channels by category
  const groupedChannels = {
    uncategorized: channels.filter(c => !c.categoryId),
    ...categories.reduce((acc, cat) => ({
      ...acc,
      [cat.id]: channels.filter(c => c.categoryId === cat.id)
    }), {})
  };

  const renderChannelList = (channelsToRender) => {
    return channelsToRender.map(channel => (
      <ChannelRow 
        key={channel.id}
        channel={channel}
        isCollapsed={isCollapsed}
        onToggleSolo={onToggleSolo}
        soloChannelIds={soloChannelIds}
        soloCategoryIds={soloCategoryIds}
        setHoveredChannel={setHoveredChannel}
        categories={categories}
        updateChannelCategory={updateChannelCategory}
        onRemoveChannel={onRemoveChannel}
      />
    ));
  };

  return (
    <div className="settings-panel flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 relative">
      
      <SidebarHeader 
        isCollapsed={isCollapsed} 
        onToggleSidebar={onToggleSidebar} 
      />

      {/* Scrollable Content */}
      <div className="settings-panel__content flex-1 overflow-y-auto custom-scrollbar">
        <div className='p-4 pt-4 pb-20'>
          
          <SidebarSearch 
            isCollapsed={isCollapsed}
            onToggleSidebar={onToggleSidebar}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchInputRef={searchInputRef}
          />

          <SidebarAddMenu 
            isCollapsed={isCollapsed}
            onToggleSidebar={onToggleSidebar}
            activeAddMode={activeAddMode}
            setActiveAddMode={setActiveAddMode}
            isAddMenuOpen={isAddMenuOpen}
            setIsAddMenuOpen={setIsAddMenuOpen}
            addMenuPos={addMenuPos}
            setAddMenuPos={setAddMenuPos}
            addBtnRef={addBtnRef}
            onAddVideoByLink={onAddVideoByLink}
            onAddChannel={handleAddChannel} // Pass the wrapper
            onAddCategory={handleAddCategory} // Pass the wrapper
            YOUTUBE_API_KEY={YOUTUBE_API_KEY}
            isAddingChannel={isAddingChannel}
            newChannelId={newChannelId}
            setNewChannelId={setNewChannelId}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
          />

          <div className="flex-1">
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-' : 'justify-between'} mb-8`}>
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
                        {isCollapsed ? <User className="w-3.5 h-3.5" /> : 'All channels'}
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
                {/* Saved Channel Item (Virtual) in All View */}
                <SavedChannelItem 
                    isCollapsed={isCollapsed}
                    onToggleCategorySolo={onToggleCategorySolo}
                    setHoveredChannel={setHoveredChannel}
                    soloCategoryIds={soloCategoryIds}
                    soloChannelIds={soloChannelIds}
                    activeAddMode={activeAddMode}
                    setActiveAddMode={setActiveAddMode}
                    onAddVideoByLink={onAddVideoByLink}
                    YOUTUBE_API_KEY={YOUTUBE_API_KEY}
                    isSavedViewOpen={isSavedViewOpen}
                    onToggleSavedView={onToggleSavedView}
                />

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
                {/* Saved Channel Item (Virtual) */}
                <SavedChannelItem 
                    isCollapsed={isCollapsed}
                    onToggleCategorySolo={onToggleCategorySolo}
                    setHoveredChannel={setHoveredChannel}
                    soloCategoryIds={soloCategoryIds}
                    soloChannelIds={soloChannelIds}
                    activeAddMode={activeAddMode}
                    setActiveAddMode={setActiveAddMode}
                    onAddVideoByLink={onAddVideoByLink}
                    YOUTUBE_API_KEY={YOUTUBE_API_KEY}
                />

                {/* Categories */}
                {categories.map(cat => (
                    <CategoryItem 
                        key={cat.id}
                        cat={cat}
                        groupedChannels={groupedChannels}
                        collapsedCategories={collapsedCategories}
                        toggleCategoryCollapse={toggleCategoryCollapse}
                        soloCategoryIds={soloCategoryIds}
                        onToggleCategorySolo={onToggleCategorySolo}
                        onDeleteCategory={onDeleteCategory}
                        isCollapsed={isCollapsed}
                        soloChannelIds={soloChannelIds}
                        // ChannelRow props
                        onToggleSolo={onToggleSolo}
                        onRemoveChannel={onRemoveChannel}
                        updateChannelCategory={updateChannelCategory}
                        categories={categories}
                        setHoveredChannel={setHoveredChannel}
                    />
                ))}

                {/* Uncategorized */}
                <div className={`transition-all duration-300 ${
                    ((soloChannelIds.length > 0 || soloCategoryIds.length > 0) && 
                     !groupedChannels.uncategorized.some(c => soloChannelIds.includes(c.id)))
                    ? 'opacity-40 grayscale'
                    : ''
                }`}>
                  {isCollapsed ? (
                      // Compressed View: Just render channels
                      groupedChannels.uncategorized.length > 0 && (
                          <div className="mb-10">
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
                            {collapsedCategories.has('uncategorized') ? <FolderDown className="h-4 w-4" /> : <FolderUp className="h-4 w-4" />}
                            Uncategorized
                            {collapsedCategories.has('uncategorized') && <span className="text-gray-600">[{groupedChannels.uncategorized.length}]</span>}
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

      <UserProfile 
        user={user}
        isCollapsed={isCollapsed}
        onToggleSidebar={onToggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onSignOut={onSignOut}
      />
    </div>
  );
};

export default SettingsPanel;
