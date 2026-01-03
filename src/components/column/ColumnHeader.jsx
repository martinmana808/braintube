import React from 'react';

const ColumnHeader = ({ title, filterMode, setFilterMode, mainCount, unwatchedCount }) => {
  return (
    <div className="video-column__header flex-none h-[88px] border-b border-gray-200 dark:border-gray-800 flex flex-col justify-center px-4 mb-4 bg-white dark:bg-black z-10">
      <h2 className="video-column__title text-xl font-bold text-gray-900 dark:text-white mb-1">
        {title}
      </h2>
      <div className="video-column__filters flex items-center gap-3 text-xs font-mono tracking-wider">
        <button 
          onClick={() => setFilterMode('ALL')}
          className={`video-column__filter-btn transition-colors ${filterMode === 'ALL' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          ALL ({mainCount})
        </button>
        <span className="text-gray-300 dark:text-gray-700">|</span>
        <button 
          onClick={() => setFilterMode('UNWATCHED')}
          className={`video-column__filter-btn transition-colors ${filterMode === 'UNWATCHED' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          UNWATCHED ({unwatchedCount})
        </button>
      </div>
    </div>
  );
};

export default ColumnHeader;
