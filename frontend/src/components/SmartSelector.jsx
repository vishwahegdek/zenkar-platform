import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

const SmartSelector = ({ label, type, onSelect, initialValue = '', initialId = null, autoFocus }) => {
    // type: 'recipient' | 'customer'
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-focus prop handling (scrolling handled globally by useMobileAutoScroll)
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length < 2) {
                setResults([]);
                setContacts([]);
                return;
            }

            setIsSearching(true);
            try {
                // 1. Search Primary Entity (Recipient or Customer)
                const endpoint = type === 'recipient' ? '/recipients' : '/customers';
                const resPrimary = await api.get(`${endpoint}?query=${query}`);
                
                // Safe extraction: handle array or { data: [] } structure
                const primaryData = Array.isArray(resPrimary) 
                    ? resPrimary 
                    : (resPrimary?.data && Array.isArray(resPrimary.data) ? resPrimary.data : []);
                
                setResults(primaryData);

                if (primaryData.length === 0) {
                     const resContacts = await api.get(`/contacts?query=${query}`); 
                     
                     const allContacts = Array.isArray(resContacts) 
                        ? resContacts 
                        : (resContacts?.data && Array.isArray(resContacts.data) ? resContacts.data : []);
                     const filteredContacts = allContacts.filter(c => 
                        c.name.toLowerCase().includes(query.toLowerCase())
                     );
                     setContacts(filteredContacts);
                } else {
                    setContacts([]);
                }

            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, type]);

    const handleSelect = (item, source) => {
        // source: 'primary' | 'contact'
        setQuery(item.name);
        setShowDropdown(false);
        // callback
        onSelect({
            name: item.name,
            id: source === 'primary' ? item.id : null, 
            contactId: source === 'contact' ? item.id : (item.contactId || null),
            phone: item.phone || '',
            address: item.address || '',
            source
        });
    };

    const handleCreateNew = () => {
        setShowDropdown(false);
         onSelect({
            name: query,
            id: null,
            contactId: null,
            source: 'new'
        });
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                ref={inputRef}
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                     // Clear selection if user types? 
                     // Maybe just notify name change?
                     // For now, let's wait for selection.
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={`Search ${type}...`}
                autoComplete="off"
            />
            
            {showDropdown && query.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-auto py-1 text-sm">
                    {isSearching && <div className="px-4 py-2 text-gray-500">Searching...</div>}

                    {!isSearching && (
                        <>
                            {/* Primary Results */}
                            {results.length > 0 && (
                                <>
                                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                                        Existing {type === 'recipient' ? 'Recipients' : 'Customers'}
                                    </div>
                                    {results.map((item) => (
                                        <div
                                            key={`primary-${item.id}`}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                            onMouseDown={(e) => { e.preventDefault(); handleSelect(item, 'primary'); }}
                                        >
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* Contact Results */}
                            {results.length === 0 && contacts.length > 0 && (
                                <>
                                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                                        From Contacts
                                    </div>
                                    {contacts.map((contact) => (
                                        <div
                                            key={`contact-${contact.id}`}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                            onMouseDown={(e) => { e.preventDefault(); handleSelect(contact, 'contact'); }}
                                        >
                                            <div className="font-medium text-gray-900">{contact.name}</div>
                                            {contact.phone && <div className="text-xs text-gray-500">{contact.phone}</div>}
                                        </div>
                                    ))}
                                </>
                            )}
                            
                            {/* Create New */}
                            {results.length === 0 && contacts.length === 0 && !isSearching && (
                                <div
                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors text-blue-600 font-medium border-b border-gray-50 mb-1"
                                    onMouseDown={(e) => { e.preventDefault(); handleCreateNew(); }}
                                >
                                    + Create "{query}"
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartSelector;
