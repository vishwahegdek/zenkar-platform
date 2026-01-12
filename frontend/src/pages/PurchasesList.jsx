import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

export default function PurchasesList() {
  const navigate = useNavigate();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.get('/purchases'),
  });

  if (isLoading) return <div className="p-8 text-center">Loading purchases...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
        <button
          onClick={() => navigate('/purchases/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Supplier</th>

              <th className="px-6 py-3 font-medium">Items</th>
              <th className="px-6 py-3 font-medium text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No purchases recorded yet.
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {format(new Date(purchase.purchaseDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {purchase.supplier?.name || 'Unknown Supplier'}
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {purchase.items?.length || 0} items
                    <div className="text-xs text-gray-400 truncate max-w-xs">
                        {purchase.items?.map(i => i.product?.name).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₹{Number(purchase.totalAmount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
