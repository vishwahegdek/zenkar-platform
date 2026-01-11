import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function OrdersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const view = searchParams.get('view') || 'active';
  const filter = searchParams.get('filter') || 'All';
  const search = searchParams.get('search') || '';
  
  const [searchInput, setSearchInput] = useState(search);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setSearchInput(search);
    setDebouncedSearch(search);
  }, [search]);

  const updateParams = (newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
       if (v === null || v === '') next.delete(k);
       else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };

  const setView = (val) => updateParams({ view: val, filter: 'All' });
  const setFilter = (val) => updateParams({ filter: val });
  
  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
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
      isLoading
  } = useInfiniteQuery({
      queryKey: ['orders', view, debouncedSearch],
      queryFn: async ({ pageParam = 1 }) => {
          const res = await api.get(`/orders?view=${view}&search=${debouncedSearch}&page=${pageParam}&limit=20`);
          return res;
      },
      getNextPageParam: (lastPage) => {
           if (!lastPage || !lastPage.meta) return undefined;
           if (lastPage.meta.page < lastPage.meta.totalPages) return lastPage.meta.page + 1;
           return undefined;
      }
  });

  const orders = data?.pages.flatMap(page => page.data || []).filter(Boolean) || [];
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
     mutationFn: ({ id, status }) => api.patch(`/orders/${id}`, { status }),
     onSuccess: () => queryClient.invalidateQueries(['orders'])
  });

  const handleStatusChange = (id, status) => {
     updateStatusMutation.mutate({ id, status });
  };
  
  // Client-Side Filtering Logic
  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    if (filter === 'All') return true;
    
    // Status Mapping
    const s = order.status;
    const d = order.deliveryStatus;
    
    if (filter === 'Enquired') return s === 'ENQUIRED';
    if (filter === 'Confirmed') return s === 'CONFIRMED';
    if (filter === 'Production') return d === 'IN_PRODUCTION';
    if (filter === 'Ready') return d === 'READY';
    if (filter === 'Delivered') return d === 'FULLY_DELIVERED' || d === 'PARTIALLY_DELIVERED' || s === 'DELIVERED';
    
    if (filter === 'Closed') return s === 'CLOSED';
    if (filter === 'Cancelled') return s === 'CANCELLED';
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
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
              type="text" 
              placeholder="Search orders..." 
              className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              autoComplete="off"
           />
        </div>

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
                <div className="flex flex-col items-end gap-1">
                    <StatusSelect order={order} onChange={handleStatusChange} />
                    {order.deliveryStatus && !order.isQuickSale && <StatusBadge type="DELIVERY" status={order.deliveryStatus} />}
                </div>
              </div>
              
              <div className="flex justify-between items-start text-sm">
                 <div className="space-y-0.5">
                    <div className="font-medium text-gray-900">{order.customer?.name}</div>
                    <div className="text-xs text-gray-500">{order.customer?.address}</div>
                 </div>
                 <div className="text-right">
                    <div className="font-bold text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</div>
                     <div className="text-xs text-gray-500 mt-0.5">
                        Bal: <span className={Number(order.remainingBalance) > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                             ₹{Number(order.remainingBalance || 0).toLocaleString()}
                        </span>
                     </div>
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
                <th className="px-6 py-3" style={{ width: '200px' }}>Status</th>
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
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                        <StatusSelect order={order} onChange={handleStatusChange} />
                        {order.deliveryStatus && !order.isQuickSale && <StatusBadge type="DELIVERY" status={order.deliveryStatus} />}
                    </div>
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
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
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
  // Map DB ENUMs to Styles
  const styles = {
    ENQUIRED: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    CLOSED: 'bg-gray-800 text-white ring-gray-700/20',
    CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
    DELIVERED: 'bg-green-50 text-green-700 ring-green-600/20',
  };

  const style = styles[order.status] || 'bg-gray-100 text-gray-600';
  
  return (
    <div className="relative inline-block" onClick={e => e.stopPropagation()}>
      <select 
        value={order.status}
        onChange={(e) => {
           if (e.target.value === 'CLOSED') {
             if (!window.confirm('Closing this order will write off any remaining balance as a discount. Continue?')) return;
           }
           onChange(order.id, e.target.value);
        }}
        className={`appearance-none cursor-pointer pl-2.5 pr-6 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${style} border-none outline-none focus:ring-2 uppercase tracking-wide`}
      >
        <option value="ENQUIRED">Enquired</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CLOSED">Closed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
       {/* Tiny arrow hint */}
       <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="h-2 w-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
       </div>
    </div>
  );
};

const StatusBadge = ({ type, status }) => {
    if (!status) return null;
    
    // Config
    const config = {
        DELIVERY: {
            CONFIRMED: { label: 'Queue', color: 'bg-gray-50 text-gray-600 border-gray-200' },
            IN_PRODUCTION: { label: 'In Prod', color: 'bg-purple-50 text-purple-700 border-purple-100' },
            READY: { label: 'Ready', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            PARTIALLY_DELIVERED: { label: 'Part. Del', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
            FULLY_DELIVERED: { label: 'Delivered', color: 'bg-green-50 text-green-700 border-green-100' },
        }
    };

    const cfg = config[type]?.[status] || { label: status, color: 'bg-gray-100 text-gray-500' };

    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};
