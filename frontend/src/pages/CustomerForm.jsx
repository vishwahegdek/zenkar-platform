import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customers', id],
    queryFn: () => api.get(`/customers/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

  const mutation = useMutation({
    mutationFn: (data) => {
       return isEdit ? api.patch(`/customers/${id}`, data) : api.post('/customers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success(isEdit ? 'Customer updated' : 'Customer created');
      navigate('/customers');
    },
    onError: (err) => toast.error('Failed: ' + err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');
    mutation.mutate(formData);
  };

  if (isEdit && isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto px-4 md:px-0">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Customer' : 'New Customer'}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input 
            type="text" 
            className="input-field" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Raj Kumar"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input 
            type="tel" 
            className="input-field" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            placeholder="e.g. 9876543210"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea 
            className="input-field" 
            rows="3"
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            placeholder="Full address..."
          />
        </div>

        <div className="pt-4 flex gap-3 justify-end">
          <button 
            type="button" 
            onClick={() => navigate('/customers')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
