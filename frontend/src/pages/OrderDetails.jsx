import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.get(`/orders/${id}`),
  });
  
  const paymentMutation = useMutation({
    mutationFn: (data) => api.post(`/orders/${id}/payments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', id]);
      setIsPaymentModalOpen(false);
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Order not found.</div>;

  return (
    <div className="space-y-0 md:space-y-6 max-w-4xl mx-auto">
      {/* ... Header ... */}
      <div className="flex items-center justify-between px-4 md:px-0 py-2 md:py-0">
         <button onClick={() => navigate('/orders')} className="flex items-center text-gray-600 hover:text-gray-900">
            <span className="mr-2">←</span> Back to Orders
         </button>
         <div className="flex gap-2">
            <button 
               onClick={() => setIsPaymentModalOpen(true)}
               className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm"
            >
               Record Payment
            </button>
            <Link to={`/orders/${order.id}/edit`} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Edit Order
            </Link>
         </div>
      </div>

      <div className="bg-white md:rounded-xl shadow-sm md:border border-y border-gray-200 overflow-hidden">
          {/* ... Header Info ... */}
          <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNo || order.id}</h1>
                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
             </div>
             <StatusBadge status={order.status} />
          </div>
          
          <div className="p-0 md:p-6 space-y-6">
             {/* ... Internal Notes ... */}
             {order.notes && (
                 <div className="bg-yellow-50 mx-4 md:mx-0 p-4 rounded-lg border border-yellow-100">
                    <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-2">Internal Notes</h3>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.notes}</p>
                 </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ... Customer ... */}
                <div>
                   <h3 className="px-4 md:px-0 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 mt-4 md:mt-0">Customer</h3>
                   <div className="bg-gray-50 p-4 rounded-none md:rounded-lg border-y md:border border-gray-100 space-y-1 text-sm">
                      <div className="font-medium text-gray-900 text-base">{order.customer?.name}</div>
                      <div className="text-gray-600">{order.customer?.address || 'No Address'}</div>
                      <div className="text-gray-600">{order.customer?.phone || 'No Phone'}</div>
                   </div>
                </div>
                
                {/* ... Dates & Payments ... */}
                <div>
                   <h3 className="px-4 md:px-0 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Dates & Status</h3>
                   <div className="bg-gray-50 p-4 rounded-none md:rounded-lg border-y md:border border-gray-100 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}</span>
                      </div>
                   </div>

                   {/* Payments List */}
                   <h3 className="px-4 md:px-0 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 mt-6">Payments</h3>
                   <div className="bg-gray-50 rounded-none md:rounded-lg border-y md:border border-gray-100 overflow-hidden text-sm">
                      {order.payments && order.payments.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {order.payments.map(p => (
                             <div key={p.id} className="p-3 flex justify-between items-center bg-white/50">
                                <div>
                                   <div className="font-medium text-gray-900">₹{Number(p.amount).toLocaleString()}</div>
                                   <div className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString()} {p.note ? `• ${p.note}` : ''}</div>
                                </div>
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

             {/* ... Items ... */}
             <div>
                <h3 className="px-4 md:px-0 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Items</h3>
                <div className="border-y md:border border-gray-100 rounded-none md:rounded-lg overflow-hidden">
                   <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                         <tr>
                            <th className="px-3 md:px-4 py-2 text-left">Item</th>
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
                         {Number(order.discount) > 0 && (
                            <tr>
                               <td colSpan={3} className="px-3 md:px-4 py-2 text-right text-orange-600 font-normal">Discount</td>
                               <td className="px-3 md:px-4 py-2 text-right text-orange-600 font-normal">−₹{Number(order.discount).toLocaleString()}</td>
                            </tr>
                         )}
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
      
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal 
           onClose={() => setIsPaymentModalOpen(false)} 
           onSubmit={paymentMutation.mutate}
           isLoading={paymentMutation.isPending}
        />
      )}
    </div>
  );
}

function PaymentModal({ onClose, onSubmit, isLoading }) {
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

function StatusBadge({ status }) {
  const styles = {
    enquired: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    confirmed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    production: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    ready: 'bg-green-50 text-green-700 ring-green-600/20',
    delivered: 'bg-gray-100 text-gray-700 ring-gray-500/20',
    closed: 'bg-gray-800 text-white ring-gray-700/20',
    cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  };
  
  const style = styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}
