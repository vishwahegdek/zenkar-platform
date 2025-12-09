import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import Modal from '../components/Modal';
import Autocomplete from '../components/Autocomplete';
import { toast } from 'react-hot-toast';

export default function OrderForm() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Local ID state to support seamless "New -> Edit" transition without remounting
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const activeId = paramId || createdOrderId;
  const isEdit = Boolean(activeId);

  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle, saving, saved, error
  
  // Ref to track if we have performed initial load from server
  const initialLoadDone = useRef(false);

  const [formData, setFormData] = useState({
    customerId: null,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'confirmed',
    items: [],
    notes: '',
    advanceAmount: 0,
  });

  // Fetch Order Data if Edit
  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', activeId],
    queryFn: () => api.get(`/orders/${activeId}`),
    enabled: isEdit,
  });

  // Populate Form on Load
  useEffect(() => {
    // Only load data if we have an order AND we haven't loaded it yet.
    // However, if we just created the order locally (createdOrderId), 
    // we already have the data in formData, so we might want to skip overwriting 
    // unless it's a fresh page load (paramId existed from start).
    const isFreshLoad = Boolean(paramId) && !initialLoadDone.current;
    
    if (order && (isFreshLoad || !initialLoadDone.current)) {
      setFormData({
        customerId: order.customerId,
        customerName: order.customer?.name || '',
        customerPhone: order.customer?.phone || '',
        customerAddress: order.customer?.address || '',
        orderDate: order.orderDate.split('T')[0],
        dueDate: order.dueDate ? order.dueDate.split('T')[0] : '',
        status: order.status,
        items: order.items.map(i => ({
           ...i, 
           quantity: Number(i.quantity), 
           unitPrice: Number(i.unitPrice),
           lineTotal: Number(i.lineTotal)
        })),
        notes: order.notes || '',
        advanceAmount: Number(order.advanceAmount),
      });
      initialLoadDone.current = true;
    } else if (!isEdit && !initialLoadDone.current) {
      // Initialize with one empty row for new order
      setFormData(prev => ({ ...prev, items: [{ productName: '', description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]}));
      initialLoadDone.current = true;
    }
  }, [order, isEdit, paramId]);

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  };

  const validateForAutoSave = (data) => {
    // 1. Customer Name present
    if (!data.customerName || data.customerName.trim().length === 0) return false;
    
    // 2. At least one valid item
    const hasValidItem = data.items.some(
      i => i.productName && Number(i.quantity) > 0 && Number(i.unitPrice) > 0
    );
    
    return hasValidItem;
  };

  // Generic Save Function
  const saveOrder = async (data, isAuto = false) => {
    if (isAuto && !validateForAutoSave(data)) return;

    if (isAuto) setAutoSaveStatus('saving');

    const payload = {
      ...data,
      customerId: Number(data.customerId) || 0,
      customerPhone: data.customerPhone || '',
      customerAddress: data.customerAddress || '',
      orderDate: data.orderDate ? new Date(data.orderDate).toISOString() : new Date().toISOString(),
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      status: data.status || 'confirmed',
      totalAmount: calculateTotal(),
      advanceAmount: Number(data.advanceAmount) || 0,
      
      items: data.items
        .filter(i => i.productName || i.quantity > 0)
        .map(i => ({
          ...i,
          quantity: Number(i.quantity) || 0,
          unitPrice: Number(i.unitPrice) || 0,
          lineTotal: Number(i.lineTotal) || 0,
          id: i.id // Keep ID if exists
        }))
    };

    try {
      let result;
      if (isEdit) {
         result = await api.patch(`/orders/${activeId}`, payload);
      } else {
         result = await api.post('/orders', payload);
      }
      
      if (isAuto) {
         setAutoSaveStatus('saved');
         setTimeout(() => setAutoSaveStatus('idle'), 2000);
         
         // If we just created a new order via auto-save, handle transition
         if (!isEdit && result.id) {
            setCreatedOrderId(result.id);
            // Update URL without remounting
            window.history.replaceState(null, '', `/orders/${result.id}/edit`);
            // Mark initial load as done so we don't overwrite user data with server response later
            initialLoadDone.current = true; 
         }
      } else {
         // Manual Save
         toast.success(isEdit ? 'Order updated!' : 'New order added successfully');
         navigate('/orders');
      }
      
      queryClient.invalidateQueries(['orders']);
      
    } catch (err) {
       if (isAuto) setAutoSaveStatus('error');
       else toast.error('Failed to save order: ' + err.message);
       console.error(err);
    }
  };

  // Debounced Auto-Save Effect
  useEffect(() => {
    // Skip if confirming delete or other modal actions?
    const timer = setTimeout(() => {
      saveOrder(formData, true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, activeId]); 

  // Visibility Change / Blur Effect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
         saveOrder(formData, true);
      }
    };
    
    // Also save on window blur?
    const handleBlur = () => {
      saveOrder(formData, true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [formData, activeId]); 

  // Handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    saveOrder(formData, false); // Manual save
  };

  const handleItemChange = (index, field, val) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: val };
    
    // Auto calc total
    if (field === 'quantity' || field === 'unitPrice') {
      item.lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }

    // Clear productId if name changes (implies new product or search started)
    if (field === 'productName') {
      item.productId = null;
    }
    
    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      unitPrice: Number(product.defaultUnitPrice),
      lineTotal: Number(newItems[index].quantity || 0) * Number(product.defaultUnitPrice),
    };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: '', description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  if (isEdit && isLoading && !initialLoadDone.current) return <div className="p-8">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-0 md:space-y-6 pb-24 md:pb-6">
      <div className="flex justify-between items-center p-4 md:p-6 bg-white md:bg-transparent">
        <div className="flex items-center gap-3">
           <h1 className="text-2xl font-bold">{isEdit ? 'Edit Order' : 'New Order'}</h1>
           {/* Auto Save Status Indicator */}
           {autoSaveStatus === 'saving' && <span className="text-xs text-gray-500 animate-pulse">Saving...</span>}
           {autoSaveStatus === 'saved' && <span className="text-xs text-green-600 font-medium">Saved</span>}
           {autoSaveStatus === 'error' && <span className="text-xs text-red-500">Save Failed</span>}
        </div>
        
        <button 
          type="button" 
          onClick={() => saveOrder(formData, false)}
          className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50"
          disabled={autoSaveStatus === 'saving'}
        >
          {autoSaveStatus === 'saving' ? 'Saving...' : 'Save Order'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6">
        {/* Customer Card */}
        <div className="md:col-span-2 bg-white p-4 md:p-6 md:rounded-xl shadow-sm border-y md:border border-gray-200 space-y-4">
          <h2 className="font-semibold text-gray-900">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <Autocomplete 
                label="Customer Name"
                endpoint="/customers"
                placeholder="Search or type new name..."
                value={formData.customerName}
                onChange={(val) => setFormData({...formData, customerName: val, customerId: null})} 
                onSelect={(customer) => setFormData({
                  ...formData, 
                  customerId: customer.id, 
                  customerName: customer.name,
                  customerPhone: customer.phone || '',
                  customerAddress: customer.address || ''
                })}
                subDisplayKey="address"
              />
            </div>
            
            <div className="col-span-full">
               <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <input id="customerAddress" type="text" className="input-field" 
                  value={formData.customerAddress} 
                  onChange={e => setFormData({...formData, customerAddress: e.target.value})}
               />
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input id="customerPhone" type="text" className="input-field" 
                 value={formData.customerPhone} 
                 onChange={e => setFormData({...formData, customerPhone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Order Meta Card */}
        <div className="bg-white p-4 md:p-6 md:rounded-xl shadow-sm border-b md:border border-gray-200 space-y-4 h-fit">
          <h2 className="font-semibold text-gray-900">Order Details</h2>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
              <input type="date" className="input-field" 
                 value={formData.orderDate} 
                 onChange={e => setFormData({...formData, orderDate: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="input-field" 
                 value={formData.dueDate} 
                 onChange={e => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field"
                 value={formData.status} 
                 onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="enquired">Enquired</option>
                <option value="confirmed">Confirmed</option>
                <option value="production">In Production</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="closed">Closed (Archived)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
        </div>
      </div>

       {/* Items Card */}
       <div className="bg-white p-4 md:p-6 md:rounded-xl shadow-sm border-b md:border border-gray-200 mt-0 md:mt-0">
         <div className="mb-4">
           <h2 className="font-semibold text-gray-900">Order Items</h2>
         </div>

         <div className="space-y-4">
           <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase px-2">
             <div className="col-span-4">Product</div>
             <div className="col-span-4">Description</div>
             <div className="col-span-1 text-center">Qty</div>
             <div className="col-span-2 text-right">Price</div>
             <div className="col-span-1 text-right">Total</div>
           </div>

            {formData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg group text-sm border border-gray-100 md:border-none relative">
                 {/* Mobile Delete Button (Top Right) */}
                 <button onClick={() => removeItem(idx)} type="button" className="md:hidden absolute top-2 right-2 text-gray-400 hover:text-red-500 p-2">✕</button>

                 <div className="md:col-span-4">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block md:hidden">Product</label>
                    <Autocomplete 
                       value={item.productName}
                       placeholder="Product Name"
                       endpoint="/products"
                       displayKey="name"
                       subDisplayKey="defaultUnitPrice"
                       onChange={(val) => handleItemChange(idx, 'productName', val)}
                       onSelect={(p) => handleProductSelect(idx, p)}
                    />
                 </div>
                 <div className="md:col-span-4">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block md:hidden">Description</label>
                    <input type="text" placeholder="Description/Size" className="input-field"
                       value={item.description || ''}
                       onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    />
                 </div>
                 
                 <div className="grid grid-cols-3 gap-2 md:contents">
                   <div className="md:col-span-1">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block md:hidden">Qty</label>
                      <input type="number" placeholder="Qty" className="input-field text-center"
                         value={item.quantity}
                         onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                   </div>
                   <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block md:hidden">Price</label>
                      <input type="number" placeholder="Price" className="input-field text-right"
                         value={item.unitPrice}
                         onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      />
                   </div>
                   <div className="md:col-span-1 flex flex-col md:flex-row items-end md:items-center justify-center md:justify-end gap-2 h-full md:h-10">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block md:hidden">Total</label>
                      <span className="font-bold text-gray-900 md:font-medium">₹{item.lineTotal.toLocaleString()}</span>
                      <button onClick={() => removeItem(idx)} type="button" className="hidden md:block text-gray-400 hover:text-red-500 transition-colors" title="Remove Item">×</button>
                   </div>
                 </div>
              </div>
            ))}
         </div>

         <div className="mt-6">
            <button onClick={addItem} type="button" className="w-full md:w-auto text-sm text-primary font-medium hover:underline border border-dashed border-primary/30 p-2 rounded-lg bg-blue-50/50">+ Add Another Item</button>
         </div>

         <div className="mt-8 border-t border-gray-100 pt-8 flex justify-end">
           <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Advance</span>
                <input type="number" className="input-field w-32 text-right"
                   value={formData.advanceAmount}
                   onChange={e => setFormData({...formData, advanceAmount: e.target.value})}
                />
              </div>
              <div className="flex justify-between text-sm font-medium text-red-600 pt-2 border-t border-gray-100">
                <span>Balance Due</span>
                <span>₹{(calculateTotal() - formData.advanceAmount).toLocaleString()}</span>
              </div>
           </div>
         </div>
       </div>
       
       <div className="bg-white p-4 md:p-6 md:rounded-xl shadow-sm border-b md:border border-gray-200 mt-0 md:mt-0">
          <label htmlFor="internalNotes" className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
           <textarea id="internalNotes" className="input-field" rows="3"
             placeholder="Delivery instructions, special requests..."
             value={formData.notes} 
             onChange={e => setFormData({...formData, notes: e.target.value})}
          />
       </div>


    </form>
  );
}
