import React from 'react';
import { User, Sun, Moon, Settings, RefreshCw, HelpCircle } from 'lucide-react';

const UserProfile = ({ 
  user, 
  isCollapsed, 
  onToggleSidebar, 
  theme, 
  toggleTheme,
  onOpenSettings,
  loading
}) => {
  return (
    <div className={`
      user-profile
      flex-none 
      p-4 
      border-t 
      border-gray-200 
      dark:border-gray-800 
      bg-white 
      dark:bg-gray-950 
      z-10 
      ${isCollapsed ? 'flex justify-center' : ''}
    `}>
      {isCollapsed ? (
          <div 
            className="
              user-profile__avatar-collapsed
              w-8 
              h-8 
              rounded-full 
              bg-gray-200 
              dark:bg-gray-800 
              flex 
              items-center 
              justify-center 
              overflow-hidden 
              border 
              border-gray-300 
              dark:border-gray-700 
              cursor-pointer
            " 
            onClick={onToggleSidebar}
          >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
          </div>
      ) : (
          <div className="
            user-profile__card
            flex 
            items-center 
            gap-3 
            p-2 
            bg-gray-50 
            dark:bg-gray-900 
            border 
            border-gray-200 
            dark:border-gray-800 
            rounded-xl 
            shadow-sm
          ">
            <div className="
              user-profile__avatar
              w-8 
              h-8 
              rounded-full 
              bg-gray-200 
              dark:bg-gray-800 
              flex 
              items-center 
              justify-center 
              overflow-hidden 
              border 
              border-gray-300 
              dark:border-gray-700 
              flex-shrink-0
            ">
                {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                <User className="w-4 h-4 text-gray-400" />
                )}
            </div>
            <div className="user-profile__info flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                {user?.user_metadata?.full_name || 'User'}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                {user?.email}
                </div>
            </div>
            
            {/* Refresh Feed Indicator */}
            <div
                className={`
                  user-profile__refresh-indicator
                  p-1.5
                  rounded-lg
                  text-gray-400
                  dark:text-gray-500
                  transition-colors
                  ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}
                `}
                title="App will refresh every hour just once, to save quota"
            >
                <RefreshCw className="w-4 h-4" />
            </div>

            {/* Theme Toggle - Sun/Moon Icons */}
            <button
                onClick={toggleTheme}
                className="
                  user-profile__theme-toggle
                  p-1.5
                  rounded-lg
                  text-gray-500
                  hover:bg-gray-200
                  dark:hover:bg-gray-800
                  hover:text-gray-900
                  dark:hover:text-gray-100
                  transition-colors
                "
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings Button */}
            <button
                onClick={onOpenSettings}
                className="
                  user-profile__settings-btn
                  p-1.5
                  rounded-lg
                  text-gray-500
                  hover:bg-gray-200
                  dark:hover:bg-gray-800
                  hover:text-gray-900
                  dark:hover:text-gray-100
                  transition-colors
                "
                title="Settings"
            >
                <Settings className="w-4 h-4" />
            </button>
          </div>
      )}
    </div>
  );
};

export default UserProfile;
