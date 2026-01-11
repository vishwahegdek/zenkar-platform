import React, { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../api';

import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Search, Loader2 } from 'lucide-react';
import { parsePhoneNumber } from 'libphonenumber-js';
import ContactForm from '../components/ContactForm';

// Debounce Hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const formatDisplayPhone = (phone) => {
    try {
        const p = parsePhoneNumber(phone || '', 'IN');
        if (p) {
             return p.nationalNumber;
        }
    } catch(e) { }
    return phone;
};

export default function ContactsManager() {
  const { user } = useAuth();
  // Status state
  const [syncStatus, setSyncStatus] = useState({ isConnected: false, lastSyncAt: null });
  const [editingContact, setEditingContact] = useState(null);

  const queryClient = useQueryClient();

  
  // Filter state
  const [filterUserId, setFilterUserId] = useState('all');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch Users for Filter
  const { data: usersList } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
    staleTime: 5 * 60 * 1000
  });

  // Infinite Query for Pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['contacts', filterUserId, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { 
          userId: filterUserId === 'all' ? undefined : filterUserId,
          page: pageParam,
          limit: 20
      };
      if (debouncedSearch) params.query = debouncedSearch;
      
      const res = await api.get('/contacts', { params });
      return res; 
    },
    getNextPageParam: (lastPage) => {
        if (!lastPage?.meta) return undefined;
        const { page, totalPages } = lastPage.meta;
        return page < totalPages ? page + 1 : undefined;
    }
  });

  const contacts = data?.pages.flatMap(page => page.data || []) || [];

  // Fetch Status on Mount
  useEffect(() => {
     if(user) {
         api.get('/auth/google/status').then(res => setSyncStatus(res || { isConnected: false, lastSyncAt: null })).catch(console.error);
     }
  }, [user]);

  const handleImport = () => {
     if (!user || !user.id) return toast.error("User not found");
     
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      `/api/auth/google?userId=${user.id}`,
      'google_import',
      `width=${width},height=${height},top=${top},left=${left}`
    );
    
    // Poll to check if popup is closed, then refresh
    const timer = setInterval(() => {
        if (popup && popup.closed) {
            clearInterval(timer);
            api.get('/auth/google/status').then(res => setSyncStatus(res || { isConnected: false, lastSyncAt: null })).catch(console.error);
            queryClient.invalidateQueries(['contacts']);
            toast.success('Sync connection updated.');
        }
    }, 1000);
  };



  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      toast.success('Contact deleted');
    },
    onError: (error) => {
        toast.error("Failed to delete contact");
    }
  });



  const handleEdit = (contact) => {
      setEditingContact(contact);
  };

  const handleCancelEdit = () => {
      setEditingContact(null);
  };

  const handleSync = async () => {
      const toastId = toast.loading('Syncing with Google...');
      try {
          const res = await api.post('/auth/google/sync', {});
          if (res.success) {
              setSyncStatus(prev => ({ ...prev, lastSyncAt: new Date().toISOString() }));
              queryClient.invalidateQueries(['contacts']);
              toast.success(`Synced. +${res.imported} contacts.`, { id: toastId });
          }
      } catch (error) {
          console.error(error);
          toast.error('Sync failed. Try reconnecting.', { id: toastId });
      }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">My Contacts</h1>
            <p className="text-sm text-gray-500 mt-1">
                {syncStatus.isConnected 
                    ? <span className="text-green-600 font-medium">✅ Google Sync Active</span> 
                    : <span className="text-red-500 font-medium">❌ Not Connected to Google</span>
                }
                {syncStatus.lastSyncAt && <span className="text-gray-400 ml-2">(Last sync: {new Date(syncStatus.lastSyncAt).toLocaleString()})</span>}
            </p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
            {/* Owner Filter */}
            <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="all">All Contacts</option>
                {usersList?.map(u => (
                    <option key={u.id} value={u.id}>
                        {u.username} {user?.id === u.id ? '(Me)' : ''}
                    </option>
                ))}
            </select>

            {syncStatus.isConnected && (
                <button
                    onClick={handleSync}
                    className="border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                    🔁 Sync Now
                </button>
            )}

            <button 
            onClick={handleImport}
            className={`border px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors ${
                syncStatus.isConnected 
                ? 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            >
            <span className="text-xl">☁️</span> 
            {syncStatus.isConnected ? 'Reconnect' : 'Connect Google'}
            </button>
        </div>
      </div>
      
      {!syncStatus.isConnected && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <div className="flex">
                  <div className="flex-shrink-0">⚠️</div>
                  <div className="ml-3">
                      <p className="text-sm text-amber-700">
                          Google Sync is required to manage contacts. Please connect your Google account to Add or Edit contacts.
                      </p>
                  </div>
              </div>
          </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 sticky top-4">
             <h2 className="text-lg font-medium mb-4">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
             <ContactForm 
                initialData={editingContact}
                onSuccess={() => {
                    setEditingContact(null);
                    queryClient.invalidateQueries(['contacts']);
                    // toast handled in ContactForm
                }}
                onCancel={() => setEditingContact(null)}
                // Pass sync status if needed? ContactForm uses checkGoogleAuth internally but we can enforce local disabled state if we want.
                // Actually ContactForm does its own check. But ContactsManager has `syncStatus` state already.
                // Let's stick to ContactForm logic.
             />
          </div>
        </div>

        {/* List Section */}
        <div className="md:col-span-2">
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
            </div>

          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      <div className="text-sm text-gray-500 flex flex-col gap-1 mt-1">
                        {/* Multiple Phones */}
                        {contact.phones && contact.phones.length > 0 ? (
                            contact.phones.map((p, i) => (
                                <span key={i} className="flex items-center gap-1">
                                    {p.type === 'whatsapp' ? '📱' : '📞'} {formatDisplayPhone(p.phone)}
                                    {p.type && p.type !== 'mobile' && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${
                                            p.type === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {p.type}
                                        </span>
                                    )}
                                </span>
                            ))
                        ) : (
                            // Fallback
                            contact.phone && <span>📞 {formatDisplayPhone(contact.phone)}</span>
                        )}
                        
                        <div className="flex gap-2 mt-1">
                             {contact.group && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">{contact.group}</span>}
                             {filterUserId === 'all' && contact.user?.username && (
                                 <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">
                                     Owner: {contact.user.username}
                                 </span>
                             )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                          disabled={!syncStatus.isConnected}
                          onClick={() => handleEdit(contact)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:text-gray-300"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Delete this contact?')) deleteMutation.mutate(contact.id);
                          }}
                          className="text-gray-400 hover:text-red-500 text-sm"
                        >
                          Delete
                        </button>
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery ? 'No contacts match your search.' : 'No contacts available.'}
                  </div>
                )}
                
                {/* Load More Trigger */}
                {hasNextPage && (
                    <div className="p-4 text-center">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-2 mx-auto"
                        >
                            {isFetchingNextPage ? <Loader2 className="animate-spin w-4 h-4" /> : 'Load More Contacts'}
                        </button>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
