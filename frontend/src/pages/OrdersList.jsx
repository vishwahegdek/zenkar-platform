import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function OrdersList() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
  });

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'All' || order.status.toLowerCase() === filter.toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      (order.customer?.name || '').toLowerCase().includes(searchLower) ||
      (order.orderNo || '').toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Manage and track all customer orders</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
           {['All', 'Enquired', 'Confirmed', 'Production', 'Ready', 'Delivered'].map(f => (
             <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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
            <div key={order.id} className="p-4 space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/orders/${order.id}/edit`} className="font-bold text-gray-900">
                    {order.orderNo || `#${order.id}`}
                  </Link>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                 <div>
                    <div className="font-medium text-gray-900">{order.customer?.name}</div>
                    <div className="text-xs text-gray-500">{order.customer?.phone}</div>
                 </div>
                 <div className="text-right">
                    <div className="font-bold text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Due: {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}</div>
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
                <th className="px-6 py-3 w-32">Order No</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3 w-32">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 w-40">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group cursor-default">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link to={`/orders/${order.id}/edit`} className="text-blue-600 hover:underline">
                      {order.orderNo || `#${order.id}`}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.customer?.name}</div>
                    <div className="text-xs text-gray-500">{order.customer?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                     ₹{Number(order.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No orders found matching your filters.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
    cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  };
  
  const style = styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}
