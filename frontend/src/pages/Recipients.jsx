import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import RecipientModal from '../components/RecipientModal';

const Recipients = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientToEdit, setRecipientToEdit] = useState(null);

  const { data: recipients, isLoading } = useQuery({
    queryKey: ['recipients', search],
    queryFn: () => api.get(`/recipients?query=${search}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/recipients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['recipients']);
      toast.success('Recipient deleted');
    },
    onError: (err) => toast.error('Failed to delete: ' + err.message)
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEdit = (recipient) => {
    setRecipientToEdit(recipient);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setRecipientToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Recipients</h1>
        
        <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search recipients..."
                    className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New</span>
                <span className="sm:hidden">Add</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading recipients...</div>
        ) : recipients?.length === 0 ? (
            <div className="p-12 text-center">
                <div className="text-gray-400 mb-2">No recipients found</div>
                <button onClick={openCreate} className="text-indigo-600 font-medium hover:underline">
                    Create your first recipient
                </button>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Linked Contact</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recipients.map((recipient) => (
                            <tr key={recipient.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{recipient.name}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    {recipient.contact ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{recipient.contact.name}</span>
                                            {recipient.contact.phone && <span className="text-xs text-gray-500">{recipient.contact.phone}</span>}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">None</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => openEdit(recipient)}
                                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(recipient.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      <RecipientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        recipientToEdit={recipientToEdit} 
      />
    </div>
  );
};

export default Recipients;
