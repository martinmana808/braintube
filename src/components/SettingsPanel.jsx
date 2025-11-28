import React, { useState } from 'react';
import { Trash2, Plus, Key, Eye, EyeOff, FolderPlus, Folder, ChevronDown } from 'lucide-react';

const SettingsPanel = ({ 
  apiKey, setApiKey, 
  aiApiKey, setAiApiKey,
  channels, onAddChannel, onRemoveChannel, onToggleSolo, onClearSolo, soloChannelIds,
  categories, onAddCategory, onDeleteCategory, updateChannelCategory
}) => {
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
      alert(error.message);
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      onAddCategory(newCategoryName);
      setNewCategoryName('');
    } catch (error) {
      alert(error.message);
    }
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
      {channelList.map((channel) => (
        <div key={channel.id} className="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800 group hover:border-gray-700">
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
              {soloChannelIds.includes(channel.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onRemoveChannel(channel.id)}
              className="p-1 text-gray-600 hover:text-red-400 rounded hover:bg-gray-800 transition-colors"
              title="Remove channel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'all'
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

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

  return (
    <div className="flex flex-col h-full bg-gray-900 p-4 overflow-y-auto border-l border-gray-800">
      <h2 className="text-lg font-bold text-green-500 mb-6 font-mono uppercase tracking-wider border-b border-gray-800 pb-2">
        System Config
      </h2>

      <div className="mb-8">
        <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">YouTube Data API Key</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key className="h-4 w-4 text-gray-600" />
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="block w-full pl-10 bg-gray-950 border border-gray-800 rounded text-gray-300 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none py-2 font-mono"
            placeholder="Enter YouTube API Key"
          />
        </div>
        <p className="text-[10px] text-gray-600 mt-1">Required for fetching video data.</p>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Groq API Key (AI Summary)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key className="h-4 w-4 text-gray-600" />
          </div>
          <input
            type="password"
            value={aiApiKey}
            onChange={(e) => setAiApiKey(e.target.value)}
            className="block w-full pl-10 bg-gray-950 border border-gray-800 rounded text-gray-300 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none py-2 font-mono"
            placeholder="Enter Groq API Key"
          />
        </div>
        <p className="text-[10px] text-gray-600 mt-1">
          Required for AI summaries. Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">console.groq.com</a>
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Add Channel</label>
        <form onSubmit={handleAddChannel} className="flex gap-2">
          <input
            type="text"
            value={newChannelId}
            onChange={(e) => setNewChannelId(e.target.value)}
            className="flex-1 bg-gray-950 border border-gray-800 rounded text-gray-300 text-sm focus:border-green-500 outline-none px-3 py-2 font-mono"
            placeholder="Channel ID / Handle / URL"
          />
          <button
            type="submit"
            disabled={isAddingChannel || !apiKey}
            className="bg-green-600 hover:bg-green-700 text-black font-bold p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </form>
        <p className="text-[10px] text-gray-600 mt-1">Enter Channel ID, Handle (@name), or URL</p>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Add Category</label>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 bg-gray-950 border border-gray-800 rounded text-gray-300 text-sm focus:border-green-500 outline-none px-3 py-2 font-mono"
            placeholder="Category Name"
          />
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold p-2 rounded disabled:opacity-50 transition-colors"
          >
            <FolderPlus className="h-5 w-5" />
          </button>
        </form>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <label className="block text-xs font-mono text-gray-500 uppercase">Monitored Channels [{channels.length}]</label>
            {soloChannelIds.length > 0 && (
              <button 
                onClick={onClearSolo}
                className="text-[10px] font-mono uppercase text-red-400 hover:text-red-300 border border-red-900/50 bg-red-900/20 px-2 py-0.5 rounded transition-colors"
              >
                Clear Solo ({soloChannelIds.length})
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('categories')}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                viewMode === 'categories' 
                  ? 'bg-green-900/30 border-green-500 text-green-400' 
                  : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                viewMode === 'all' 
                  ? 'bg-green-900/30 border-green-500 text-green-400' 
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
                    <button 
                      onClick={() => onDeleteCategory(cat.id)}
                      className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {!isCollapsed && (
                    groupedChannels[cat.id]?.length > 0 ? (
                      renderChannelList(groupedChannels[cat.id])
                    ) : (
                      <div className="text-gray-700 text-xs italic pl-5">Empty category</div>
                    )
                  )}
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
              {!collapsedCategories.has('uncategorized') && (
                groupedChannels.uncategorized.length > 0 ? (
                  renderChannelList(groupedChannels.uncategorized)
                ) : (
                  <div className="text-gray-700 text-xs italic pl-5">No uncategorized channels</div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
