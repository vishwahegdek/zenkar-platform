import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import toast from 'react-hot-toast';
import { X, ArrowRightLeft } from 'lucide-react';
import PaymentMethodSelector from './PaymentMethodSelector';

export default function TransferMoneyModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState(null);
  const [toAccountId, setToAccountId] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const { data: accounts = [] } = useQuery({
    queryKey: ['treasuryAccounts'],
    queryFn: () => api.get('/ledger/treasury-accounts'),
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/ledger/transfer', data);
    },
    onSuccess: () => {
      toast.success('Transfer recorded successfully');
      queryClient.invalidateQueries(['ledgerEntries']);
      queryClient.invalidateQueries(['ledgerAccounts']);
      queryClient.invalidateQueries(['balanceSheet']);
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record transfer');
    }
  });

  const resetForm = () => {
    setAmount('');
    setFromAccountId(null);
    setToAccountId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      return toast.error('Please enter a valid amount');
    }
    if (!fromAccountId || !toAccountId) {
      return toast.error('Please select both source and destination accounts');
    }
    if (fromAccountId === toAccountId) {
      return toast.error('Source and destination accounts must be different');
    }
    mutation.mutate({
      fromAccountId,
      toAccountId,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      note,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            Transfer Money
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer From (Source)</label>
            <PaymentMethodSelector value={fromAccountId} onChange={setFromAccountId} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To (Destination)</label>
            <PaymentMethodSelector value={toAccountId} onChange={setToAccountId} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g., Cash deposited to bank"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isLoading ? 'Processing...' : 'Complete Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
