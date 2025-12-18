import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function CreditorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: creditor, isLoading } = useQuery({
    queryKey: ['creditor', id],
    queryFn: () => api.get(`/creditors/${id}`)
  });

  const [txForm, setTxForm] = useState({
      isOpen: false,
      amount: '',
      type: 'DEBT_INC', // Default to borrowing/purchase
      date: new Date().toISOString().split('T')[0],
      note: ''
  });

  const txMutation = useMutation({
    mutationFn: (data) => api.post(`/creditors/${id}/transactions`, data),
    onSuccess: () => {
        queryClient.invalidateQueries(['creditor', id]);
        toast.success('Transaction recorded');
        setTxForm({ ...txForm, isOpen: false, amount: '', note: '' });
    },
    onError: (e) => toast.error('Failed: ' + e.message)
  });

  const handleSubmit = (e) => {
      e.preventDefault();
      if (!txForm.amount) return;
      txMutation.mutate({
          amount: parseFloat(txForm.amount),
          type: txForm.type,
          date: new Date(txForm.date).toISOString(),
          note: txForm.note
      });
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!creditor) return <div className="p-8 text-center">Not Found</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Creditor Account</div>
                  <h1 className="text-3xl font-bold text-gray-900">{creditor.name}</h1>
                  {creditor.phone && <p className="text-gray-600">📞 {creditor.phone}</p>}
                  {creditor.notes && <p className="text-gray-500 text-sm mt-2">{creditor.notes}</p>}
              </div>
              <div className="text-right bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Net Balance (We Owe)</div>
                  <div className={`text-3xl font-bold ${creditor.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Number(creditor.balance).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </div>
              </div>
          </div>
          
          <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setTxForm({ ...txForm, isOpen: true, type: 'DEBT_INC' })}
                className="flex-1 md:flex-none bg-red-100 text-red-700 px-6 py-3 rounded-lg font-bold hover:bg-red-200 border border-red-200"
              >
                  + Add Debt (Generic)
              </button>
              <button 
                onClick={() => setTxForm({ ...txForm, isOpen: true, type: 'DEBT_DEC' })}
                className="flex-1 md:flex-none bg-green-100 text-green-700 px-6 py-3 rounded-lg font-bold hover:bg-green-200 border border-green-200"
              >
                  - Record Repayment
              </button>
              <button onClick={() => navigate('/creditors')} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  Back
              </button>
          </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-700">Statement / History</h2>
          </div>
          <div className="divide-y divide-gray-100">
              {creditor.transactions && creditor.transactions.length > 0 ? creditor.transactions.map((tx) => (
                  <div key={tx.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                      <div>
                          <p className="font-medium text-gray-900">
                             {tx.type === 'DEBT_INC' ? 'Added Debt' : 'Repayment'}
                          </p>
                          <p className="text-xs text-gray-400">
                             {format(new Date(tx.date), 'dd/MM/yyyy')}
                          </p>
                          {tx.note && <p className="text-sm text-gray-500 mt-1">{tx.note}</p>}
                      </div>
                      <div className={`font-mono font-bold ${tx.type === 'DEBT_INC' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.type === 'DEBT_INC' ? '+' : '-'}{Number(tx.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </div>
                  </div>
              )) : (
                  <div className="p-8 text-center text-gray-400 italic">No transactions recorded</div>
              )}
          </div>
      </div>

      {/* Transaction Modal (Simple Inline) */}
      {txForm.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h2 className="text-xl font-bold mb-4">
                      {txForm.type === 'DEBT_INC' ? 'Record New Debt' : 'Record Repayment'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <input 
                              type="number" 
                              step="0.01"
                              className="input-field w-full text-lg" 
                              value={txForm.amount}
                              onChange={e => setTxForm({...txForm, amount: e.target.value})}
                              required
                              autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input 
                              type="date" 
                              className="input-field w-full" 
                              value={txForm.date}
                              onChange={e => setTxForm({...txForm, date: e.target.value})}
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Note / Description</label>
                          <textarea 
                              className="input-field w-full" 
                              value={txForm.note}
                              onChange={e => setTxForm({...txForm, note: e.target.value})}
                              placeholder="e.g. Purchase of materials"
                              rows={3}
                          />
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button 
                              type="button" 
                              onClick={() => setTxForm({...txForm, isOpen: false})}
                              className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className={`flex-1 py-3 text-white rounded-xl font-medium ${txForm.type === 'DEBT_INC' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                          >
                              Confirm
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
