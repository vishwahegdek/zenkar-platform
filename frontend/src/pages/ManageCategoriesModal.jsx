import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { X, Trash2, Edit2, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageCategoriesModal({ onClose }) {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => api.get('/product-categories').then(res => res)
  });

  const createMutation = useMutation({
    mutationFn: (name) => api.post('/product-categories', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['product-categories']);
      setNewCategoryName('');
      toast.success('Category created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => api.patch(`/product-categories/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['product-categories']);
      setEditingId(null);
      toast.success('Category updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/product-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['product-categories']);
      toast.success('Category deleted');
    },
    onError: () => toast.error('Check if category is used by products')
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (newCategoryName.trim()) createMutation.mutate(newCategoryName);
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = () => {
    if (editName.trim()) updateMutation.mutate({ id: editingId, name: editName });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleCreate} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New Category Name..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim() || createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group border border-transparent hover:border-gray-200">
                {editingId === cat.id ? (
                   <div className="flex gap-2 flex-1">
                      <input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                      />
                      <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="w-4 h-4"/></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:bg-gray-100 p-1 rounded"><X className="w-4 h-4"/></button>
                   </div>
                ) : (
                   <>
                     <div>
                        <span className="font-medium text-gray-800">{cat.name}</span>
                        <span className="text-xs text-gray-400 ml-2">({cat._count?.products || 0})</span>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => deleteMutation.mutate(cat.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                     </div>
                   </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
