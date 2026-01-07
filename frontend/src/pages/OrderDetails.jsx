import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, Edit, Printer, ChevronDown, MoreVertical } from 'lucide-react';
import Modal from '../components/Modal';
import CustomerForm from './CustomerForm';
import BillView from '../components/BillView';
import { format } from 'date-fns';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.get(`/orders/${id}`),
  });

  const [isGstModalOpen, setIsGstModalOpen] = useState(false); // Kept for safety if referenced elsewhere, but logically unused now. 
  // Actually, better to remove them if I remove usages.
  // Let's check usages. I removed the dropdown usage above.
  // The tool call before this one SUCCEEDED in removing the dropdown JSX.
  // Now I must clean up the state variables.
  
  // Cleaned state:
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isManagePaymentsModalOpen, setIsManagePaymentsModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  
  // Print State
  const [printConfig, setPrintConfig] = useState({ mode: 'ESTIMATE', data: null });
  const componentRef = useRef();
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: order ? `Zenkar Estimate-${order.orderNo || order.id}` : 'Zenkar Estimate',
  });
  
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Effect to trigger print when config changes and data is ready
  // Actually, we can just set config and then call handlePrint manually? 
  // No, handlePrint is bound to current ref state.
  // Strategy: Update state -> Render -> THEN print.
  
  const triggerPrint = (mode, data = null) => {
      setPrintConfig({ mode, data });
      // Timeout to ensure state update and render completes
      setTimeout(() => {
          console.log("Printing...", componentRef.current);
          if (componentRef.current) {
            handlePrint();
          } else {
            console.error("Print failed: Component ref is null");
          }
      }, 500);
  };



  const paymentMutation = useMutation({
    mutationFn: (data) => api.post(`/orders/${id}/payments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', id]);
      setIsPaymentModalOpen(false);
    },
  });

  const managePaymentsMutation = useMutation({
    mutationFn: (data) => api.patch(`/orders/${id}/payments`, data),
    onSuccess: () => {
       queryClient.invalidateQueries(['orders', id]);
       setIsManagePaymentsModalOpen(false);
    }
  });

  const discountMutation = useMutation({
      mutationFn: (val) => api.patch(`/orders/${id}`, { discount: val }),
      onSuccess: () => {
          queryClient.invalidateQueries(['orders', id]);
          setIsDiscountModalOpen(false);
      }
  });

  const updateItemStatusMutation = useMutation({
     mutationFn: ({ itemId, status }) => api.patch(`/orders/items/${itemId}/status`, { status }),
     onSuccess: () => {
        queryClient.invalidateQueries(['orders', id]);
     }
  });

  const handleItemStatusChange = (itemId, status) => {
     updateItemStatusMutation.mutate({ itemId, status });
  };
  
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading order: {error.message}</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Order not found.</div>;

  return (
    <div className="space-y-0 md:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-0 py-2 md:py-0">
         <div></div> {/* Spacer since Back button is gone */}
         <div className="relative">
            <button 
               onClick={() => setIsActionsOpen(!isActionsOpen)}
               className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors"
            >
               <span>Actions</span>
               <ChevronDown size={16} />
            </button>
            
            {isActionsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                    <button 
                       onClick={() => { setIsPaymentModalOpen(true); setIsActionsOpen(false); }}
                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 font-medium"
                    >
                       Record Payment
                    </button>
                    <button 
                       onClick={() => { triggerPrint('ESTIMATE', order); setIsActionsOpen(false); }}
                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                    >
                       Print Estimate
                    </button>
                    <button
                       onClick={() => { handleWhatsAppShare(order); setIsActionsOpen(false); }}
                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 font-medium"
                    >
                       Share on WhatsApp
                    </button>
                    <button
                       onClick={() => { navigate(`/orders/${id}/edit`); setIsActionsOpen(false); }}
                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                    >
                       Edit Order
                    </button>
                </div>
            )}
            {/* Backdrop to close */}
            {isActionsOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsActionsOpen(false)}></div>
            )}
         </div>
      </div>

      <div className="bg-white md:rounded-xl shadow-sm md:border border-y border-gray-200 overflow-hidden">
          {/* Header Info */}
          <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNo || order.id}</h1>
                <p className="text-sm text-gray-500">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</p>
             </div>
             <div className="flex gap-2">
                <StatusBadge type="ORDER" status={order.status} />
                <StatusBadge type="DELIVERY" status={order.deliveryStatus} />
                <StatusBadge type="PAYMENT" status={order.paymentStatus} />
             </div>
          </div>
          
          <div className="p-0 md:p-6 space-y-6">
             {/* Internal Notes */}
             {order.notes && (
                 <div className="bg-yellow-50 mx-4 md:mx-0 p-4 rounded-lg border border-yellow-100">
                    <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-2">Internal Notes</h3>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.notes}</p>
                 </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Customer */}
                <div>
                   <div className="flex justify-between items-center mb-3 mt-4 md:mt-0 px-4 md:px-0">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Customer</h3>
                      {order.customer && (
                        <button onClick={() => setIsEditCustomerModalOpen(true)} className="text-xs font-medium text-blue-600 hover:underline">
                            Edit
                        </button>
                      )}
                   </div>
                   <div className="bg-gray-50 p-4 rounded-none md:rounded-lg border-y md:border border-gray-100 space-y-1 text-sm">
                      <div className="font-medium text-gray-900 text-base">{order.customer?.name}</div>
                      <div className="text-gray-600">{order.customer?.address || 'No Address'}</div>
                      <div className="text-gray-600">{order.customer?.phone || 'No Phone'}</div>
                   </div>
                </div>
                
                {/* Dates & Payments */}
                <div>
                   <h3 className="px-4 md:px-0 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Dates & Status</h3>
                   <div className="bg-gray-50 p-4 rounded-none md:rounded-lg border-y md:border border-gray-100 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Order Date</dt>
                        <dd className="font-semibold">{format(new Date(order.orderDate), 'dd/MM/yyyy')}</dd>
                      </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Due Date:</span>
                         <span className="font-medium">{order.dueDate ? format(new Date(order.dueDate), 'dd/MM/yyyy') : '—'}</span>
                       </div>
                   </div>

                   {/* Payments List */}
                   <div className="flex justify-between items-center mb-3 mt-6 px-4 md:px-0">
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payments</h3>
                       <button onClick={() => setIsManagePaymentsModalOpen(true)} className="text-xs font-medium text-blue-600 hover:underline">
                          Edit
                       </button>
                   </div>
                   <div className="bg-gray-50 rounded-none md:rounded-lg border-y md:border border-gray-100 overflow-hidden text-sm">
                      {order.payments && order.payments.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {order.payments.map(p => (
                             <div key={p.id} className="p-3 flex justify-between items-center bg-white/50">
                                <div>
                                   <div className="text-xs text-gray-500">{format(new Date(p.date), 'dd/MM/yyyy')} {p.note ? `• ${p.note}` : ''}</div>
                                </div>
                                <div className="font-medium text-gray-900">₹{Number(p.amount).toLocaleString()}</div>
                             </div>
                          ))}
                          <div className="p-3 bg-gray-100 flex justify-between font-bold border-t border-gray-200">
                             <span>Total Paid</span>
                             <span className="text-green-700">₹{(order.paidAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-gray-500 text-center italic">No payments recorded</div>
                      )}
                   </div>
                </div>
             </div>

             {/* Items */}
             <div>
                <h3 className="px-4 md:px-0 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Items</h3>
                <div className="border-y md:border border-gray-100 rounded-none md:rounded-lg overflow-hidden">
                   <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                         <tr>
                            <th className="px-3 md:px-4 py-2 text-left">Item</th>
                            <th className="px-2 md:px-4 py-2 text-left w-24">Status</th>
                            <th className="px-2 md:px-4 py-2 text-center w-12 md:w-20 whitespace-nowrap">Qty</th>
                            <th className="px-2 md:px-4 py-2 text-right w-16 md:w-24 whitespace-nowrap">Price</th>
                            <th className="px-3 md:px-4 py-2 text-right w-16 md:w-24 whitespace-nowrap">Total</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {order.items.map((item, i) => (
                            <tr key={i}>
                               <td className="px-3 md:px-4 py-2">
                                  <div className="font-medium text-gray-900">{item.productName}</div>
                                  <div className="text-xs text-gray-500">{item.description}</div>
                               </td>
                               <td className="px-2 md:px-4 py-2">
                                   <ItemStatusSelect item={item} onChange={handleItemStatusChange} />
                               </td>
                               <td className="px-2 md:px-4 py-2 text-center text-gray-600">{Number(item.quantity)}</td>
                               <td className="px-2 md:px-4 py-2 text-right text-gray-600">₹{Number(item.unitPrice).toLocaleString()}</td>
                               <td className="px-3 md:px-4 py-2 text-right font-medium text-gray-900">₹{Number(item.lineTotal).toLocaleString()}</td>
                            </tr>
                         ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-bold text-gray-900">
                         <tr>
                            <td colSpan={3} className="px-3 md:px-4 py-2 text-right">Total</td>
                            <td className="px-3 md:px-4 py-2 text-right">₹{Number(order.totalAmount).toLocaleString()}</td>
                         </tr>
                         <tr>
                            <td colSpan={3} className="px-3 md:px-4 py-2 text-right text-green-600 font-normal">Paid</td>
                            <td className="px-3 md:px-4 py-2 text-right text-green-600 font-normal">−₹{(order.paidAmount || 0).toLocaleString()}</td>
                         </tr>
                         <tr>
                            <td colSpan={3} className="px-3 md:px-4 py-2 text-right">
                                <button 
                                    onClick={() => setIsDiscountModalOpen(true)}
                                    className="text-orange-600 font-medium hover:underline text-xs uppercase tracking-wide"
                                >
                                    {Number(order.discount) > 0 ? 'Discount' : '+ Add Discount'}
                                </button>
                            </td>
                            <td className="px-3 md:px-4 py-2 text-right text-orange-600 font-normal">
                                {Number(order.discount) > 0 ? `-₹${Number(order.discount).toLocaleString()}` : '—'}
                            </td>
                         </tr>
                         <tr className="text-red-600">
                            <td colSpan={3} className="px-3 md:px-4 py-2 text-right">Balance Due</td>
                            <td className="px-3 md:px-4 py-2 text-right">₹{Number(order.remainingBalance).toLocaleString()}</td>
                         </tr>
                      </tfoot>
                   </table>
                </div>
             </div>
          </div>
      </div>
      
      {/* Modals */}
      {isPaymentModalOpen && (
        <PaymentModal 
           onClose={() => setIsPaymentModalOpen(false)} 
           onSubmit={paymentMutation.mutate}
           isLoading={paymentMutation.isPending}
        />
      )}

      {isManagePaymentsModalOpen && (
        <ManagePaymentsModal
           payments={order.payments} 
           onClose={() => setIsManagePaymentsModalOpen(false)} 
           onSubmit={managePaymentsMutation.mutate}
           isLoading={managePaymentsMutation.isPending}
           error={managePaymentsMutation.error}
        />
      )}

      <Modal
        isOpen={isEditCustomerModalOpen}
        onClose={() => setIsEditCustomerModalOpen(false)}
        title="Edit Customer Details"
      >
        <div className="p-4">
           {order.customer && (
             <CustomerForm 
                isModal={true}
                id={order.customer.id} // Pass ID to override URL params
                onSuccess={() => {
                   queryClient.invalidateQueries(['orders', id]); // Reload order to show updated customer info
                   setIsEditCustomerModalOpen(false);
                }}
             />
           )}
        </div>
      </Modal>

      {isDiscountModalOpen && (
        <DiscountModal
            initialValue={order.discount}
            onClose={() => setIsDiscountModalOpen(false)}
            onSubmit={discountMutation.mutate}
            isLoading={discountMutation.isPending}
        />
      )}

      {/* GST Modal Removed */}

      {/* Hidden Print Component - Use height 0 instead of display:none to ensure ref is accessible */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: 0, overflow: 'hidden' }}>
         <div ref={componentRef}>
             <BillView 
                order={order} 
                data={printConfig.data}
                mode={printConfig.mode}
             />
         </div>
      </div>
    </div>
  );
}

function PaymentModal({ onClose, onSubmit, isLoading }) {
  // Keeping this for "Record Payment" quick action if needed, 
  // but User asked for "Edit Payments" dialog to edit all. 
  // I will implement ManagePaymentsModal below and use that for the 'Edit' action.
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ amount: Number(amount), date, note });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
       <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
             {/* ... (keep existing fields) ... */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  autoFocus
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. UPI, Cash"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
             </div>
             <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Payment'}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
}

function ManagePaymentsModal({ payments = [], onClose, onSubmit, isLoading, error }) {
  const [items, setItems] = useState(payments.map(p => ({
     id: p.id,
     amount: p.amount,
     method: p.method || 'CASH',
     date: p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
     note: p.note || ''
  })));

  const addRow = () => {
      setItems([...items, { amount: '', method: 'CASH', date: new Date().toISOString().split('T')[0], note: '' }]);
  };

  const removeRow = (index) => {
      setItems(items.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, val) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: val };
      setItems(newItems);
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      // Filter out empty rows? Or validate?
      // Assuming valid inputs or basic required check
      const validItems = items.filter(i => i.amount).map(i => ({
        ...i,
        amount: Number(i.amount)
      }));
      onSubmit({ payments: validItems });
  };

  const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 md:p-4 z-50">
       <div className="bg-white rounded-xl shadow-xl p-3 md:p-6 w-full max-w-2xl space-y-4 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold text-gray-900">Manage Payments</h2>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg">
             <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
                   <tr>
                      <th className="px-1 md:px-3 py-2 w-28 md:w-32">Date</th>
                      <th className="px-1 md:px-3 py-2 w-20 md:w-24 text-right">Amount</th>
                      <th className="px-1 md:px-3 py-2 w-20 md:w-24">Method</th>
                      <th className="px-1 md:px-3 py-2">Note</th>
                      <th className="px-1 py-2 w-8"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {items.map((item, idx) => (
                      <tr key={idx}>
                         <td className="p-1 md:p-2">
                             <input type="date" className="input-field py-1 px-1 text-xs w-full" 
                                value={item.date}
                                onChange={e => updateRow(idx, 'date', e.target.value)}
                             />
                         </td>
                         <td className="p-1 md:p-2">
                             <input type="number" className="input-field py-1 px-1 text-xs text-right w-full" 
                                value={item.amount}
                                onChange={e => updateRow(idx, 'amount', e.target.value)}
                                placeholder="0"
                             />
                         </td>
                         <td className="p-1 md:p-2">
                             <select 
                                className="input-field py-1 px-1 text-xs w-full"
                                value={item.method}
                                onChange={e => updateRow(idx, 'method', e.target.value)}
                             >
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                             </select>
                         </td>
                         <td className="p-1 md:p-2">
                             <input type="text" className="input-field py-1 px-2 text-xs w-full" 
                                value={item.note}
                                onChange={e => updateRow(idx, 'note', e.target.value)}
                                placeholder="Note"
                             />
                         </td>
                         <td className="p-1 md:p-2 text-center">
                             <button onClick={() => removeRow(idx)} className="text-gray-400 hover:text-red-500">×</button>
                         </td>
                      </tr>
                   ))}
                   {items.length === 0 && (
                       <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic">No payments</td></tr>
                   )}
                </tbody>
             </table>
          </div>

          <button onClick={addRow} type="button" className="w-full py-2 text-sm text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50">
             + Add Payment
          </button>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              Save Failed: {error.message || 'Unknown Error'}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
             <div className="font-bold text-gray-900">Total: ₹{total.toLocaleString()}</div>
             <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">Cancel</button>
                <button 
                   onClick={handleSubmit} 
                   disabled={isLoading}
                   className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                   {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
             </div>
          </div>
       </div>
    </div>
  );
}

function DiscountModal({ initialValue, onClose, onSubmit, isLoading }) {
    const [val, setVal] = useState(initialValue || '');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(val);
    };
  
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
         <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Edit Discount</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (₹)</label>
                  <input 
                    type="number" 
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                  />
               </div>
               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
               </div>
            </form>
         </div>
      </div>
    );
  }

function formatEstimateText(order) {
    if (!order) return '';

    const date = format(new Date(order.orderDate), 'dd/MM/yyyy');
    const total = Number(order.totalAmount || 0);
    const paid = Number(order.paidAmount || 0);
    const discount = Number(order.discount || 0);
    // Calculate Net Total logic consistent with BillView
    // BillView: total = subtotal - discount. API provides totalAmount which is usually gross? 
    // Wait, in BillView fix we did: total = subtotal - discount.
    // Here we should rely on what the order object has.
    // If order.totalAmount is stored as Gross in DB, then we do:
    // Net = Total - Discount.
    
    // Let's replicate BillView logic exactly for consistency.
    const items = order.items || [];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
    const netTotal = subtotal - discount;
    const balance = netTotal - paid;

    let text = `*ESTIMATE* #${order.orderNo || order.id}\n`;
    text += `Date: ${date}\n`;
    text += `Customer: ${order.customer?.name || 'Walk-in'}\n\n`;

    text += `*Items:*\n`;
    items.forEach((item, i) => {
        text += `${i+1}. ${item.productName} x ${item.quantity} = ₹${Number(item.lineTotal).toLocaleString()}\n`;
    });
    
    text += `\n-------------------\n`;
    text += `Subtotal: ₹${subtotal.toLocaleString()}\n`;
    
    if (discount > 0) {
        text += `Discount: -₹${discount.toLocaleString()}\n`;
    }
    
    text += `*Total: ₹${netTotal.toLocaleString()}*\n`;
    
    if (paid > 0) {
        text += `Paid: -₹${paid.toLocaleString()}\n`;
    }
    
    if (balance > 0) {
        text += `*Balance Due: ₹${balance.toLocaleString()}*\n`;
    }
    
    text += `\nGenerated via Zenkar Industries`;
    return text;
}

function handleWhatsAppShare(order) {
    if (!order) return;
    
    const customerPhone = order.customer?.phone;
    if (!customerPhone) {
        alert("Customer phone number is missing. Cannot share via WhatsApp.");
        return;
    }
    
    // Sanitize phone number (remove spaces, dashes)
    let phone = customerPhone.replace(/\D/g, '');
    
    // Assuming Indian numbers if no country code, prepend 91 if length is 10
    if (phone.length === 10) {
        phone = '91' + phone;
    }
    
    const text = formatEstimateText(order);
    const encodedText = encodeURIComponent(text);
    
    // Use https://wa.me/ to open standard WhatsApp interface (App on Mobile, Page on Desktop)
    const url = `https://wa.me/${phone}?text=${encodedText}`;
    
    window.open(url, '_blank');
}

const ItemStatusSelect = ({ item, onChange }) => {
  const styles = {
    CONFIRMED: 'bg-gray-100 text-gray-700 ring-gray-600/20',
    IN_PRODUCTION: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    READY: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    DELIVERED: 'bg-green-50 text-green-700 ring-green-600/20',
  };

  const style = styles[item.status] || 'bg-gray-100 text-gray-600';

  return (
    <div className="relative inline-block" onClick={e => e.stopPropagation()}>
      <select 
        value={item.status}
        onChange={(e) => onChange(item.id, e.target.value)}
        className={`appearance-none cursor-pointer pl-2 pr-6 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset ${style} border-none outline-none focus:ring-2 uppercase tracking-wide`}
      >
        <option value="CONFIRMED">Queue</option>
        <option value="IN_PRODUCTION">In Prod</option>
        <option value="READY">Ready</option>
        <option value="DELIVERED">Delivered</option>
      </select>
       <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="h-2 w-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
       </div>
    </div>
  );
};

function StatusBadge({ type, status }) {
    if (!status) return null;
    
    // Config
    const config = {
        ORDER: {
            ENQUIRED: { label: 'Enquired', color: 'bg-orange-50 text-orange-700 border-orange-100' },
            CONFIRMED: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
            CANCELLED: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-100' },
        },
        DELIVERY: {
            CONFIRMED: { label: 'Queue', color: 'bg-gray-50 text-gray-600 border-gray-200' },
            IN_PRODUCTION: { label: 'In Prod', color: 'bg-purple-50 text-purple-700 border-purple-100' },
            READY: { label: 'Ready', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            PARTIALLY_DELIVERED: { label: 'Part. Del', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
            FULLY_DELIVERED: { label: 'Delivered', color: 'bg-green-50 text-green-700 border-green-100' },
        },
        PAYMENT: {
            UNPAID: { label: 'Unpaid', color: 'bg-red-50 text-red-700 border-red-100' },
            PARTIALLY_PAID: { label: 'Part Paid', color: 'bg-orange-50 text-orange-700 border-orange-100' },
            FULLY_PAID: { label: 'Paid', color: 'bg-green-50 text-green-700 border-green-100' },
        },
        // ITEM removed as it's now handled by Select
    };

    const cfg = config[type]?.[status] || { label: status, color: 'bg-gray-100 text-gray-500' };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}
