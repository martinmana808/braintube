import React from 'react';
import { Trash2 } from 'lucide-react';
import CategoryPillSelector from './CategoryPillSelector';

const ChannelRow = ({ 
  channel, 
  isCollapsed, 
  onToggleSolo, 
  soloChannelIds, 
  soloCategoryIds, 
  setHoveredChannel, 
  categories, 
  updateChannelCategory, 
  onRemoveChannel 
}) => {
  return (
    <div className={`
      channel-row
      flex 
      items-center 
      ${isCollapsed ? 'justify-center' : 'justify-between'} 
      mb-3 
      group
    `}>
      <div className="channel-row__info-wrapper flex items-center gap-3 min-w-0">
        <div 
          className="channel-row__avatar-wrapper relative group/avatar cursor-pointer"
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
          <div className={`
            channel-row__avatar
            w-8 
            h-8 
            rounded-full 
            overflow-hidden 
            bg-gray-200 
            dark:bg-gray-800 
            flex-shrink-0 
            border-2 
            transition-all 
            duration-300 
            ${soloChannelIds.includes(channel.id) 
                ? 'border-teal-500 dark:border-green-500 ring-2 ring-teal-500/30 dark:ring-green-500/30 shadow-[0_0_12px_rgba(20,184,166,0.4)] scale-110' 
                : 'border-transparent opacity-100'
            } 
            ${
                // Dim others if some are soloed
                ((soloChannelIds.length > 0 || soloCategoryIds.length > 0) && 
                 !soloChannelIds.includes(channel.id) && 
                 !(channel.categoryId && soloCategoryIds.includes(channel.categoryId)))
                    ? 'opacity-40 grayscale' 
                    : ''
            }
          `}>
            <img src={channel.thumbnail} alt={channel.name} className="w-full h-full object-cover" />
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="channel-row__name-wrapper flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={channel.name}>
              {channel.name}
            </span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="
          channel-row__actions
          flex 
          items-center 
          gap-1 
          opacity-0 
          group-hover:opacity-100 
          transition-opacity
        ">
          <CategoryPillSelector 
              channel={channel} 
              categories={categories} 
              onSelect={updateChannelCategory} 
          />
          <button
            onClick={() => onRemoveChannel(channel.id)}
            className="
              channel-row__remove-btn
              p-1 
              text-gray-400 
              hover:text-red-600 
              dark:hover:text-red-400 
              hover:bg-red-50 
              dark:hover:bg-red-900/20 
              rounded 
              transition-colors
            "
            title="Remove Channel"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChannelRow;
