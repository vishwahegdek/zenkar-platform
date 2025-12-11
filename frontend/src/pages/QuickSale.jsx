import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import Autocomplete from '../components/Autocomplete';
import { toast } from 'react-hot-toast';

export default function QuickSale() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Default to Walk-In, but allow changing
  // We don't have the ID yet, backend will handle "Walk-In" creation if name matches or we can just send name
  const [customer, setCustomer] = useState({ name: 'Walk-In', id: null });
  
  const [items, setItems] = useState([
    { productName: '', description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }
  ]);
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [internalNotes, setInternalNotes] = useState('');

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

    // Clear productId if name changes
    if (field === 'productName') {
      item.productId = null;
    }
    
    newItems[index] = item;
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
    if (!customer.name) {
       return toast.error("Customer name is required");
    }
    
    // Validate items
    const validItems = items.filter(i => i.productName && Number(i.quantity) > 0);
    if (validItems.length === 0) {
        return toast.error("Please add at least one valid product");
    }

    setIsSaving(true);
    try {
        const payload = {
            customerId: customer.id || 0, // 0 triggers new customer logic if needed, but we rely on isQuickSale + name
            customerName: customer.name,
            isQuickSale: true,
            status: 'closed', // Automatically closed
            orderDate: new Date().toISOString(),
            totalAmount: calculateTotal(),
            advanceAmount: calculateTotal(), // Full payment assumed for quick sale? "Payment is a single payment"
            paymentMethod: paymentMethod,
            notes: internalNotes,
            items: validItems.map(i => ({
                ...i,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                lineTotal: Number(i.lineTotal)
            }))
        };

        await api.post('/orders', payload);
        toast.success('Quick Sale Completed!');
        queryClient.invalidateQueries(['orders']);
        navigate('/orders'); 
    } catch (err) {
        console.error(err);
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
        <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Customer</label>
           
           {customer.id || customer.name === 'Walk-In' ? (
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div>
                      <span className="text-lg font-bold text-blue-900">{customer.name}</span>
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
                <Autocomplete 
                    endpoint="/customers"
                    placeholder="Search Customer..."
                    value={customer.name}
                    onChange={(val) => setCustomer({ ...customer, name: val, id: null })} 
                    onSelect={(cust) => setCustomer({ name: cust.name, id: cust.id })}
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
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg border border-gray-100 md:border-none relative">
                      <button onClick={() => removeItem(idx)} className="md:hidden absolute top-2 right-2 text-gray-400">✕</button>
                      
                      <div className="md:col-span-4">
                        <label className="md:hidden text-xs font-bold text-gray-500">Product</label>
                        <Autocomplete 
                           value={item.productName}
                           placeholder="Scan or Search Product"
                           endpoint="/products"
                           displayKey="name"
                           subDisplayKey="defaultUnitPrice"
                           onChange={(val) => handleItemChange(idx, 'productName', val)}
                           onSelect={(p) => handleProductSelect(idx, p)}
                        />
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
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                             />
                          </div>
                          <div className="md:col-span-2">
                             <label className="md:hidden text-xs font-bold text-gray-500">Price</label>
                             <input type="number" className="input-field text-right"
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
                        {['Cash', 'UPI', 'Card', 'Due'].map(method => (
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
                 </div>
                 <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Internal Notes</label>
                    <textarea 
                       className="input-field w-full h-[88px]" 
                       placeholder="Optional notes..."
                       value={internalNotes}
                       onChange={(e) => setInternalNotes(e.target.value)}
                    />
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
    </div>
  );
}
