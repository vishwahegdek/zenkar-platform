import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';

export default function ProductForm({ onSuccess, initialData, isModal = false }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = paramId;
  const isEdit = Boolean(id);

  // Fetch Categories
  const { data: categories, isError: isCategoriesError, refetch: refetchCategories } = useQuery({
      queryKey: ['productCategories'],
      queryFn: () => api.get('/product-categories').then(res => res || [])
  });

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    defaultUnitPrice: 0,
    categoryId: '',
    notes: '',
  });

  // Fetch Product Data if Edit
  const { data: product, isLoading } = useQuery({
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
        categoryId: product.categoryId || '',
        notes: product.notes || '',
      });
    } else if (categories && !isEdit) {
       // Default to "General"
       const generalCat = categories.find(c => c.name === 'General');
       setFormData(prev => ({ 
           ...prev, 
           name: initialData?.name || prev.name,
           categoryId: generalCat ? generalCat.id : prev.categoryId 
       }));
    }
  }, [product, initialData, isEdit, categories]);

  // Mutations
  const mutation = useMutation({
    mutationFn: (data) => {
       const payload = {
          ...data,
          defaultUnitPrice: Number(data.defaultUnitPrice) || 0,
          categoryId: Number(data.categoryId)
       };
       return isEdit ? api.patch(`/products/${id}`, payload) : api.post('/products', payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['products']);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      
      if (onSuccess) {
          onSuccess(data);
      } else {
          navigate('/products');
      }
    },
    onError: (err) => toast.error('Failed: ' + err.message)
  });

  if (isEdit && isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const containerClasses = isModal ? "" : "max-w-2xl mx-auto space-y-6";
  const formClasses = isModal ? "space-y-4" : "bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4";

  return (
    <div className={containerClasses}>
      {!isModal && (
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        </div>
      )}

      <div className={formClasses}>
        <div>
          <label htmlFor="productFormName" className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
          <input 
             id="productFormName"
             type="text" className="input-field" 
             required
             value={formData.name} 
             onChange={e => setFormData({...formData, name: e.target.value})}
             placeholder="e.g. Wooden Chair"
             autoFocus
          />
        </div>

        <div>
           <label htmlFor="productFormCategory" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
           {isCategoriesError ? (
               <div className="text-red-500 text-xs mb-1">
                   Failed to load categories. 
                   <button type="button" onClick={() => refetchCategories()} className="underline ml-1">Retry</button>
               </div>
           ) : null}
           <select
              id="productFormCategory"
              className="input-field"
              value={formData.categoryId}
              onChange={e => setFormData({...formData, categoryId: e.target.value})}
              required
           >
               <option value="">Select Category</option>
               {categories?.map(cat => (
                   <option key={cat.id} value={cat.id}>{cat.name}</option>
               ))}
           </select>
        </div>

        <div>
           <label htmlFor="productFormPrice" className="block text-sm font-medium text-gray-700 mb-1">Default Price (₹)</label>
           <input 
              id="productFormPrice"
              type="number" className="input-field" 
              value={formData.defaultUnitPrice} 
              onChange={e => setFormData({...formData, defaultUnitPrice: e.target.value})}
           />
        </div>

        <div>
           <label htmlFor="productFormNotes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
           <textarea 
             id="productFormNotes"
             className="input-field" rows="3"
             placeholder="Internal notes about this product..."
             value={formData.notes} 
             onChange={e => setFormData({...formData, notes: e.target.value})}
           />
        </div>

        {/* Image Management Section REMOVED for staging */}

        <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
           <button 
             type="button"
             onClick={() => {
                 if (onSuccess) {
                    window.location.hash = ''; // Close modal by clearing hash
                 } else {
                    navigate('/products');
                 }
             }}
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

