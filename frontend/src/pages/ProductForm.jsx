import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import ImageGallery from '../components/ImageGallery';
import ImageUploader from '../components/ImageUploader';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    defaultUnitPrice: 0,
    notes: '',
  });

  // Fetch Product Data if Edit
  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ['products', id],
    queryFn: () => api.get(`/products/${id}`),
    enabled: isEdit,
  });

  // Populate Form on Load
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        defaultUnitPrice: Number(product.defaultUnitPrice) || 0,
        notes: product.notes || '',
      });
    }
  }, [product]);

  // Mutations
  const mutation = useMutation({
    mutationFn: (data) => {
       const payload = {
          ...data,
          defaultUnitPrice: Number(data.defaultUnitPrice) || 0,
       };
       return isEdit ? api.patch(`/products/${id}`, payload) : api.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      navigate('/products');
    },
    onError: (err) => alert('Failed to save product: ' + err.message)
  });

  if (isEdit && isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
          <input type="text" className="input-field" 
             required
             value={formData.name} 
             onChange={e => setFormData({...formData, name: e.target.value})}
             placeholder="e.g. Wooden Chair"
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Default Price (₹)</label>
           <input type="number" className="input-field" 
              value={formData.defaultUnitPrice} 
              onChange={e => setFormData({...formData, defaultUnitPrice: e.target.value})}
           />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
           <textarea className="input-field" rows="3"
             placeholder="Internal notes about this product..."
             value={formData.notes} 
             onChange={e => setFormData({...formData, notes: e.target.value})}
           />
        </div>

        {/* Image Management Section (Only in Edit Mode) */}
        {isEdit && (
          <div className="pt-4 border-t border-gray-100">
             <h3 className="text-sm font-medium text-gray-700 mb-2">Product Images</h3>
             <ImageGallery images={product?.images} />
             <ImageUploader 
               uploadUrl={`/api/products/${id}/images`} 
               // ImageUploader uses standard fetch, so we need full URL or relative if proxied.
               // Vite proxy handles /api -> backend. 
               // api.js uses axios baseURL.
               // Let's ensure ImageUploader uses the right path.
               // If using fetch('/api/products...') it relies on proxy.
               // I used `uploadUrl` in ImageUploader fetch call.
               // If I pass `/api/products/${id}/images`, it should work with proxy.
               // Wait, api.js might have /api prefix.
               // Let's assume proxy creates /api. 
               // I'll check vite.config.js or Setup.
               // Previous tasks said "Frontend Proxy setup". 
               // If I pass `/api/products/${id}/images`, it hits localhost:5173/api/... -> localhost:3000/...
               onUploadSuccess={() => {
                 queryClient.invalidateQueries(['products', id]);
                 refetch();
               }}
             />
          </div>
        )}

        <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
           <button 
             type="button"
             onClick={() => navigate('/products')}
             className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
           >
             Cancel
           </button>
           <button 
              onClick={() => mutation.mutate(formData)}
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50"
              disabled={mutation.isPending || !formData.name}
            >
              {mutation.isPending ? 'Saving...' : 'Save Product'}
            </button>
        </div>
      </div>
    </div>
  );
}

