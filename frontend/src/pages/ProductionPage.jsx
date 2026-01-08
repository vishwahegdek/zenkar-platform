import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Package, Calendar, AlertCircle, CheckCircle, Clock, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = [
    { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-gray-100 text-gray-700', icon: Clock },
    { value: 'IN_PRODUCTION', label: 'In Production', color: 'bg-blue-100 text-blue-700', icon: Package },
    { value: 'READY', label: 'Ready', color: 'bg-yellow-100 text-yellow-700', icon: CheckCircle },
    { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-700', icon: Truck },
];

export default function ProductionPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const queryClient = useQueryClient();

  // 1. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => api.get('/product-categories').then(res => res)
  });

  // Default to "Bee boxes"
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
        const defaultCat = categories.find(c => c.name === 'Bee boxes');
        if (defaultCat) setSelectedCategory(defaultCat.id);
    }
  }, [categories, selectedCategory]);

  // 2. Fetch Products
  const { data: productsData } = useQuery({
    queryKey: ['products-list', selectedCategory],
    queryFn: () => api.get('/products', { params: { categoryId: selectedCategory, limit: 100 } }), 
    enabled: !!selectedCategory
  });
  const products = productsData?.data || [];

  // 3. Fetch Production Items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['production-items', selectedCategory, selectedProduct],
    queryFn: () => api.get(`/orders/production/items?categoryId=${selectedCategory}&productId=${selectedProduct}`).then(res => res),
    enabled: !!selectedCategory
  });

  // 4. Update Status Mutation
  const updateStatusMutation = useMutation({
      mutationFn: ({ itemId, status }) => api.patch(`/orders/items/${itemId}/status`, { status }),
      onSuccess: () => {
          queryClient.invalidateQueries(['production-items']);
      },
      onError: (err) => {
          alert('Failed to update status: ' + (err.response?.data?.message || err.message));
      }
  });

  const handleStatusChange = (itemId, newStatus) => {
      updateStatusMutation.mutate({ itemId, status: newStatus });
  };

  const getStatusBadge = (status) => {
      const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
      const Icon = opt.icon;
      return (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${opt.color}`}>
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 md:px-0">
         <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-8 h-8 text-primary" />
                Production Queue
            </h1>
            <p className="text-gray-500">Manage production workflow and delivery status</p>
         </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
              <select 
                  value={selectedCategory} 
                  onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedProduct('');
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                  <option value="">-- Select Category --</option>
                  {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>
          </div>

          <div className="flex-1 w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Product</label>
              <select 
                  value={selectedProduct} 
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  disabled={!selectedCategory}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100"
              >
                  <option value="">-- All Products in Category --</option>
                  {products.map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                  ))}
              </select>
          </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {!selectedCategory ? (
               <div className="text-center py-20 bg-gray-50 text-gray-400">
                   <p>Select a category to view production items</p>
               </div>
          ) : isLoading ? (
               <div className="text-center py-12">Loading items...</div>
          ) : items.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 text-gray-400">
                   No pending items found.
               </div>
          ) : (
              <>
                  {/* Mobile View */}
                  <div className="block md:hidden divide-y divide-gray-100">
                      {items.map((item) => (
                          <div 
                              key={item.id} 
                              className="p-4 space-y-3 active:bg-gray-50 transition-colors"
                              onClick={() => navigate(`/orders/${item.orderId}`)}
                          >
                              <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                      <div className="font-bold text-gray-900 text-lg">{item.productName}</div>
                                      <div className="text-sm text-gray-500">{item.customerName} • {item.orderNo}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-xl text-gray-900">{item.quantity} {item.unit}</div>
                                      <div className="text-sm text-gray-600 font-mono mt-0.5">
                                          {item.bookedPrice?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                      </div>
                                  </div>
                              </div>
                              
                              {item.description && (
                                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{item.description}</div>
                              )}

                                  <div className="flex justify-between items-center gap-3 pt-2">
                                  <select
                                      value={item.status || 'CONFIRMED'}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs p-1.5 border bg-gray-50"
                                  >
                                      {STATUS_OPTIONS.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                  </select>
                                  
                                  {item.dueDate && (
                                      <div className={`text-xs flex items-center gap-1 whitespace-nowrap ${new Date(item.dueDate) < new Date() ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                          {new Date(item.dueDate) < new Date() && <AlertCircle className="w-3 h-3" />}
                                          Due: {format(new Date(item.dueDate), 'dd MMM')}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto min-h-[400px]">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                              <tr>
                                  <th className="px-6 py-3 font-medium">Item Details</th>
                                  <th className="px-6 py-3 font-medium">Customer</th>
                                  <th className="px-6 py-3 font-medium text-right">Qty</th>
                                  <th className="px-6 py-3 font-medium">Status / Action</th>
                                  <th className="px-6 py-3 font-medium">Dates</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {items.map((item) => (
                                  <tr 
                                    key={item.id} 
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/orders/${item.orderId}`)}
                                  >
                                      <td className="px-6 py-4">
                                          <div className="font-medium text-gray-900">{item.productName}</div>
                                          {item.description && <div className="text-xs text-gray-500 max-w-xs">{item.description}</div>}
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="font-medium text-gray-900">{item.customerName}</div>
                                          <div className="text-xs text-gray-500">{item.orderNo}</div>
                                      </td>
                                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                                          {item.quantity}
                                      </td>
                                      <td className="px-6 py-4">
                                          <select
                                              value={item.status || 'CONFIRMED'}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                              className={`block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs p-1.5 border cursor-pointer ${
                                                  STATUS_OPTIONS.find(o => o.value === item.status)?.color?.split(' ')[0] || 'bg-white'
                                              }`}
                                          >
                                              {STATUS_OPTIONS.map(opt => (
                                                  <option key={opt.value} value={opt.value}>
                                                      {opt.label}
                                                  </option>
                                              ))}
                                          </select>
                                      </td>
                                      <td className="px-6 py-4 text-gray-500">
                                          <div className="flex flex-col gap-1 text-xs">
                                              <span>Ord: {format(new Date(item.orderDate), 'dd MMM')}</span>
                                              {item.dueDate && (
                                                  <span className={new Date(item.dueDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                                                      Due: {format(new Date(item.dueDate), 'dd MMM')}
                                                  </span>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </>
          )}
      </div>
    </div>
  );
}
