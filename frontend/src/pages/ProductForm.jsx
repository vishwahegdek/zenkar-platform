import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';
import { Calculator, Box, Trash2, ArrowLeft, Loader2, Sparkles, Plus } from 'lucide-react';
import ProductPhotoUploader from '../components/ProductPhotoUploader';
import ProductEstimateModal from '../components/ProductEstimateModal';

export default function ProductForm({ onSuccess, onCancel, initialData, isModal = false }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const id = paramId;
  const isEdit = Boolean(id);

  // Fetch Categories
  const { data: categories, isError: isCategoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => api.get('/product-categories').then((res) => res || []),
  });

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    defaultUnitPrice: 0,
    categoryId: '',
    notes: '',
    isPurchasable: false,
    stockQuantity: 0,
    estimateData: null,
  });

  const [pendingFiles, setPendingFiles] = useState([]);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);

  // Fetch Product Data if Edit
  const { data: product, isLoading, refetch: refetchProduct } = useQuery({
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
        isPurchasable: product.isPurchasable || false,
        stockQuantity: product.stockQuantity || 0,
        estimateData: product.estimateData || null,
      });
    } else if (categories && !isEdit) {
      // Default to "General"
      const generalCat = categories.find((c) => c.name === 'General');
      setFormData((prev) => ({
        ...prev,
        name: initialData?.name || prev.name,
        categoryId: generalCat ? generalCat.id : prev.categoryId,
      }));
    }
  }, [product, categories, isEdit, initialData]);

  // Handle returned estimate from Wood Estimator
  useEffect(() => {
    if (location.state?.appliedEstimate) {
      const { estimateData, quotedAmount, finalCost } = location.state.appliedEstimate;
      const price = Number(quotedAmount ?? finalCost) || 0;
      setFormData((prev) => ({
        ...prev,
        ...(location.state.savedFormData || {}),
        estimateData: estimateData,
        defaultUnitPrice: price > 0 ? price : prev.defaultUnitPrice,
      }));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleOpenWoodEstimator = () => {
    navigate('/wood-estimator', {
      state: {
        returnToProduct: {
          productId: isEdit ? id : null,
          productName: formData.name || 'New Product',
          formData: formData,
          isProductForm: true,
          returnUrl: isEdit ? `/products/${id}/edit` : '/products/new',
          quotedAmount: formData.defaultUnitPrice || formData.estimateData?.quotedAmount || null,
          notes: formData.notes || formData.estimateData?.notes || '',
        },
        loadEstimate: formData.estimateData
          ? {
              name: formData.name || 'Product Estimate',
              data: formData.estimateData,
              id: formData.savedEstimateId || null,
            }
          : null,
      },
    });
  };

  // Mutations
  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        defaultUnitPrice: Number(data.defaultUnitPrice) || 0,
        categoryId: Number(data.categoryId),
        estimateData: data.estimateData || null,
      };

      let result;
      if (isEdit) {
        result = await api.patch(`/products/${id}`, payload);
      } else {
        result = await api.post('/products', payload);
        // Upload pending photos if any
        if (pendingFiles.length > 0 && result?.id) {
          const form = new FormData();
          pendingFiles.forEach((file) => {
            form.append('files', file);
          });
          try {
            await api.post(`/products/${result.id}/images`, form);
          } catch (uploadErr) {
            console.warn('Photos upload failed after product creation:', uploadErr);
          }
        }
      }
      return result;
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
    onError: (err) => toast.error('Failed: ' + (err.response?.data?.message || err.message)),
  });

  if (isEdit && isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const containerClasses = isModal ? '' : 'max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-12';
  const formClasses = isModal
    ? 'space-y-4'
    : 'bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4 sm:space-y-5';

  return (
    <div className={containerClasses}>
      {!isModal && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Product' : 'New Product'}
            </h1>
          </div>
        </div>
      )}

      <div className={formClasses}>
        {/* Name */}
        <div>
          <label htmlFor="productFormName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="productFormName"
            type="text"
            className="input-field w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Teak Wood Main Door Frame (5x3)"
            autoFocus
          />
        </div>

        {/* Category & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="productFormCategory" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            {isCategoriesError ? (
              <div className="text-red-500 text-xs mb-1">
                Failed to load categories.
                <button type="button" onClick={() => refetchCategories()} className="underline ml-1">
                  Retry
                </button>
              </div>
            ) : null}
            <select
              id="productFormCategory"
              className="input-field w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="productFormPrice" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Default Price (₹)
            </label>
            <input
              id="productFormPrice"
              type="number"
              className="input-field w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-gray-900"
              value={formData.defaultUnitPrice}
              onChange={(e) => setFormData({ ...formData, defaultUnitPrice: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>

        {/* PRODUCT PHOTOS SECTION */}
        <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200/80">
          <ProductPhotoUploader
            productId={isEdit ? product?.id : null}
            existingImages={isEdit ? product?.images || [] : []}
            pendingFiles={pendingFiles}
            onPendingFilesChange={setPendingFiles}
            onImagesUploaded={() => {
              if (refetchProduct) refetchProduct();
            }}
            onImageDeleted={() => {
              if (refetchProduct) refetchProduct();
            }}
          />
        </div>

        {/* ESTIMATE COPY SECTION */}
        <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Estimate Copy
                </h3>
                <p className="text-[11px] text-gray-500">
                  {formData.estimateData
                    ? 'Estimate copy attached to this product'
                    : 'Attach Door Frame or Custom Blocks estimation specs'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenWoodEstimator}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              {formData.estimateData ? 'Edit in Wood Estimator' : 'Attach Estimate'}
            </button>
          </div>

          {formData.estimateData && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 capitalize">
                  {formData.estimateData.activeTemplate === 'door_frame' ? 'Door Frame Template' : 'Custom Blocks Template'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenWoodEstimator}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  >
                    <Calculator className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, estimateData: null })}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Detach
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-gray-600">
                {formData.estimateData.dfThicknessOption && (
                  <div>
                    <span className="text-[10px] text-gray-400 block">Thickness</span>
                    <span className="font-medium text-gray-900">{formData.estimateData.dfThicknessOption}"</span>
                  </div>
                )}
                {formData.estimateData.dfWidth && formData.estimateData.dfHeight && (
                  <div>
                    <span className="text-[10px] text-gray-400 block">Dimensions</span>
                    <span className="font-medium text-gray-900">
                      {formData.estimateData.dfWidth}{formData.estimateData.dfWidthUnit || 'ft'} × {formData.estimateData.dfHeight}{formData.estimateData.dfHeightUnit || 'ft'}
                    </span>
                  </div>
                )}
                {formData.estimateData.totalVolumeCft && (
                  <div>
                    <span className="text-[10px] text-gray-400 block">Volume</span>
                    <span className="font-medium text-gray-900">{Number(formData.estimateData.totalVolumeCft).toFixed(2)} CFT</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center">
                <span className="text-gray-500">
                  Estimate: <strong className="text-gray-800">₹{Number(formData.estimateData.finalCost || 0).toLocaleString()}</strong>
                </span>
                <span className="text-blue-700 font-bold">
                  Quote: ₹{Number(formData.estimateData.quotedAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Section */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <input
                id="trackInventory"
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={formData.isPurchasable}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPurchasable: e.target.checked }))}
              />
              <label
                htmlFor="trackInventory"
                className="text-xs font-bold text-gray-800 uppercase tracking-wider select-none cursor-pointer"
              >
                Track Inventory Stock
              </label>
            </div>
            {formData.isPurchasable && isEdit && (
              <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 text-xs shadow-xs">
                Current Stock:{' '}
                <span className="font-bold text-base text-gray-900 ml-1">
                  {formData.stockQuantity}
                </span>
              </div>
            )}
          </div>
          {formData.isPurchasable && (
            <p className="text-xs text-gray-500">
              Stock increases with purchases and decreases when delivered in orders.
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="productFormNotes" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Internal Notes
          </label>
          <textarea
            id="productFormNotes"
            className="input-field w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            rows={3}
            placeholder="Catalog specifications, wood grade, finishing instructions..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Form Footer Actions */}
        <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else if (onSuccess) {
                window.location.hash = '';
              } else {
                navigate('/products');
              }
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate(formData)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            disabled={mutation.isPending || !formData.name}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Product'
            )}
          </button>
        </div>
      </div>

      {/* Estimate Modal */}
      {isEstimateModalOpen && (
        <ProductEstimateModal
          isOpen={isEstimateModalOpen}
          onClose={() => setIsEstimateModalOpen(false)}
          product={{
            ...formData,
            id: isEdit ? product?.id : null,
          }}
          onEstimateSaved={(updated) => {
            if (updated?.estimateData) {
              setFormData((prev) => ({
                ...prev,
                estimateData: updated.estimateData,
                defaultUnitPrice: updated.estimateData.quotedAmount || prev.defaultUnitPrice,
              }));
            }
          }}
        />
      )}
    </div>
  );
}
