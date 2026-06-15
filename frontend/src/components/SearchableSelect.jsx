import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder = "Select...", className = "", autoOpen = false }) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
    }
  }, [autoOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className="w-full bg-white border border-gray-300 rounded-lg p-2 flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`block truncate pr-2 ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && (
            <button 
              type="button"
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text"
              autoFocus
              className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 outline-none"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 text-sm rounded-md cursor-pointer flex flex-col ${String(value) === String(opt.value) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="font-medium">{opt.label}</span>
                  {opt.subLabel && <span className="text-[10px] text-gray-500">{opt.subLabel}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
