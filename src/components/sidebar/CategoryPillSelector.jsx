import React, { useState } from 'react';

const CategoryPillSelector = ({ channel, categories, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentCategory = categories.find(c => c.id === channel.categoryId);

  return (
    <div className="category-pill relative flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          category-pill__button
          px-1.5 
          py-0.5 
          rounded 
          text-[10px] 
          font-mono 
          uppercase 
          tracking-wider 
          border 
          transition-colors 
          whitespace-nowrap 
          ${currentCategory 
            ? 'bg-gray-100 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600' 
            : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
      >
        {currentCategory ? currentCategory.name : '+'}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="
            category-pill__dropdown
            absolute 
            right-0 
            mt-1 
            w-32 
            bg-white 
            dark:bg-gray-950 
            border 
            border-gray-200 
            dark:border-gray-800 
            rounded 
            shadow-xl 
            z-20 
            py-1 
            max-h-48 
            overflow-y-auto
          ">
            <button
              onClick={() => {
                onSelect(channel.id, null);
                setIsOpen(false);
              }}
              className="
                w-full 
                text-left 
                px-3 
                py-1.5 
                text-[10px] 
                font-mono 
                uppercase 
                text-gray-400 
                hover:bg-gray-100 
                dark:hover:bg-gray-800 
                hover:text-gray-600 
                dark:hover:text-gray-200
              "
            >
              No Category
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelect(channel.id, cat.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full 
                  text-left 
                  px-3 
                  py-1.5 
                  text-[10px] 
                  font-mono 
                  uppercase 
                  hover:bg-gray-100 
                  dark:hover:bg-gray-800 
                  hover:text-gray-900 
                  dark:hover:text-gray-200 
                  ${channel.categoryId === cat.id ? 'text-teal-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}
                `}
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

export default CategoryPillSelector;
