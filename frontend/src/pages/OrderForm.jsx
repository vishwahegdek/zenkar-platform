import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import Modal from '../components/Modal';
import Autocomplete from '../components/Autocomplete';
import SmartSelector from '../components/SmartSelector';
import CustomerForm from './CustomerForm';
import ContactForm from '../components/ContactForm';
import ProductForm from './ProductForm';
import { toast } from 'react-hot-toast';

export default function OrderForm() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Local ID state to support seamless "New -> Edit" transition without remounting
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const activeId = paramId || createdOrderId;
  const isEdit = Boolean(activeId);


  
  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState('');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const activeProductRowIndexRef = useRef(null);
  const [tempProductName, setTempProductName] = useState('');
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); // New: Contact Edit

  // Handle Hash Change for Modals
  useEffect(() => {
    const handleHashChange = () => {
        setIsCustomerModalOpen(window.location.hash === '#new-customer');
        setIsProductModalOpen(window.location.hash === '#new-product');
    };
    // Initial check
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Ref to track if we have performed initial load from server
  const initialLoadDone = useRef(false);

  const [formData, setFormData] = useState({
    customerId: null,
    contactId: null, // Add contactId for linking
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'confirmed',
    items: [],
    notes: '',
    advanceAmount: 0,
    paymentMethod: 'CASH',
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
        advanceAmount: Number(order.advanceAmount || 0),
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



  // Generic Save Function
  const saveOrder = async (data) => {
    // Allow 0 for contact-based creation
    if (data.customerId === null || data.customerId === undefined) {
        return toast.error("Please select a customer before saving.");
    }
    // Validate Product IDs (Strict Selection)
    const invalidProducts = data.items.filter(i => i.productName && !i.productId);
    if (invalidProducts.length > 0) {
        return toast.error(`Please select a valid product from the list for: ${invalidProducts.map(i => i.productName).join(', ')}`);
    }

    const payload = {
      ...data,
      customerId: Number(data.customerId) || 0,
      contactId: data.contactId ? Number(data.contactId) : undefined,
      customerPhone: data.customerPhone || '',
      customerAddress: data.customerAddress || '',
      orderDate: data.orderDate ? new Date(data.orderDate).toISOString() : new Date().toISOString(),
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      status: data.status || 'confirmed',
      totalAmount: calculateTotal(),
      advanceAmount: Number(data.advanceAmount) || 0,
      
      items: data.items
        .filter(i => i.productName) // Only include items with product selected or name entered
        .map(i => ({
          ...i,
          productId: i.productId ? Number(i.productId) : undefined,
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
      queryClient.invalidateQueries(['orders']);
      toast.success(isEdit ? 'Order Updated!' : 'Order Created!');
      // Clear any hash fragment and navigate to orders list
      window.location.hash = '';
      navigate('/orders', { replace: true });
      
    } catch (err) {
       toast.error('Failed to save order: ' + err.message);
       console.error(err);
    }
  };

 

  // Handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    saveOrder(formData); // Manual save
  };

  const handleItemChange = (index, field, val) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: val };
    
    // Auto calc total
    if (field === 'quantity' || field === 'unitPrice') {
      item.lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }

    // If field is productName, we don't clear productId here anymore because input is locked if ID exists.
    // If we are here, it means ID is likely null or we are typing in Autocomplete.
    
    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const handleChangeProduct = (index) => {
    const newItems = [...formData.items];
    newItems[index] = {
        ...newItems[index],
        productId: null,
        productName: '',
        unitPrice: 0,
        lineTotal: 0
    };
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
    <div className="max-w-5xl mx-auto pb-24 md:pb-6">
      <form onSubmit={handleSubmit} className="space-y-0 md:space-y-6">
      <div className="flex justify-between items-center p-4 md:p-6 bg-white md:bg-transparent">
        <div className="flex items-center gap-3">
           <h1 className="text-2xl font-bold">{isEdit ? 'Edit Order' : 'New Order'}</h1>
            {/* Auto Save Status Removed */}
        </div>
        
        <button 
          type="button" 
          onClick={() => saveOrder(formData)}
          className="hidden md:block bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50"
        >
          Save Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6">
        {/* Customer Card */}
        <div className="md:col-span-2 bg-white p-4 md:p-6 md:rounded-xl shadow-sm border-y md:border border-gray-200 space-y-4">
          {formData.customerId !== null ? (
            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-lg font-bold text-gray-900">{formData.customerName}</div>
                        <div className="text-gray-600 mt-1 whitespace-pre-wrap">{formData.customerAddress || 'No Address'}</div>
                        <div className="text-gray-600 mt-1">{formData.customerPhone || 'No Phone'}</div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => {
                                if (formData.contactId) {
                                  setIsContactModalOpen(true);
                                } else {
                                  setIsEditCustomerModalOpen(true);
                                }
                            }}
                            className="text-sm text-green-600 hover:text-green-800 font-medium px-3 py-1 hover:bg-green-100 rounded-lg transition-colors border border-transparent hover:border-green-200"
                        >
                            Edit
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFormData({
                                ...formData, 
                                customerId: null, 
                                customerName: '', 
                                customerPhone: '', 
                                customerAddress: ''
                            })}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 hover:bg-blue-100 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                        >
                            Change
                        </button>
                    </div>
                </div>
            </div>
          ) : (
            <div>
                <SmartSelector 
                    label="Customer"
                    type="customer"
                    autoFocus={true}
                    initialValue={formData.customerName}
                    onSelect={(cust) => {
                         if (cust.source === 'new') {
                             setTempCustomerName(cust.name);
                             window.location.hash = 'new-customer';
                             setIsCustomerModalOpen(true);
                         } else {
                             setFormData({
                                 ...formData, 
                                 customerId: cust.id || 0, // 0 for contacts to trigger creation
                                 contactId: cust.contactId,
                                 customerName: cust.name,
                                 customerPhone: cust.phone || '',
                                 customerAddress: cust.address || ''
                             });
                         }
                    }}
                />
            </div>
          )}
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
       <div className="bg-white md:rounded-xl shadow-sm border-b md:border border-gray-200 mt-0 md:mt-0 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Order Items</h2>
          </div>

         <div className="space-y-4">

            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
               <div className="col-span-5 md:col-span-5">Product</div>
               <div className="col-span-2 md:col-span-1 text-center">Qty</div>
               <div className="col-span-3 md:col-span-2 text-right">Price</div>
               <div className="col-span-2 md:col-span-4 text-right">Total</div>
            </div>

             {formData.items.map((item, idx) => (
               <div key={idx} className={`grid grid-cols-12 gap-2 items-start px-3 py-3 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
               }`}>
                  {/* Product Column */}
                  <div className="col-span-5 md:col-span-5 space-y-1">
                     {item.productId ? (
                        <div className="group relative">
                           <div className="font-medium text-sm text-gray-900 truncate">{item.productName}</div>
                           <button 
                               type="button"
                               onClick={() => handleChangeProduct(idx)}
                               className="text-[10px] items-center text-blue-600 hover:text-blue-800 font-medium"
                           >
                               Change
                           </button>
                       </div>
                     ) : (
                        <Autocomplete 
                           value={item.productName}
                           placeholder="Product Name"
                           endpoint="/products"
                           displayKey="name"
                           subDisplayKey="defaultUnitPrice"
                           onChange={(val) => handleItemChange(idx, 'productName', val)}
                           onCreate={(name) => {
                               setTempProductName(name);
                               activeProductRowIndexRef.current = idx;
                               window.location.hash = 'new-product';
                           }}
                           onSelect={(p) => {
                               handleProductSelect(idx, p);
                           }}
                           className="text-sm"
                        />
                     )}
                     <input type="text" placeholder="Description/Size" className="w-full text-xs text-gray-500 placeholder-gray-300 border-none p-0 focus:ring-0 bg-transparent"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                     />
                  </div>

                  {/* Quantity Column */}
                  <div className="col-span-2 md:col-span-1">
                     <input type="number" 
                        className="w-full text-center text-sm border border-gray-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                     />
                  </div>

                  {/* Price Column */}
                  <div className="col-span-3 md:col-span-2">
                     <input type="number" 
                        className="w-full text-right text-sm border border-gray-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                     />
                  </div>

                  {/* Total Column + Remove */}
                  <div className="col-span-2 md:col-span-4 flex flex-col md:flex-row items-end md:items-center justify-between gap-1">
                     <div className="font-medium text-sm text-gray-900 text-right w-full md:w-auto">
                        ₹{item.lineTotal.toLocaleString()}
                     </div>
                     <button 
                        onClick={() => removeItem(idx)} 
                        type="button" 
                        className="text-gray-400 hover:text-red-500 p-1 -mr-2"
                     >
                        <span className="text-lg font-bold">×</span>
                     </button>
                  </div>
               </div>
             ))}
          </div>

          <div className="p-4 md:p-6">
            <button onClick={addItem} type="button" className="w-full md:w-auto text-sm text-primary font-medium hover:underline border border-dashed border-primary/30 p-2 rounded-lg bg-blue-50/50">+ Add Another Item</button>
          </div>

          <div className="border-t border-gray-100 p-4 md:p-6 flex justify-end">
           <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{calculateTotal().toLocaleString()}</span>
              </div>

               {!isEdit && (
               <div className="flex items-center justify-between gap-4">
                 <span className="text-sm text-gray-600">Advance</span>
                 <div className="flex gap-2">
                    <select 
                        className="input-field w-20 py-1 px-1 text-sm"
                        value={formData.paymentMethod}
                        onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                    >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                    </select>
                    <input type="number" className="input-field w-24 text-right"
                        value={formData.advanceAmount}
                        onChange={e => setFormData({...formData, advanceAmount: e.target.value})}
                        placeholder="0"
                    />
                 </div>
               </div>
               )}
               {!isEdit && (
               <div className="flex justify-between text-sm font-medium text-red-600 pt-2 border-t border-gray-100">
                 <span>Balance Due</span>
                 <span>₹{(calculateTotal() - formData.advanceAmount).toLocaleString()}</span>
               </div>
               )}
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

       {/* New Customer Modal */}
       <Modal
         isOpen={isCustomerModalOpen}
         onClose={() => window.location.hash = ''}
         title="Create New Customer"
       >
          <CustomerForm 
             isModal={true}
             initialData={{ name: tempCustomerName }}
             onSuccess={(newCustomer) => {
                 setFormData({
                    ...formData,
                    customerId: newCustomer.id,
                    customerName: newCustomer.name,
                    customerPhone: newCustomer.phone || '',
                    customerAddress: newCustomer.address || ''
                 });
                 // Close modal
                 window.location.hash = '';
             }}
          />
       </Modal>

       {/* Edit Customer Modal */}
       <Modal
         isOpen={isEditCustomerModalOpen}
         onClose={() => setIsEditCustomerModalOpen(false)}
         title="Edit Customer Details"
       >
          <CustomerForm 
             isModal={true}
             id={formData.customerId}
             onSuccess={(updatedCustomer) => {
                 setFormData({
                    ...formData,
                    customerName: updatedCustomer.name,
                    customerPhone: updatedCustomer.phone || '',
                    customerAddress: updatedCustomer.address || ''
                 });
                 setIsEditCustomerModalOpen(false);
             }}
          />
       </Modal>

        {/* Edit Linked Contact Modal */}
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title="Edit Linked Contact"
        >
           <ContactForm 
              isModal={true}
              initialData={{ 
                 id: formData.contactId, 
                 name: formData.customerName, 
                 phone: formData.customerPhone 
              }}
              onSuccess={(updatedContact) => {
                  setFormData({
                     ...formData,
                     customerName: updatedContact.name,
                     customerPhone: updatedContact.phones?.[0]?.value || updatedContact.phone || formData.customerPhone
                  });
                  setIsContactModalOpen(false);
              }}
              onCancel={() => setIsContactModalOpen(false)}
           />
        </Modal>

       {/* New Product Modal */}
       <Modal
          isOpen={isProductModalOpen}
          onClose={() => window.location.hash = ''}
          title="Create New Product"
       >
          <ProductForm
              isModal={true}
              initialData={{ name: tempProductName }}
              onSuccess={(newProduct) => {
                  if (activeProductRowIndexRef.current !== null) {
                      handleProductSelect(activeProductRowIndexRef.current, newProduct);
                  }
                  window.location.hash = '';
              }}
          />
       </Modal>

        {/* Mobile FAB for Save Order */}
         <button 
            onClick={() => saveOrder(formData)}
            className="md:hidden fixed bottom-6 right-6 bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 z-50 text-2xl disabled:opacity-50"
         >
            ✓
         </button>
    </div>
  );
}
