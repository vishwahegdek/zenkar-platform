import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CustomersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(searchParam);
  
  const queryClient = useQueryClient();

  // Keep local state in sync with URL (e.g. Back button)
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Debounce URL updates
  useEffect(() => {
    const timer = setTimeout(() => {
       if (searchTerm !== searchParam) {
          const next = new URLSearchParams(searchParams);
          if (searchTerm) next.set('search', searchTerm);
          else next.delete('search');
          setSearchParams(next, { replace: true });
       }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParam, setSearchParams]);

  // Use placeholderData to keep previous list while fetching new search results
  // This prevents 'isLoading' from being true during query params change if we have old data
  const { data: customers, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['customers', searchParam],
    queryFn: () => {
        return api.get('/customers', { params: { query: searchParam } });
    },
    placeholderData: keepPreviousData
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer deleted');
    },
    onError: (err) => toast.error('Failed to delete: ' + err.message)
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure? This relies on backend cascade (if any) or might fail if they have orders.')) {
        deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 md:px-0">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <div className="w-full md:w-auto flex gap-2">
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="input-field w-full md:w-64"
              value={searchTerm}
              onChange={handleSearch}
            />
            {/* Show tiny spinner if fetching in background and not placeholder (or initial load) */}
            {(isLoading && !customers) && <span className="text-xs text-gray-400 self-center">Loading...</span>}
            
            <Link to="/customers/new" className="hidden md:inline-flex bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 items-center gap-2">
              + New Customer
            </Link>
        </div>
      </div>

      {/* Conditional Rendering: Only list area is replaced, Header stays mounted */}
      {(isLoading && !customers) ? (
         <div className="p-8 text-center text-gray-500">Loading customers...</div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-0 ${isPlaceholderData ? 'opacity-50 transition-opacity' : ''}`}>
          {customers?.map(customer => (
            <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{customer.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{customer.phone || 'No Phone'}</p>
                  <p className="text-gray-500 text-sm">{customer.address || 'No Address'}</p>
                </div>
                <div className="flex gap-2">
                   <Link to={`/customers/${customer.id}/edit`} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full">
                      <span className="sr-only">Edit</span>
                      ✏️
                   </Link>
                </div>
              </div>
            </div>
          ))}
          
          {customers?.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                  No customers found.
              </div>
          )}
        </div>
      )}

      {/* Mobile FAB */}
      <Link to="/customers/new" className="md:hidden fixed bottom-6 right-6 bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 z-50 text-2xl">
        +
      </Link>
    </div>
  );
}
