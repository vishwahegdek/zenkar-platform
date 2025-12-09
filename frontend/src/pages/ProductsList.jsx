import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function ProductsList() {
  const [search, setSearch] = useState('');
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products'),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['products']),
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredProducts = products.filter(product => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (product.name || '').toLowerCase().includes(searchLower);
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        
        <Link 
          to="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          + New Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
           <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
           />
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredProducts.map(product => (
            <div key={product.id} className="p-4 space-y-2 bg-white">
              <div className="flex justify-between items-start">
                <div className="font-bold text-gray-900">{product.name}</div>
                <div className="font-bold text-gray-900">₹{Number(product.defaultUnitPrice).toLocaleString()}</div>
              </div>
              
              {product.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{product.notes}</div>
              )}

              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <Link to={`/products/${product.id}/edit`} className="flex-1 py-1.5 text-center text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 border border-blue-100">
                  Edit
                </Link>
                <button onClick={() => handleDelete(product.id)} className="flex-1 py-1.5 text-center text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 border border-red-100">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
             <div className="p-8 text-center text-gray-400 text-sm">No products found.</div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-64">Name</th>
                <th className="px-6 py-3 w-32 text-right">Price (₹)</th>
                <th className="px-6 py-3">Notes</th>
                <th className="px-6 py-3 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link to={`/products/${product.id}/edit`} className="hover:underline text-blue-600">
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                     {Number(product.defaultUnitPrice).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-500 truncate max-w-xs">
                    {product.notes || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        to={`/products/${product.id}/edit`}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                         title="Edit Product"
                      >
                         ✏️
                      </Link>
                      <button 
                         onClick={() => handleDelete(product.id)}
                         className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                         title="Delete Product"
                      >
                         🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No products found.
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
