import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

const Search = ({
  value = '',
  onChange,
  placeholder = 'Cari data...',
  className = ''
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3.5 pointer-events-none text-slate-400">
        <SearchIcon className="w-4 h-4" />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 border border-slate-200/90 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange && onChange('')}
          className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
          title="Hapus pencarian"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default Search;
