import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { format } from 'date-fns';
import { Plus, Trash2, Edit } from 'lucide-react';

const STATUS_COLORS = {
  ORDERED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function PurchasesList() {
  const navigate = useNavigate();

  const { data: purchases = [], isLoading, refetch } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.get('/purchases'),
  });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this purchase? This will reverse inventory and ledger entries.')) {
      try {
        await api.delete(`/purchases/${id}`);
        refetch();
      } catch (error) {
        console.error('Failed to delete purchase', error);
        alert('Failed to delete purchase');
      }
    }
  };

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
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Supplier</th>
              <th className="px-6 py-3 font-medium">Items</th>
              <th className="px-6 py-3 font-medium text-right">Payments</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No purchases recorded yet.
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => {
                const totalPaid = purchase.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
                const balance = Number(purchase.totalAmount) - totalPaid;
                
                return (
                <tr 
                  key={purchase.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{format(new Date(purchase.purchaseDate), 'dd MMM yyyy')}</div>
                    <div className="text-xs text-gray-400">#{purchase.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[purchase.status] || 'bg-gray-100 text-gray-800'}`}>
                      {purchase.status || 'RECEIVED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {purchase.supplier?.name || 'Unknown Supplier'}
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    <div className="font-medium">{purchase.items?.length || 0} items</div>
                    <div className="text-xs text-gray-400 truncate max-w-[150px]">
                        {purchase.items?.map(i => i.product?.name).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-gray-900">₹{Number(purchase.totalAmount).toLocaleString('en-IN')}</div>
                    {balance > 0 ? (
                      <div className="text-xs font-medium text-red-500 mt-0.5">Due: ₹{balance.toLocaleString('en-IN')}</div>
                    ) : (
                      <div className="text-xs font-medium text-green-500 mt-0.5">Paid</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/purchases/${purchase.id}/edit`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        title="Edit Purchase"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, purchase.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete Purchase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
