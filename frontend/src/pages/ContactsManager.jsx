
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function ContactsManager() {
  const { user } = useAuth();
  // Status state
  const [syncStatus, setSyncStatus] = useState({ isConnected: false, lastSyncAt: null });

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  // Filter state for Owner
  const [filterUserId, setFilterUserId] = useState('all');

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', filterUserId],
    queryFn: async () => {
      const res = await api.get('/contacts', { params: { userId: filterUserId === 'all' ? undefined : filterUserId } });
      return res;
    }
  });
  
  // Fetch Status on Mount
  useEffect(() => {
     if(user) {
         // api.get returns the data object directly, so use 'res' not 'res.data'
         api.get('/auth/google/status').then(res => setSyncStatus(res || { isConnected: false, lastSyncAt: null })).catch(console.error);
     }
  }, [user]);

  const handleImport = () => {
     if (!user || !user.id) return toast.error("User not found");
     
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    // Pass userId to backend
    const popup = window.open(
      `/api/auth/google?userId=${user.id}`,
      'google_import',
      `width=${width},height=${height},top=${top},left=${left}`
    );
    
    // Poll to check if popup is closed, then refresh
    const timer = setInterval(() => {
        if (popup && popup.closed) {
            clearInterval(timer);
            // Refresh Status
            api.get('/auth/google/status').then(res => setSyncStatus(res || { isConnected: false, lastSyncAt: null })).catch(console.error);
            queryClient.invalidateQueries(['contacts']);
            toast.success('Sync connection updated.');
        }
    }, 1000);
  };

  const mutation = useMutation({
    mutationFn: (data) => api.post('/contacts', { ...data, userId: user?.id }), 
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      reset();
      toast.success('Contact added');
    },
    onError: async (error, variables) => {
        if (error.response?.status === 424) {
            if (window.confirm("Unable to save to Google Contacts (Network/Auth Error).\n\nDo you want to save strictly to the App only?")) {
                try {
                    await api.post('/contacts', { ...variables, userId: user?.id, skipGoogleSync: true });
                    queryClient.invalidateQueries(['contacts']);
                    reset();
                    toast.success('Contact added (Local Only)');
                } catch (retryError) {
                    toast.error("Failed to save contact locally.");
                }
            }
        } else {
            toast.error(error.message || "Failed to create contact");
        }
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
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
        
        <div className="flex gap-2">
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
            {syncStatus.isConnected ? 'Reconnect' : 'Connect Google Contacts'}
            </button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 sticky top-4">
            <h2 className="text-lg font-medium mb-4">Add New Contact</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  placeholder="e.g. Ramesh (Labour)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  {...register('phone', { required: 'Phone is required' })}
                  placeholder="e.g. 9876543210"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Group/Tag</label>
                <input
                  {...register('group')}
                  placeholder="e.g. Labour, Vendor"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
              </div>

              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
              >
                {mutation.isPending ? 'Saving...' : 'Save Contact'}
              </button>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="md:col-span-2">
          {isLoading ? (
            <div>Loading contacts...</div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {contacts?.map((contact) => (
                  <div key={contact.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      <div className="text-sm text-gray-500 flex gap-2">
                        {contact.phone && <span>📞 {contact.phone}</span>}
                        {contact.group && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">{contact.group}</span>}
                        {contact.user?.username && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Owner: {contact.user.username}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if(confirm('Delete this contact?')) deleteMutation.mutate(contact.id);
                      }}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {contacts?.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No contacts yet. Add your first one!
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
