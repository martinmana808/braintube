import React from 'react';
import { FolderDown, FolderUp, Eye, Trash2, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChannelRow from './ChannelRow';

const CategoryItem = ({ 
  cat, 
  groupedChannels, 
  collapsedCategories, 
  toggleCategoryCollapse, 
  soloCategoryIds, 
  onToggleCategorySolo, 
  onDeleteCategory, 
  isCollapsed, 
  soloChannelIds,
  // Props passed down to ChannelRow
  onToggleSolo,
  onRemoveChannel,
  updateChannelCategory,
  categories,
  setHoveredChannel
}) => {
  const channelRowProps = {
    onToggleSolo,
    onRemoveChannel,
    updateChannelCategory,
    categories,
    setHoveredChannel,
    soloChannelIds
  };

  // Check if this category is collapsed in the UI
  const isCategoryCollapsed = collapsedCategories.has(cat.id);
  
  // Check if any channel inside this category is currently soloed
  const hasActiveChild = groupedChannels[cat.id]?.some(c => soloChannelIds.includes(c.id));
  const isDimmed = (soloChannelIds.length > 0 || soloCategoryIds.length > 0) && 
                   !soloCategoryIds.includes(cat.id) && 
                   !hasActiveChild;

  // COMPRESSED VIEW:
  // When sidebar is collapsed, we just show the channels (avatars) without the category header
  if (isCollapsed) {
      return (
          <div className={`
            category-item
            transition-all 
            duration-300 
            ${isDimmed ? 'opacity-40 grayscale' : ''}
          `}>
             {groupedChannels[cat.id]?.length > 0 && groupedChannels[cat.id].map(channel => (
                <ChannelRow 
                  key={channel.id}
                  channel={channel}
                  isCollapsed={isCollapsed}
                  soloCategoryIds={soloCategoryIds}
                  {...channelRowProps}
                />
              ))}
          </div>
      );
  }

  return (
    <div className={`
      category-item
      transition-all 
      duration-300 
      ${isDimmed ? 'opacity-40 grayscale' : ''}
    `}>
      
      {/* Category Header */}
      <div className="
        category-item__header
        flex 
        items-center 
        justify-between 
        mb-3 
        group
      ">
        
        {/* Collapse Toggle & Name */}
        <button
          onClick={() => toggleCategoryCollapse(cat.id)}
          className="
            category-item__toggle
            flex 
            items-center 
            gap-2 
            text-xs 
            font-bold 
            text-gray-500 
            dark:text-gray-400 
            uppercase 
            tracking-wider 
            hover:text-gray-900 
            dark:hover:text-gray-200 
            transition-colors
          "
        >
          {isCategoryCollapsed ? <FolderDown className="h-4 w-4" /> : <FolderUp className="h-4 w-4" />}
          
          {!isCollapsed && (
            <>
              <span className="truncate max-w-[120px]">{cat.name}</span>
              {isCategoryCollapsed && (
                <span className="text-gray-400">
                  [{groupedChannels[cat.id]?.length || 0}]
                </span>
              )}
            </>
          )}
        </button>

        {/* Actions (Solo, Delete) - Hidden when sidebar collapsed */}
        {!isCollapsed && (
          <div className="
            category-item__actions
            flex 
            items-center 
            gap-1 
            opacity-0 
            group-hover:opacity-100 
            transition-opacity
          ">
            <button
              onClick={() => onToggleCategorySolo(cat.id)}
              className={`
                p-1 
                rounded 
                transition-colors 
                ${soloCategoryIds.includes(cat.id) 
                  ? 'text-teal-600 dark:text-green-500' 
                  : 'text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                }
              `}
              title={soloCategoryIds.includes(cat.id) ? "Un-solo Category" : "Solo this Category"}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={() => onDeleteCategory(cat.id)}
              className="
                p-1 
                text-gray-400 
                hover:text-red-600 
                dark:hover:text-red-400 
                hover:bg-red-50 
                dark:hover:bg-red-900/20 
                rounded 
                transition-colors
              "
              title="Delete Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Channels List (Collapsible) */}
      <AnimatePresence>
        {!isCategoryCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="category-item__channels overflow-hidden"
          >
            {groupedChannels[cat.id]?.length > 0 ? (
              groupedChannels[cat.id].map(channel => (
                <ChannelRow 
                  key={channel.id}
                  channel={channel}
                  isCollapsed={isCollapsed}
                  soloCategoryIds={soloCategoryIds}
                  {...channelRowProps}
                />
              ))
            ) : (
              !isCollapsed && (
                <div className="
                  text-gray-400 
                  dark:text-gray-600 
                  text-[10px] 
                  italic 
                  pl-6 
                  mb-2
                ">
                  Empty category
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryItem;
