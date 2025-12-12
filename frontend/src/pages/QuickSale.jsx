import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../api';
import Autocomplete from '../components/Autocomplete';
import SmartSelector from '../components/SmartSelector';
import Modal from '../components/Modal';
import ProductForm from './ProductForm';
import CustomerForm from './CustomerForm';

export default function QuickSale() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Default to Walk-In, but allow changing
  // We don't have the ID yet, backend will handle "Walk-In" creation if name matches or we can just send name
  // Default to Walk-In, but allow changing
  // We don't have the ID yet, backend will handle "Walk-In" creation if name matches or we can just send name
  const [customer, setCustomer] = useState({ name: 'Walk-In', id: null, phone: '' });
  
  const [items, setItems] = useState([
    { productName: '', description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }
  ]);
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customPayments, setCustomPayments] = useState([{ method: 'Cash', amount: '' }]);
  const [internalNotes, setInternalNotes] = useState('');

  // Validation State
  const [invalidItems, setInvalidItems] = useState([]); // indices of invalid rows
  const [isCustomerInvalid, setIsCustomerInvalid] = useState(false);
  const itemRefs = useRef([]); // To scroll to invalid items
  const customerRef = useRef(null);

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState('');

  // Modal State for Product Creation
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [tempProductName, setTempProductName] = useState('');
  const [activeProductRowIndex, setActiveProductRowIndex] = useState(null);

  // Check hatch for modal
  // Check hatch for modal
  useEffect(() => {
     const handleHashChange = () => {
         setIsProductModalOpen(window.location.hash === '#new-product');
         setIsCustomerModalOpen(window.location.hash === '#new-customer');
     };
     
     // Initial check
     handleHashChange();
     window.addEventListener('hashchange', handleHashChange);
     return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  };

  const handleItemChange = (index, field, val) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: val };
    
    // Auto calc total
    if (field === 'quantity' || field === 'unitPrice') {
      item.lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }

    // If field is productName, we don't clear productId here anymore for the same reason
    
    newItems[index] = item;
    newItems[index] = item;
    setItems(newItems);
    
    // Clear invalid status if user is editing
    if (invalidItems.includes(index)) {
        setInvalidItems(prev => prev.filter(i => i !== index));
    }
  };

  const handleChangeProduct = (index) => {
    const newItems = [...items];
    newItems[index] = {
        ...newItems[index],
        productId: null,
        productName: '',
        unitPrice: 0,
        lineTotal: 0
    };
    setItems(newItems);
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      unitPrice: Number(product.defaultUnitPrice),
      lineTotal: Number(newItems[index].quantity || 0) * Number(product.defaultUnitPrice),
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productName: '', description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // 1. Validate Customer
    if (!customer.name) {
       setIsCustomerInvalid(true);
       toast.error("Customer name is required");
       if (customerRef.current) {
           customerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
       return;
    }
    
    // 2. Validate All Items (Strict - no empty rows allowed if they are visible)
    const newInvalidItems = [];
    items.forEach((item, index) => {
        const isNameEmpty = !item.productName;
        const isIdMissing = item.productName && !item.productId; // Typed but not selected
        const isQtyInvalid = Number(item.quantity) <= 0;
        
        if (isNameEmpty || isIdMissing || isQtyInvalid) {
            newInvalidItems.push(index);
        }
    });

    if (newInvalidItems.length > 0) {
        setInvalidItems(newInvalidItems);
        toast.error("Please fill in all mandatory fields (Product, Quantity) for all items.");
        
        // Scroll to first invalid item
        const firstInvalidIndex = newInvalidItems[0];
        if (itemRefs.current[firstInvalidIndex]) {
            itemRefs.current[firstInvalidIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // items is now guaranteed valid
    const validItems = items;

    setIsSaving(true);
    try {
        const payload = {
            customerId: customer.id || 0, // 0 triggers new customer logic if needed, but we rely on isQuickSale + name
            customerName: customer.name,
            customerPhone: customer.phone, // Send phone for creation from contact
            contactId: customer.contactId, // Pass contactId for linking
            isQuickSale: true,
            status: 'closed', // Automatically closed
            orderDate: new Date().toISOString(),
            totalAmount: calculateTotal(),
            totalAmount: calculateTotal(),
            // Logic for payments:
            // If Due -> payments = [] (balance remains)
            // If Custom -> payments = customPayments
            // Else -> payments = [{ amount: total, method: paymentMethod }]
            payments: paymentMethod === 'Due' ? [] 
                    : paymentMethod === 'Custom' ? customPayments.map(p => ({ ...p, amount: Number(p.amount) }))
                    : [{ amount: calculateTotal(), method: paymentMethod }],
            
            advanceAmount: 0, // Legacy fallback, handled by payments now
            paymentMethod: paymentMethod === 'Custom' ? 'Split' : paymentMethod,
            notes: internalNotes,
            items: validItems.map(i => ({
                ...i,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                lineTotal: Number(i.lineTotal)
            }))
        };

        console.log("Starting Quick Sale Save...", payload);
        const result = await api.post('/orders', payload);
        console.log("API Success:", result);
        
        toast.success('Quick Sale Completed!');
        
        console.log("Invalidating queries...");
        await queryClient.invalidateQueries(['orders']);
        
        console.log("Navigating to history...");
        navigate('/orders?view=history');
        console.log("Navigation called.");
    } catch (err) {
        console.error("Save Failed:", err);
        toast.error('Failed to complete sale: ' + (err.response?.data?.message || err.message));
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="flex justify-between items-center p-4 md:p-6 bg-white md:bg-transparent">
         <h1 className="text-2xl font-bold text-gray-800">Quick Sale</h1>
         <button 
           onClick={handleSave}
           disabled={isSaving}
           className="hidden md:block bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 shadow-lg disabled:opacity-50 transform transition active:scale-95"
         >
           {isSaving ? 'Processing...' : 'Complete Sale (₹' + calculateTotal().toLocaleString() + ')'}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Customer Section */}
         <div 
            ref={customerRef}
            className={`md:col-span-3 bg-white p-6 rounded-xl shadow-sm border transition-colors ${
                isCustomerInvalid ? 'border-red-500 bg-red-50' : 'border-gray-100'
            }`}
        >
            <label className={`text-sm font-semibold uppercase tracking-wider mb-2 block ${isCustomerInvalid ? 'text-red-600' : 'text-gray-500'}`}>
                Customer <span className="text-red-500">*</span>
            </label>
            
            {customer.name ? (
               <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                   <div>
                       <span className="text-lg font-bold text-blue-900">{customer.name}</span>
                       <span className="block text-sm text-blue-700">{customer.phone}</span>
                       {customer.name === 'Walk-In' && <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">Default</span>}
                   </div>
                   <button 
                     onClick={() => setCustomer({ name: '', id: null })}
                     className="text-sm text-blue-600 font-medium hover:underline"
                   >
                     Change
                   </button>
               </div>
            ) : (
                 <SmartSelector 
                     label="Search Customer..."
                     type="customer"
                     autoFocus={true}
                     initialValue={customer.name === 'Walk-In' ? '' : customer.name} // Don't prepopulate Walk-In if searching
                      onSelect={(cust) => {
                          console.log('QuickSale: onSelect triggered', cust);
                          if (cust.source === 'new') {
                              console.log('QuickSale: Opening New Customer Modal');
                              setTempCustomerName(cust.name);
                              window.location.hash = 'new-customer';
                              setIsCustomerModalOpen(true);
                          } else {
                              console.log('QuickSale: Customer Selected', cust);
                              setCustomer({ 
                                  name: cust.name, 
                                  id: cust.id, 
                                  contactId: cust.contactId, 
                                  phone: cust.phone,
                                  source: cust.source
                              });
                              setIsCustomerInvalid(false);
                          }
                      }}
                 />
            )}
         </div>

        {/* Items Section */}
        <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h2 className="text-lg font-bold text-gray-800 mb-4">Items</h2>
           
           <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase px-2">
                 <div className="col-span-4">Product</div>
                 <div className="col-span-4">Description</div>
                 <div className="col-span-1 text-center">Qty</div>
                 <div className="col-span-2 text-right">Price</div>
                 <div className="col-span-1 text-right">Total</div>
              </div>

              {items.map((item, idx) => (
                  <div 
                        key={idx} 
                        ref={el => itemRefs.current[idx] = el}
                        className={`grid grid-cols-1 md:grid-cols-12 gap-2 items-start p-3 md:p-0 rounded-lg border relative transition-colors ${
                            invalidItems.includes(idx) 
                            ? 'bg-red-50 border-red-500 shadow-sm' 
                            : 'bg-gray-50 md:bg-transparent border-gray-100 md:border-none'
                        }`}
                    >
                      <button onClick={() => removeItem(idx)} className="md:hidden absolute top-2 right-2 text-gray-400">✕</button>
                      
                      <div className="md:col-span-4">
                         <label className="md:hidden text-xs font-bold text-gray-500">Product</label>
                         
                         {item.productId ? (
                             <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                <span className="font-medium text-gray-800 truncate pr-2">{item.productName}</span>
                                <button 
                                    type="button"
                                    onClick={() => handleChangeProduct(idx)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
                                >
                                    Change
                                </button>
                            </div>
                         ) : (
                            <Autocomplete 
                                value={item.productName}
                                autoFocus={true}
                                placeholder="Scan or Search Product"
                                endpoint="/products"
                                displayKey="name"
                                subDisplayKey="defaultUnitPrice"
                                onChange={(val) => handleItemChange(idx, 'productName', val)}
                                onCreate={(name) => {
                                   setTempProductName(name);
                                   setActiveProductRowIndex(idx);
                                   window.location.hash = 'new-product';
                                   setIsProductModalOpen(true); // Explicitly open
                                }}
                                onSelect={(p) => handleProductSelect(idx, p)}
                            />
                         )}
                      </div>
                      <div className="md:col-span-4">
                        <label className="md:hidden text-xs font-bold text-gray-500">Description</label>
                         <input type="text" className="input-field" placeholder="Notes"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                         />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 md:contents">
                          <div className="md:col-span-1">
                             <label className="md:hidden text-xs font-bold text-gray-500">Qty</label>
                             <input type="number" className="input-field text-center"
                                aria-label="Quantity"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                             />
                          </div>
                          <div className="md:col-span-2">
                             <label className="md:hidden text-xs font-bold text-gray-500">Price</label>
                             <input type="number" className="input-field text-right"
                                aria-label="Price"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                             />
                          </div>
                          <div className="md:col-span-1 flex items-center justify-end font-bold text-gray-800">
                             <span className="md:hidden mr-2 text-xs font-normal text-gray-500">Total:</span>
                             ₹{item.lineTotal.toLocaleString()}
                          </div>
                      </div>
                      
                      <button onClick={() => removeItem(idx)} className="hidden md:block col-span-1 text-gray-400 hover:text-red-500 text-xl font-bold pb-2">×</button>
                  </div>
              ))}
           </div>
           
           <button onClick={addItem} className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors">
              + Add Another Item
           </button>

           <div className="mt-6 flex justify-end items-center gap-4 pt-4 border-t border-gray-100">
               <span className="text-xl font-medium text-gray-600">Total Amount:</span>
               <span className="text-3xl font-bold text-gray-900">₹{calculateTotal().toLocaleString()}</span>
           </div>
        </div>
        
        <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Cash', 'UPI', 'Card', 'Due', 'Custom'].map(method => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`px-4 py-2 rounded-lg border font-medium text-sm transition-all ${
                                    paymentMethod === method 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>

                    {paymentMethod === 'Custom' && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Split Payments</h4>
                            {customPayments.map((p, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <select 
                                        className="input-field w-1/3 text-sm py-1"
                                        value={p.method}
                                        onChange={e => {
                                            const newP = [...customPayments];
                                            newP[idx].method = e.target.value;
                                            setCustomPayments(newP);
                                        }}
                                    >
                                        <option>Cash</option>
                                        <option>UPI</option>
                                        <option>Card</option>
                                        <option>Cheque</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        className="input-field w-1/3 text-sm py-1" 
                                        placeholder="Amount"
                                        value={p.amount}
                                        onChange={e => {
                                            const newP = [...customPayments];
                                            newP[idx].amount = e.target.value;
                                            setCustomPayments(newP);
                                        }}
                                    />
                                    {idx > 0 && (
                                        <button 
                                            onClick={() => setCustomPayments(customPayments.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700 px-2"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div className="flex justify-between items-center text-xs">
                                <button 
                                    onClick={() => setCustomPayments([...customPayments, { method: 'Cash', amount: '' }])}
                                    className="text-blue-600 font-medium hover:underline"
                                >
                                    + Add Split
                                </button>
                                <span className={
                                    calculateTotal() - customPayments.reduce((s, p) => s + Number(p.amount), 0) !== 0 
                                    ? "text-red-600 font-bold" : "text-green-600 font-bold"
                                }>
                                    Rem: {(calculateTotal() - customPayments.reduce((s, p) => s + Number(p.amount), 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                 </div>
                 <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Internal Notes</label>
                    <textarea 
                        className="input-field w-full h-24" 
                        placeholder="Add note..."
                        value={internalNotes}
                        onChange={e => setInternalNotes(e.target.value)}
                    ></textarea>
                 </div>
            </div>
        </div>
      </div>

      {/* Mobile FAB for Complete Sale */}
      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="md:hidden fixed bottom-6 right-6 bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 z-50 text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? '...' : '✓'}
      </button>

      <Modal
         isOpen={isProductModalOpen}
         onClose={() => window.location.hash = ''}
         title="Create New Product"
      >
         <ProductForm
             isModal={true}
             initialData={{ name: tempProductName }}
             onSuccess={(newProduct) => {
                 if (activeProductRowIndex !== null) {
                     handleProductSelect(activeProductRowIndex, newProduct);
                 }
                 window.location.hash = '';
             }}
         />
      </Modal>

      {/* Customer Modal */}
      <Modal
         isOpen={isCustomerModalOpen}
         onClose={() => window.location.hash = ''}
         title="Create New Customer"
      >
         <CustomerForm 
             isModal={true}
             initialData={{ name: tempCustomerName }}
             onSuccess={(newCustomer) => {
                 setCustomer({
                    name: newCustomer.name, 
                    id: newCustomer.id, // now we have a real ID
                    contactId: null, 
                    source: 'created'
                 });
                 setIsCustomerInvalid(false);
                 window.location.hash = '';
             }}
         />
      </Modal>
    </div>
  );
}
