import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';
import { Trash, Plus } from 'lucide-react';
import SmartSelector from '../components/SmartSelector';
import Modal from '../components/Modal';
import ContactForm from '../components/ContactForm';

export default function PurchaseForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [tempContactName, setTempContactName] = useState('');

  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '', // For display
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ productId: '', quantity: 1, unitCost: 0, lineTotal: 0 }], // { productId, productName, quantity, unitCost, lineTotal }
  });

  // Fetch Suppliers removed - handled by SmartSelector

  // Fetch Products for selection
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products?limit=1000'),
  });
  const products = (productsData?.data || []).filter(p => p.isPurchasable);

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
        const prod = products.find(p => p.id == value);
        if (prod) {
            item.unitCost = prod.defaultUnitPrice || 0; // Pre-fill cost
        }
    }

    // Recalc total
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

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        supplierId: Number(data.supplierId),
        items: data.items.map(item => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            unitCost: Number(item.unitCost)
        }))
      };
      return api.post('/purchases', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      toast.success('Purchase recorded successfully');
      navigate('/purchases');
    },
    onError: (err) => toast.error('Failed: ' + (err.response?.data?.message || err.message))
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">New Purchase</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
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
              className="input-field"
              value={formData.purchaseDate}
              onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>
        </div>

        {/* Items Table */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
            <div className="-mx-6 border-y border-gray-200">
                {/* Items Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-2 px-3 py-2 text-xs font-bold text-gray-500 uppercase">
                <div className="col-span-5 md:col-span-5">Product</div>
                <div className="col-span-2 md:col-span-2 text-center">Qty</div>
                <div className="col-span-3 md:col-span-3 text-right">Cost</div>
                <div className="col-span-2 md:col-span-2 text-right">Total</div>
                </div>

                <div className="divide-y divide-gray-100">
                    {formData.items.map((item, index) => (
                        <div 
                            key={index} 
                            className={`grid grid-cols-12 gap-2 items-center px-3 py-3 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                        >
                            {/* Product Column */}
                            <div className="col-span-5 md:col-span-5">
                                <select
                                    className="w-full text-xs md:text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1"
                                    value={item.productId}
                                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantity Column */}
                            <div className="col-span-2 md:col-span-2">
                                <input
                                    type="number" min="1"
                                    className="w-full text-center text-xs md:text-sm border-gray-200 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                />
                            </div>

                            {/* Unit Cost Column */}
                            <div className="col-span-3 md:col-span-3">
                                <input
                                    type="number" min="0" step="0.01"
                                    className="w-full text-right text-xs md:text-sm border-gray-200 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                                    value={item.unitCost}
                                    onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                />
                            </div>

                            {/* Total Column + Remove */}
                            <div className="col-span-2 md:col-span-2 flex flex-col md:flex-row items-end md:items-center justify-between gap-1">
                                <div className="font-medium text-xs md:text-sm text-gray-900 w-full text-right">
                                    {(item.quantity * item.unitCost).toLocaleString()}
                                </div>
                                <button 
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-gray-400 hover:text-red-500 p-1 -mr-2"
                                >
                                    <span className="text-lg font-bold">×</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {formData.items.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No items added.
                    </div>
                )}
                
                <button
                    onClick={handleAddItem}
                    className="w-full py-3 text-center text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border-t border-blue-100 transition-colors uppercase tracking-wide"
                >
                    + Add Item
                </button>
            </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-end border-t pt-4 gap-4">
             <div className="flex gap-12 text-lg">
                 <span className="text-gray-600">Total Amount:</span>
                 <span className="font-bold">₹ {calculateGrandTotal().toLocaleString()}</span>
             </div>

             <div className="flex gap-3">
                 <button 
                    onClick={() => navigate('/purchases')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                 >
                     Cancel
                 </button>
                 <button 
                    onClick={() => mutation.mutate(formData)}
                    disabled={mutation.isPending || formData.items.length === 0}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                 >
                     {mutation.isPending ? 'Saving...' : 'Save Purchase'}
                 </button>
             </div>
        </div>
      </div>

      <Modal
          isOpen={isContactModalOpen}
         onClose={() => setIsContactModalOpen(false)}
         title="Create New Supplier"
      >
          <ContactForm 
             isModal={true}
             initialData={{ name: tempContactName }}
             onSuccess={(newContact) => {
                 setFormData({
                     ...formData,
                     supplierId: newContact.id,
                     supplierName: newContact.name
                 });
                 setIsContactModalOpen(false);
             }}
             onCancel={() => setIsContactModalOpen(false)}
          />
      </Modal>
    </div>
  );
}
