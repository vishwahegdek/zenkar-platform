import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function OrdersList() {
  const [view, setView] = useState('active'); // 'active' or 'history'
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', view],
    queryFn: () => api.get(`/orders?view=${view}`),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/orders/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['orders']),
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCopy = async (order) => {
    // ... (existing copy logic)
    const lines = [
      `*Order #${order.orderNo || order.id}*`,
      `Customer: ${order.customer?.name}${order.customer?.address ? `, ${order.customer.address}` : ''}`,
      `Phone: ${order.customer?.phone || 'N/A'}`,
      '',
      '*Items:*',
      ...order.items.map(i => `- ${i.productName} (${i.description || 'Std'}): ${Number(i.quantity)} x ₹${i.unitPrice}`),
      '',
      `Total: ₹${Number(order.totalAmount).toLocaleString()}`,
      `Advance: ₹${Number(order.advanceAmount).toLocaleString()}`,
      `Balance: ₹${(Number(order.totalAmount) - Number(order.advanceAmount)).toLocaleString()}`,
      '',
      `Due: ${order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}`
    ];
    
    const text = lines.join('\n');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        alert('Order details copied to clipboard!');
      } else {
        // Robust Fallback for Mobile (iOS/Android compliant)
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Ensure element is part of DOM, visible to browser but invisible to user
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";
        textArea.setAttribute('readonly', '');
        
        document.body.appendChild(textArea);
        
        // Selection strategy
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999); // iOS

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        selection.removeAllRanges();

        if (!successful) throw new Error('Copy command returned false');
        alert('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Copy failed:', err);
      // If automatic copy fails, show prompt for manual copy
      const manuallyCopied = prompt('Automatic copy not supported on this device. Key-combo copy (Ctrl+C / Cmd+C) might work, or select text below:', text);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'All' || order.status.toLowerCase() === filter.toLowerCase();
    
    if (!search) return matchesFilter;

    const searchLower = search.toLowerCase();
    const matchesSearch = 
      (order.customer?.name || '').toLowerCase().includes(searchLower) ||
      (order.customer?.address || '').toLowerCase().includes(searchLower) ||
      (order.orderNo || '').toLowerCase().includes(searchLower) ||
      (order.notes || '').toLowerCase().includes(searchLower) ||
      order.items.some(i => 
        (i.productName || '').toLowerCase().includes(searchLower) || 
        (i.description || '').toLowerCase().includes(searchLower)
      );
      
    return matchesFilter && matchesSearch;
  });

  const [selectedOrder, setSelectedOrder] = useState(null);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

  return (
    <div className="space-y-6">
      {/* ... Header ... */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <div className="flex gap-4 mt-1 text-sm">
             <button 
                onClick={() => setView('active')} 
                className={`pb-1 border-b-2 transition-colors ${view === 'active' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             >
               Active Orders
             </button>
             <button 
                onClick={() => setView('history')} 
                className={`pb-1 border-b-2 transition-colors ${view === 'history' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             >
               Order History
             </button>
          </div>
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm overflow-x-auto max-w-full">
           {(view === 'active' 
              ? ['All', 'Enquired', 'Confirmed', 'Production', 'Ready', 'Delivered']
              : ['All', 'Closed', 'Cancelled']
           ).map(f => (
             <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  filter === f 
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
           <input 
              type="text" 
              placeholder="Search orders..." 
              className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
           />
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredOrders.map(order => (
            <div key={order.id} className="p-4 space-y-3 bg-white" onClick={() => setSelectedOrder(order)}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-gray-900">
                    {order.orderNo || `#${order.id}`}
                  </span>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="flex justify-between items-start text-sm">
                 <div className="space-y-0.5">
                    <div className="font-medium text-gray-900">{order.customer?.name}</div>
                    <div className="text-xs text-gray-500">{order.customer?.address}</div>
                    <div className="text-xs text-gray-400">{order.customer?.phone}</div>
                 </div>
                 <div className="text-right">
                    <div className="font-bold text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</div>
                     <div className="text-xs text-red-600 font-medium">Bal: ₹{Number(order.remainingBalance || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Due: {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}</div>
                 </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                <Link to={`/orders/${order.id}/edit`} className="flex-1 py-1.5 text-center text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200">
                  Edit
                </Link>
                <button onClick={() => handleCopy(order)} className="flex-1 py-1.5 text-center text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 border border-blue-100">
                  Copy
                </button>
                <button onClick={() => handleDelete(order.id)} className="flex-1 py-1.5 text-center text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 border border-red-100">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
             <div className="p-8 text-center text-gray-400 text-sm">No orders found.</div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-28">Order No</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3 w-32">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right text-red-600">Balance</th>
                <th className="px-6 py-3 w-32">Due Date</th>
                <th className="px-6 py-3 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <tr 
                  key={order.id} 
                  className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <span className="text-blue-600 hover:underline">
                      {order.orderNo || `#${order.id}`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.customer?.name}</div>
                    <div className="text-xs text-gray-500">
                      {order.customer?.address || ''}
                      {order.customer?.address && order.customer?.phone ? ' • ' : ''}
                      {order.customer?.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                     ₹{Number(order.totalAmount).toLocaleString()}
                  </td>
                   <td className="px-6 py-4 text-right font-medium text-red-600">
                     ₹{Number(order.remainingBalance || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCopy(order)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Copy Order"
                      >
                         📋
                      </button>
                      <Link 
                        to={`/orders/${order.id}/edit`}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                         title="Edit Order"
                      >
                         ✏️
                      </Link>
                      <button 
                         onClick={() => handleDelete(order.id)}
                         className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                         title="Delete Order"
                      >
                         🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No orders found matching your filters.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                 <div>
                    <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.orderNo || selectedOrder.id}</h2>
                    <p className="text-sm text-gray-500">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
              
              <div className="p-6 space-y-6">
                 {/* Internal Notes - AT TOP */}
                 <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-2">Internal Notes</h3>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedOrder.notes || 'No notes.'}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Customer</h3>
                       <div className="space-y-1 text-sm">
                          <div className="font-medium text-gray-900">{selectedOrder.customer?.name}</div>
                          <div className="text-gray-600">{selectedOrder.customer?.address || 'No Address'}</div>
                          <div className="text-gray-600">{selectedOrder.customer?.phone || 'No Phone'}</div>
                       </div>
                    </div>
                    <div>
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Dates & Status</h3>
                       <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order Date:</span>
                            <span className="font-medium">{new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Due Date:</span>
                            <span className="font-medium">{selectedOrder.dueDate ? new Date(selectedOrder.dueDate).toLocaleDateString() : '—'}</span>
                          </div>
                          <div className="mt-2">
                             <StatusBadge status={selectedOrder.status} />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Items</h3>
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                       <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-500 font-medium">
                             <tr>
                                <th className="px-4 py-2 text-left">Item</th>
                                <th className="px-4 py-2 text-center w-20">Qty</th>
                                <th className="px-4 py-2 text-right w-24">Price</th>
                                <th className="px-4 py-2 text-right w-24">Total</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {selectedOrder.items.map((item, i) => (
                                <tr key={i}>
                                   <td className="px-4 py-2">
                                      <div className="font-medium text-gray-900">{item.productName}</div>
                                      <div className="text-xs text-gray-500">{item.description}</div>
                                   </td>
                                   <td className="px-4 py-2 text-center text-gray-600">{Number(item.quantity)}</td>
                                   <td className="px-4 py-2 text-right text-gray-600">₹{Number(item.unitPrice).toLocaleString()}</td>
                                   <td className="px-4 py-2 text-right font-medium text-gray-900">₹{Number(item.lineTotal).toLocaleString()}</td>
                                </tr>
                             ))}
                          </tbody>
                          <tfoot className="bg-gray-50 font-bold text-gray-900">
                             <tr>
                                <td colSpan={3} className="px-4 py-2 text-right">Total</td>
                                <td className="px-4 py-2 text-right">₹{Number(selectedOrder.totalAmount).toLocaleString()}</td>
                             </tr>
                             <tr>
                                <td colSpan={3} className="px-4 py-2 text-right text-gray-500 font-normal">Advance</td>
                                <td className="px-4 py-2 text-right text-gray-600 font-normal">−₹{Number(selectedOrder.advanceAmount).toLocaleString()}</td>
                             </tr>
                             <tr className="text-red-600">
                                <td colSpan={3} className="px-4 py-2 text-right">Balance Due</td>
                                <td className="px-4 py-2 text-right">₹{Number(selectedOrder.remainingBalance).toLocaleString()}</td>
                             </tr>
                          </tfoot>
                       </table>
                    </div>
                 </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                 <Link to={`/orders/${selectedOrder.id}/edit`} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Edit Order
                 </Link>
                 <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Close
                 </button>
              </div>
           </div>
        </div>
      )}
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
