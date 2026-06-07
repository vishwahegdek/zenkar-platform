import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';
import SmartSelector from '../components/SmartSelector';
import Modal from '../components/Modal';
import SupplierForm from '../components/SupplierForm';
import ProductForm from './ProductForm';

export default function PurchaseForm() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEdit = Boolean(paramId);
  const initialLoadDone = useRef(false);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [tempContactName, setTempContactName] = useState('');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [tempProductIndex, setTempProductIndex] = useState(null);
  const [tempProductName, setTempProductName] = useState('');

  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'RECEIVED',
    notes: '',
    discount: 0,
    shippingCost: 0,
    items: [{ productId: '', quantity: 1, unitCost: 0, lineTotal: 0 }],
    advanceAmount: 0,
    paymentMethod: 'CASH',
    payments: [],
  });

  const { data: purchase, isLoading: isPurchaseLoading } = useQuery({
    queryKey: ['purchases', paramId],
    queryFn: () => api.get(`/purchases/${paramId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (purchase && !initialLoadDone.current) {
      setFormData({
        supplierId: purchase.supplierId,
        supplierName: purchase.supplier?.name || '',
        purchaseDate: purchase.purchaseDate.split('T')[0],
        status: purchase.status || 'RECEIVED',
        notes: purchase.notes || '',
        discount: Number(purchase.discount || 0),
        shippingCost: Number(purchase.shippingCost || 0),
        items: purchase.items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          lineTotal: Number(i.lineTotal)
        })),
        payments: purchase.payments ? purchase.payments.map(p => ({
          amount: Number(p.amount),
          method: p.method,
          date: p.date ? p.date.split('T')[0] : new Date().toISOString().split('T')[0],
          note: p.note || ''
        })) : [],
        advanceAmount: 0,
        paymentMethod: 'CASH',
      });
      initialLoadDone.current = true;
    } else if (!isEdit && !initialLoadDone.current) {
      initialLoadDone.current = true;
    }
  }, [purchase, isEdit]);

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products?limit=1000'),
  });
  const products = (Array.isArray(productsData) ? productsData : (productsData?.data || [])).filter(p => p.isPurchasable);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitCost: 0, lineTotal: 0 }]
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'productId') {
        if (value === 'NEW') {
            setTempProductIndex(index);
            setTempProductName('');
            setIsProductModalOpen(true);
            return;
        }
        const prod = products.find(p => p.id == value);
        if (prod) {
            item.unitCost = prod.defaultUnitPrice || 0;
        }
    }

    item.lineTotal = Number(item.quantity) * Number(item.unitCost);
    newItems[index] = item;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleAddPayment = () => {
    setFormData(prev => ({
      ...prev,
      payments: [...prev.payments, { amount: '', method: 'CASH', date: new Date().toISOString().split('T')[0], note: '' }]
    }));
  };

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...formData.payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setFormData(prev => ({ ...prev, payments: newPayments }));
  };

  const handleRemovePayment = (index) => {
    setFormData(prev => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index)
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + Number(formData.shippingCost) - Number(formData.discount);
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        supplierId: Number(data.supplierId),
        discount: Number(data.discount),
        shippingCost: Number(data.shippingCost),
        items: data.items.map(item => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            unitCost: Number(item.unitCost)
        })),
        payments: isEdit ? data.payments.map(p => ({
            amount: Number(p.amount),
            method: p.method,
            date: p.date,
            note: p.note
        })) : (Number(data.advanceAmount) > 0 ? [{
          amount: Number(data.advanceAmount),
          method: data.paymentMethod
        }] : undefined)
      };

      if (isEdit) {
        return api.patch(`/purchases/${paramId}`, payload);
      }
      return api.post('/purchases', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      toast.success(`Purchase ${isEdit ? 'updated' : 'recorded'} successfully`);
      navigate('/purchases');
    },
    onError: (err) => toast.error('Failed: ' + (err.response?.data?.message || err.message))
  });

  if (isEdit && isPurchaseLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Purchase' : 'New Purchase'}</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            {formData.supplierId ? (
                <div className="flex justify-between items-center bg-blue-50 p-2 rounded-md border border-blue-200">
                    <span className="font-medium text-gray-900">{formData.supplierName}</span>
                    <button 
                        onClick={() => setFormData({ ...formData, supplierId: '', supplierName: '' })}
                        className="text-xs text-blue-600 font-bold uppercase hover:text-blue-800"
                    >
                        Change
                    </button>
                </div>
            ) : (
                <SmartSelector 
                    label="" 
                    type="supplier"
                    onSelect={(item) => {
                        if (item.source === 'new') {
                             setTempContactName(item.name);
                             setIsContactModalOpen(true);
                        } else {
                             setFormData({ ...formData, supplierId: item.contactId || item.id, supplierName: item.name });
                        }
                    }}
                />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              className="w-full border-gray-200 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.purchaseDate}
              onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border-gray-200 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
            <div className="-mx-6 border-y border-gray-200">
                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-2 px-3 py-2 text-xs font-bold text-gray-500 uppercase">
                <div className="col-span-5 md:col-span-5">Product</div>
                <div className="col-span-2 md:col-span-2 text-center">Qty</div>
                <div className="col-span-3 md:col-span-3 text-right">Unit Cost</div>
                <div className="col-span-2 md:col-span-2 text-right">Total</div>
                </div>

                <div className="divide-y divide-gray-100">
                    {formData.items.map((item, index) => (
                        <div key={index} className={`grid grid-cols-12 gap-2 items-center px-3 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <div className="col-span-5 md:col-span-5">
                                <SmartSelector
                                    label=""
                                    type="product"
                                    initialValue={item.productId ? products.find(p => p.id === item.productId)?.name || '' : ''}
                                    onSelect={(selectedItem) => {
                                        if (selectedItem.source === 'new') {
                                            setTempProductIndex(index);
                                            setTempProductName(selectedItem.name);
                                            setIsProductModalOpen(true);
                                        } else {
                                            const newItems = [...formData.items];
                                            const updatedItem = { 
                                                ...newItems[index], 
                                                productId: selectedItem.id, 
                                                unitCost: selectedItem.defaultUnitPrice || 0 
                                            };
                                            updatedItem.lineTotal = Number(updatedItem.quantity) * Number(updatedItem.unitCost);
                                            newItems[index] = updatedItem;
                                            setFormData(prev => ({ ...prev, items: newItems }));
                                        }
                                    }}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <input
                                    type="number" min="1"
                                    className="w-full text-center text-xs md:text-sm border-gray-200 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                />
                            </div>
                            <div className="col-span-3 md:col-span-3">
                                <input
                                    type="number" min="0" step="0.01"
                                    className="w-full text-right text-xs md:text-sm border-gray-200 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                                    value={item.unitCost}
                                    onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-2 flex items-center justify-between gap-1">
                                <div className="font-medium text-xs md:text-sm text-gray-900 w-full text-right">
                                    {(item.quantity * item.unitCost).toLocaleString()}
                                </div>
                                <button onClick={() => handleRemoveItem(index)} className="text-gray-400 hover:text-red-500 p-1 -mr-2">
                                    <span className="text-lg font-bold">×</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <button onClick={handleAddItem} className="w-full py-3 text-center text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border-t border-blue-100 uppercase">
                    + Add Item
                </button>
            </div>
        </div>

        {/* Totals & Payments Footer */}
        <div className="flex flex-col items-end border-t border-gray-200 pt-4 gap-4">
             <div className="w-full md:w-80 space-y-3">
                 <div className="flex justify-between text-sm text-gray-600">
                     <span>Subtotal</span>
                     <span>₹ {calculateSubtotal().toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm text-gray-600">
                     <span>Shipping Cost (+)</span>
                     <input type="number" className="w-24 border-gray-200 rounded-md p-1 text-right focus:ring-blue-500"
                        value={formData.shippingCost} onChange={e => setFormData({...formData, shippingCost: e.target.value})} />
                 </div>
                 <div className="flex justify-between items-center text-sm text-gray-600 border-b border-gray-100 pb-3">
                     <span>Discount (-)</span>
                     <input type="number" className="w-24 border-gray-200 rounded-md p-1 text-right focus:ring-blue-500"
                        value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
                 </div>
                 
                 <div className="flex justify-between text-lg font-bold text-gray-900">
                     <span>Net Total</span>
                     <span>₹ {calculateGrandTotal().toLocaleString()}</span>
                 </div>

                 {isEdit && (
                     <div className="mt-6 border-t border-gray-200 pt-4">
                         <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Payments History</h3>
                         <div className="space-y-2 mb-3">
                             {formData.payments.map((p, idx) => (
                                 <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-100">
                                     <input type="date" className="w-28 text-xs border-gray-200 rounded p-1" value={p.date} onChange={e => handlePaymentChange(idx, 'date', e.target.value)} />
                                     <input type="number" className="w-24 text-xs border-gray-200 rounded p-1 text-right" placeholder="Amount" value={p.amount} onChange={e => handlePaymentChange(idx, 'amount', e.target.value)} />
                                     <select className="w-16 text-xs border-gray-200 rounded p-1" value={p.method} onChange={e => handlePaymentChange(idx, 'method', e.target.value)}>
                                         <option value="CASH">CASH</option>
                                         <option value="UPI">UPI</option>
                                     </select>
                                     <button onClick={() => handleRemovePayment(idx)} className="text-red-400 hover:text-red-600 font-bold ml-auto px-2">×</button>
                                 </div>
                             ))}
                             {formData.payments.length === 0 && <div className="text-xs text-gray-500 italic">No payments recorded.</div>}
                         </div>
                         <button onClick={handleAddPayment} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                             + Record New Payment
                         </button>
                         <div className="flex justify-between text-sm font-bold text-gray-700 mt-3 pt-3 border-t border-gray-100">
                             <span>Total Paid</span>
                             <span className="text-green-600">₹ {formData.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString()}</span>
                         </div>
                         {(calculateGrandTotal() - formData.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)) > 0 && (
                            <div className="flex justify-between text-sm font-bold text-red-600 mt-1">
                                <span>Balance Due</span>
                                <span>₹ {(calculateGrandTotal() - formData.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)).toLocaleString()}</span>
                            </div>
                         )}
                     </div>
                 )}

                 {!isEdit && (
                 <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                     <span className="text-sm font-medium text-gray-700">Advance Paid</span>
                     <div className="flex gap-2">
                        <select className="border-gray-200 rounded-md p-1 text-sm focus:ring-blue-500"
                            value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI</option>
                        </select>
                        <input type="number" className="w-24 border-gray-200 rounded-md p-1 text-right focus:ring-blue-500"
                            value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} placeholder="0" />
                     </div>
                 </div>
                 )}
                 {!isEdit && formData.advanceAmount > 0 && (
                     <div className="flex justify-between text-sm font-bold text-red-600">
                         <span>Balance Due</span>
                         <span>₹ {(calculateGrandTotal() - formData.advanceAmount).toLocaleString()}</span>
                     </div>
                 )}
             </div>

             <div className="flex gap-3 w-full justify-end mt-4">
                 <button onClick={() => navigate('/purchases')} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                     Cancel
                 </button>
                 <button 
                    onClick={() => mutation.mutate(formData)}
                    disabled={mutation.isPending || formData.items.length === 0 || !formData.supplierId}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                 >
                     {mutation.isPending ? 'Saving...' : (isEdit ? 'Update Purchase' : 'Save Purchase')}
                 </button>
             </div>
        </div>
      </div>

      <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title="Create New Supplier">
          <SupplierForm 
             initialData={{ name: tempContactName }}
             onSuccess={(newSupplier) => {
                 setFormData({ ...formData, supplierId: newSupplier.id, supplierName: newSupplier.name });
                 setIsContactModalOpen(false);
             }}
             onCancel={() => setIsContactModalOpen(false)}
          />
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Create New Product">
          <ProductForm 
             isModal={true}
             initialData={{ name: tempProductName, isPurchasable: true }}
             onSuccess={(newProduct) => {
                 // Wait a tick for products to refetch via react-query, then set ID
                 // Or we can just optimistically set it, but we need unitCost, so we pass it manually
                 const newItems = [...formData.items];
                 const item = { ...newItems[tempProductIndex], productId: newProduct.id, unitCost: newProduct.defaultUnitPrice || 0 };
                 item.lineTotal = Number(item.quantity) * Number(item.unitCost);
                 newItems[tempProductIndex] = item;
                 setFormData(prev => ({ ...prev, items: newItems }));
                 setIsProductModalOpen(false);
             }}
             onCancel={() => {
                 setIsProductModalOpen(false);
                 // Reset the <select> to empty if they cancelled creating a new product
                 const newItems = [...formData.items];
                 newItems[tempProductIndex] = { ...newItems[tempProductIndex], productId: '' };
                 setFormData(prev => ({ ...prev, items: newItems }));
             }}
          />
      </Modal>
    </div>
  );
}
