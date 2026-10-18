import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useQuery } from '@tanstack/react-query';
import { isEstimateCategoryOrProduct, isDoorFrameProduct } from '../utils/productEstimateHelpers';

export default function Autocomplete({ 
  label, 
  value, 
  onChange, 
  onSelect, 
  onBlur,
  error,
  endpoint, 
  placeholder, 
  displayKey = 'name',
  subDisplayKey,
  onCreate,
  autoFocus,
  renderItem,
  className
}) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal state with prop if it changes externally (e.g. form reset or edit load)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const { data: response, isLoading } = useQuery({
    queryKey: [endpoint, query],
    queryFn: () => api.get(`${endpoint}?query=${query}`),
    enabled: query.length >= 1 && isOpen,
    staleTime: 60000,
  });

  const suggestions = Array.isArray(response) ? response : (response?.data || []);
  const showCreateOption = onCreate && query.length >= 1 && suggestions.length === 0 && !isLoading;
  const showDropdown = isOpen && (suggestions.length > 0 || showCreateOption);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Mobile-friendly auto-focus with delay and scroll
  useEffect(() => {
    if (autoFocus && inputRef.current) {
        inputRef.current.focus();
    }
  }, [autoFocus]);

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
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        className={`w-full px-4 py-2 rounded-lg border transition-all text-sm ${
           error 
             ? 'border-red-600 bg-red-100 text-red-900 focus:ring-2 focus:ring-red-500/20'
             : 'border-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
        } ${className || ''}`}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={onBlur}
      />
      
      {showDropdown && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-auto py-1 text-sm divide-y divide-gray-100">
          {showCreateOption && (
             <li
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors text-blue-600 font-medium border-b border-gray-100 mb-1"
              onMouseDown={(e) => {
                  e.preventDefault(); 
                  onCreate(query);
                  setIsOpen(false);
              }}
            >
              + Create "{query}"
            </li>
          )}
          {suggestions.map((item) => {
            if (renderItem) {
              return (
                <li
                  key={item.id}
                  className="cursor-pointer transition-colors"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                >
                  {renderItem(item)}
                </li>
              );
            }

            const isEstimate = isEstimateCategoryOrProduct(item);
            const isDf = isDoorFrameProduct(item);

            return (
              <li
                key={item.id}
                className={`px-4 py-2.5 cursor-pointer transition-colors ${
                  isEstimate
                    ? 'bg-amber-50/80 hover:bg-amber-100/90 border-l-4 border-l-amber-500'
                    : 'hover:bg-blue-50'
                }`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                    <span>{item[displayKey]}</span>
                    {isDf ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs">
                        📐 Fixed Template
                      </span>
                    ) : isEstimate ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        📐 Estimate Required
                      </span>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    {isEstimate ? (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full">
                        Flexible Price
                      </span>
                    ) : subDisplayKey && item[subDisplayKey] !== undefined ? (
                      <span className="text-xs text-gray-600 font-medium">
                        ₹{Number(item[subDisplayKey]).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>
                {item.category?.name && (
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Category: <span className="font-medium text-gray-700">{item.category.name}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
