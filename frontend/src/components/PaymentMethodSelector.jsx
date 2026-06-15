import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Banknote, Landmark } from 'lucide-react';

export default function PaymentMethodSelector({ value, onChange }) {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['treasuryAccounts'],
    queryFn: () => api.get('/ledger/treasury-accounts'),
  });


  if (isLoading) return <div className="h-10 animate-pulse bg-gray-100 rounded-lg"></div>;
  if (accounts.length === 0) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {accounts.map(acc => {
          const isSelected = value === acc.id;
          const isCash = acc.subType === 'CASH';
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => onChange(acc.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                isSelected
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isCash ? (
                <Banknote className={`w-4 h-4 ${isSelected ? 'text-green-600' : ''}`} />
              ) : (
                <Landmark className={`w-4 h-4 ${isSelected ? 'text-blue-600' : ''}`} />
              )}
              {acc.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
