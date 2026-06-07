import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';

export default function ManualAdjustmentModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    debitAccountId: '',
    creditAccountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['ledgerAccounts'],
    queryFn: () => api.get('/ledger/accounts'),
    enabled: isOpen
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/ledger/adjustments', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ledgerEntries']);
      queryClient.invalidateQueries(['balanceSheet']);
      toast.success('Account Adjustment saved successfully');
      onClose();
      setFormData({
        debitAccountId: '',
        creditAccountId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
      });
    },
    onError: (err) => {
      toast.error('Failed to save adjustment: ' + (err.response?.data?.message || err.message));
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.debitAccountId || !formData.creditAccountId || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    if (formData.debitAccountId === formData.creditAccountId) {
      toast.error('Cannot adjust between the same account');
      return;
    }
    
    mutation.mutate({
      ...formData,
      debitAccountId: Number(formData.debitAccountId),
      creditAccountId: Number(formData.creditAccountId),
      amount: Number(formData.amount)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-bold text-gray-900">New Account Adjustment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
        </div>
        
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
          <strong>Tip:</strong> Use this to move money between buckets to fix errors, write off debts, or correct missing cash.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                required
                className="w-full border-gray-300 rounded-lg p-2 focus:ring-blue-500"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-100 col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-red-800 mb-1">Money Leaves Here (Credit)</label>
              <p className="text-[10px] text-red-600 mb-2 leading-tight">Select the account that is decreasing or sending money.</p>
              <select 
                required
                className="w-full text-sm border-red-200 rounded p-2"
                value={formData.creditAccountId}
                onChange={e => setFormData({...formData, creditAccountId: e.target.value})}
              >
                <option value="">Select Account...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))}
              </select>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-100 col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-green-800 mb-1">Money Enters Here (Debit)</label>
              <p className="text-[10px] text-green-600 mb-2 leading-tight">Select the account that is increasing or receiving money.</p>
              <select 
                required
                className="w-full text-sm border-green-200 rounded p-2"
                value={formData.debitAccountId}
                onChange={e => setFormData({...formData, debitAccountId: e.target.value})}
              >
                <option value="">Select Account...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input 
                type="number" 
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full border-gray-300 rounded-lg p-2 font-bold text-lg focus:ring-blue-500"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Note</label>
              <input 
                type="text" 
                required
                placeholder="e.g., Writing off customer debt, fixing missing cash..."
                className="w-full border-gray-300 rounded-lg p-2 focus:ring-blue-500"
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
