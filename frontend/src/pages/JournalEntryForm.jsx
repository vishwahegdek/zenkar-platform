import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

export default function JournalEntryForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState([
    { id: 1, accountId: '', debit: '', credit: '' },
    { id: 2, accountId: '', debit: '', credit: '' },
  ]);

  const { data: accounts } = useQuery({
    queryKey: ['ledgerAccounts'],
    queryFn: () => api.get('/ledger/accounts'),
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/ledger/journal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgerEntries'] });
      queryClient.invalidateQueries({ queryKey: ['balanceSheet'] });
      navigate('/ledger');
    },
  });

  const handleAddRow = () => {
    setEntries([
      ...entries,
      { id: Date.now(), accountId: '', debit: '', credit: '' },
    ]);
  };

  const handleRemoveRow = (id) => {
    if (entries.length <= 2) return; // Keep at least 2 rows
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleChange = (id, field, value) => {
    setEntries(
      entries.map((e) => {
        if (e.id === id) {
          const newEntry = { ...e, [field]: value };
          // If setting debit, clear credit and vice versa
          if (field === 'debit' && value !== '') newEntry.credit = '';
          if (field === 'credit' && value !== '') newEntry.debit = '';
          return newEntry;
        }
        return e;
      })
    );
  };

  const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const hasValidEntries = totalDebit > 0 && entries.every(e => e.accountId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Total Debits must equal Total Credits');
      return;
    }
    if (!hasValidEntries) {
      alert('Please fill out all accounts and ensure amounts are greater than 0');
      return;
    }

    const payload = {
      date,
      note,
      entries: entries.map((e) => ({
        accountId: Number(e.accountId),
        debit: Number(e.debit) || 0,
        credit: Number(e.credit) || 0,
      })),
    };

    mutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Manual Journal Entry</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note / Description</label>
              <input
                type="text"
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Recording bank interest"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Entries</h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>

            <div className="overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-gray-600 text-sm">
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 font-medium w-32 text-right">Debit (₹)</th>
                    <th className="pb-2 font-medium w-32 text-right">Credit (₹)</th>
                    <th className="pb-2 font-medium w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="group">
                      <td className="py-3 pr-4">
                        <SearchableSelect
                          options={accounts?.map(acc => ({
                            value: acc.id,
                            label: acc.name,
                            subLabel: acc.type
                          })) || []}
                          value={entry.accountId}
                          onChange={(val) => handleChange(entry.id, 'accountId', val)}
                          placeholder="Select Account"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.debit}
                          onChange={(e) => handleChange(entry.id, 'debit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                          disabled={entry.credit !== ''}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.credit}
                          onChange={(e) => handleChange(entry.id, 'credit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                          disabled={entry.debit !== ''}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(entry.id)}
                          disabled={entries.length <= 2}
                          className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="py-4 text-right pr-4">Total:</td>
                    <td className={`py-4 px-2 text-right ${isBalanced ? 'text-gray-800' : 'text-red-600'}`}>
                      ₹{totalDebit.toFixed(2)}
                    </td>
                    <td className={`py-4 px-2 text-right ${isBalanced ? 'text-gray-800' : 'text-red-600'}`}>
                      ₹{totalCredit.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {!isBalanced && (
              <p className="text-red-500 text-sm mt-2 text-right pr-12">
                Difference: ₹{Math.abs(totalDebit - totalCredit).toFixed(2)}. Debits must equal credits.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-6 border-t mt-8">
            <button
              type="submit"
              disabled={mutation.isPending || !isBalanced || !hasValidEntries}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {mutation.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Journal Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
