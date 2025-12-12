
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useForm } from 'react-hook-form';

export default function ContactsManager() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await api.get('/contacts');
      return res;
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/contacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      reset();
    }
  });

  // Simple deleting for now
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Contacts</h1>
      
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
                  {...register('phone')}
                  placeholder="Optional"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
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
