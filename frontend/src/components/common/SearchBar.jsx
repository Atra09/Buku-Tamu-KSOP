import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable & Lightweight SearchBar Component
 * @param {string} value - Current search query value
 * @param {function} onChange - Callback function when search query changes
 * @param {string} placeholder - Input placeholder text
 * @param {string} className - Additional CSS classes
 * @param {string} id - Input element ID for accessibility
 */
const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Cari data...',
  className = '',
  id = 'search-input'
}) => {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  const handleClear = () => {
    if (onChange) onChange('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 font-medium text-slate-800 bg-white placeholder-slate-400 transition-colors shadow-2xs"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Hapus pencarian"
          aria-label="Hapus pencarian"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
export { SearchBar };
