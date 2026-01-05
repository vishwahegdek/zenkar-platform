import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

export default function OrdersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const view = searchParams.get('view') || 'active';
  const filter = searchParams.get('filter') || 'All';
  const search = searchParams.get('search') || '';
  
  // Local state for search input to prevent losing focus
  const [searchInput, setSearchInput] = useState(search);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceTimer = useRef(null);

  // Sync searchInput with URL param when search changes EXTERNALLY only
  useEffect(() => {
    setSearchInput(search);
    setDebouncedSearch(search);
  }, [search]);

  const updateParams = (newParams) => {
    // Merge new params with existing ones
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
       if (v === null || v === '') next.delete(k); // cleanup empty
       else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };

  const setView = (val) => updateParams({ view: val });
  const setFilter = (val) => updateParams({ filter: val });
  
  // Debounced search handler
  const handleSearchChange = (value) => {
    setSearchInput(value);
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer to update both URL params and debounced state after 500ms
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      updateParams({ search: value });
    }, 500);
  };

  const {
      data,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
      isError,
      error
  } = useInfiniteQuery({
      queryKey: ['orders', view, debouncedSearch], // Use debouncedSearch instead of search
      queryFn: async ({ pageParam = 1 }) => {
          const res = await api.get(`/orders?view=${view}&search=${debouncedSearch}&page=${pageParam}&limit=20`);
          return res;
      },
      getNextPageParam: (lastPage, pages) => {
           // lastPage might be undefined if API fails and returns nothing despite successful promise resolution
           if (!lastPage || !lastPage.meta) return undefined;
           
           if (lastPage.meta.page < lastPage.meta.totalPages) {
               return lastPage.meta.page + 1;
           }
           return undefined;
      }
  });

  const orders = data?.pages.flatMap(page => page.data || []).filter(Boolean) || [];
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/orders/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['orders']),
  });

  const updateStatusMutation = useMutation({
     mutationFn: ({ id, status }) => api.patch(`/orders/${id}`, { status }),
     onSuccess: () => queryClient.invalidateQueries(['orders'])
  });

  const handleStatusChange = (id, status) => {
     updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCopy = async (order) => {
    // Copy Logic with Clipboard API
    if (!order) return; 

    // Formatting Logic duplicated for now (ideal refactor: move to utils)
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
      `Due: ${order.dueDate ? format(new Date(order.dueDate), 'dd/MM/yyyy') : '—'}`
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
    if (!order) return false;
    // Status Filter (Client Side)
    // Safe access
    const matchesFilter = filter === 'All' || (order.status && order.status.toLowerCase() === filter.toLowerCase());
    return matchesFilter;
  });

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

      <div className="bg-white md:rounded-xl shadow-sm md:border border-y border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
           <input 
              id="orders-search-input"
              type="text" 
              placeholder="Search orders..." 
              className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              autoComplete="off"
           />
        </div>

        {/* Content Area with Loading State */}
        {isLoading ? (
             <div className="p-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
                <div>Loading orders...</div>
             </div>
        ) : (
        <>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredOrders.map(order => (
            <div key={order.id} className="p-3 space-y-2 bg-white" onClick={() => navigate(`/orders/${order.id}`)}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-gray-900">
                    {order.orderNo || `#${order.id}`}
                  </span>
                  {order.isQuickSale && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                        QS
                      </span>
                  )}
                  <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</p>
                </div>
                <StatusSelect order={order} onChange={handleStatusChange} />
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
                    <div className="text-xs text-gray-500 mt-1">Due: {order.dueDate ? format(new Date(order.dueDate), 'dd/MM/yyyy') : '—'}</div>
                 </div>
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

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <tr 
                  key={order.id} 
                  className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <span className="text-blue-600 hover:underline">
                      {order.orderNo || `#${order.id}`}
                    </span>
                    {order.isQuickSale && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                        QS
                      </span>
                    )}
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
                    <StatusSelect order={order} onChange={handleStatusChange} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                     ₹{Number(order.totalAmount).toLocaleString()}
                  </td>
                   <td className="px-6 py-4 text-right font-medium text-red-600">
                     ₹{Number(order.remainingBalance || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {format(new Date(order.orderDate), 'dd/MM/yyyy')}
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
        
        {/* Load More Button */}
        {hasNextPage && (
            <div className="p-4 flex justify-center border-t border-gray-100 bg-gray-50">
                <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-6 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    {isFetchingNextPage ? 'Loading...' : 'Load More Results'}
                </button>
            </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

const StatusSelect = ({ order, onChange }) => {
  const styles = {
    enquired: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    confirmed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    production: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    ready: 'bg-green-50 text-green-700 ring-green-600/20',
    delivered: 'bg-gray-100 text-gray-700 ring-gray-500/20',
    closed: 'bg-gray-800 text-white ring-gray-700/20',
    cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  };

  const style = styles[order.status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  
  return (
    <div className="relative inline-block" onClick={e => e.stopPropagation()}>
      <select 
        value={order.status}
        onChange={(e) => {
           if (e.target.value === 'closed') {
             if (!window.confirm('Closing this order will write off any remaining balance as a discount. Continue?')) return;
           }
           onChange(order.id, e.target.value);
        }}
        className={`appearance-none cursor-pointer pl-2.5 pr-6 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style} border-none outline-none focus:ring-2`}
      >
        <option value="enquired">Enquired</option>
        <option value="confirmed">Confirmed</option>
        <option value="production">Production</option>
        <option value="ready">Ready</option>
        <option value="delivered">Delivered</option>
        <option value="closed">Closed</option>
        <option value="cancelled">Cancelled</option>
      </select>
       {/* Tiny arrow hint */}
       <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="h-2 w-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
       </div>
    </div>
  );
};
