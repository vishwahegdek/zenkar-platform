import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useQuery } from '@tanstack/react-query';

export default function Autocomplete({ 
  label, 
  value, 
  onChange, 
  onSelect, 
  endpoint, 
  placeholder, 
  displayKey = 'name',
  subDisplayKey
}) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Sync internal state with prop if it changes externally (e.g. form reset or edit load)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const { data: suggestions = [] } = useQuery({
    queryKey: [endpoint, query],
    queryFn: () => api.get(`${endpoint}?query=${query}`),
    enabled: query.length > 1 && isOpen,
    staleTime: 60000,
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (item) => {
    setQuery(item[displayKey]);
    onChange(item[displayKey]); // Update parent text value
    if (onSelect) onSelect(item); // Pass full object to parent
    setIsOpen(false);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
      />
      
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-auto py-1 text-sm">
          {suggestions.map((item) => (
            <li
              key={item.id}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => handleSelect(item)}
            >
              <div className="font-medium text-gray-900">{item[displayKey]}</div>
              {subDisplayKey && item[subDisplayKey] && (
                <div className="text-xs text-gray-500">{item[subDisplayKey]}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
