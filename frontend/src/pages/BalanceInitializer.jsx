import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';

export default function BalanceInitializer() {
  const queryClient = useQueryClient();
  const [actualBalances, setActualBalances] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: balanceSheet, isLoading } = useQuery({
    queryKey: ['balanceSheetInit'],
    queryFn: () => api.get('/ledger/balance-sheet'),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['ledgerAccountsAll'],
    queryFn: () => api.get('/ledger/accounts'),
  });

  const allAccounts = Array.isArray(accountsData) ? accountsData : (accountsData?.data || []);
  
  // Find the Opening Balance Equity account
  const equityAccount = allAccounts.find(a => a.name === 'Opening Balance Equity' && a.type === 'EQUITY');

  // We want to list all Asset and Liability accounts
  const accountsToInit = [];
  if (balanceSheet) {
    const data = balanceSheet.data ? balanceSheet.data : balanceSheet;
    accountsToInit.push(...(data.assets?.items || []));
    accountsToInit.push(...(data.liabilities?.items || []));
  }

  // Handle Input Change
  const handleBalanceChange = (accountId, value) => {
    setActualBalances(prev => ({
      ...prev,
      [accountId]: value
    }));
  };

  const handleSave = async () => {
    if (!equityAccount) {
      toast.error('Opening Balance Equity account not found. Please contact support.');
      return;
    }

    const adjustmentsToMake = [];

    for (const acc of accountsToInit) {
      const actualValStr = actualBalances[acc.id];
      if (actualValStr === undefined || actualValStr === '') continue;
      
      const actualBalance = Number(actualValStr);
      const systemBalance = Number(acc.balance || 0);
      
      if (actualBalance !== systemBalance) {
        const difference = actualBalance - systemBalance;
        
        let debitAccountId = null;
        let creditAccountId = null;
        let amount = Math.abs(difference);

        if (acc.type === 'ASSET') {
          if (difference > 0) {
            // Asset needs to increase -> Debit Asset, Credit Equity
            debitAccountId = acc.id;
            creditAccountId = equityAccount.id;
          } else {
            // Asset needs to decrease -> Debit Equity, Credit Asset
            debitAccountId = equityAccount.id;
            creditAccountId = acc.id;
          }
        } else if (acc.type === 'LIABILITY') {
          if (difference > 0) {
            // Liability needs to increase -> Debit Equity, Credit Liability
            debitAccountId = equityAccount.id;
            creditAccountId = acc.id;
          } else {
            // Liability needs to decrease -> Debit Liability, Credit Equity
            debitAccountId = acc.id;
            creditAccountId = equityAccount.id;
          }
        }

        if (debitAccountId && creditAccountId) {
          adjustmentsToMake.push({
            debitAccountId,
            creditAccountId,
            amount,
            date: new Date().toISOString().split('T')[0],
            note: `Opening Balance True-Up (from ${systemBalance} to ${actualBalance})`
          });
        }
      }
    }

    if (adjustmentsToMake.length === 0) {
      toast.info('No balances were changed.');
      return;
    }

    if (!window.confirm(`You are about to make ${adjustmentsToMake.length} ledger adjustments. Are you sure?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      for (const adj of adjustmentsToMake) {
        await api.post('/ledger/adjustments', adj);
      }
      toast.success(`Successfully applied ${adjustmentsToMake.length} adjustments!`);
      setActualBalances({});
      queryClient.invalidateQueries(['balanceSheetInit']);
      queryClient.invalidateQueries(['balanceSheet']);
      queryClient.invalidateQueries(['ledgerEntries']);
    } catch (err) {
      toast.error('Some adjustments failed. Please check the ledger.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Opening Balance Initializer</h1>
        <p className="text-gray-600 text-sm mb-6">
          Use this tool to true-up your accounts. Enter the <strong>actual physical balance</strong> for any account where the system balance is wrong. Leave the input blank if the system balance is correct. 
          When you click save, the system will automatically create adjusting entries against <strong>Opening Balance Equity</strong>.
        </p>

        {!equityAccount && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 font-medium">
            Error: "Opening Balance Equity" account not found in your ledger. This tool cannot function without it.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 font-bold text-gray-700">Account Name</th>
                <th className="px-4 py-3 font-bold text-gray-700 w-32">Type</th>
                <th className="px-4 py-3 font-bold text-gray-700 text-right w-40">System Balance (₹)</th>
                <th className="px-4 py-3 font-bold text-gray-700 w-48">Actual Balance (₹)</th>
                <th className="px-4 py-3 font-bold text-gray-700 text-right w-32">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accountsToInit.map((acc) => {
                const actualStr = actualBalances[acc.id];
                const hasInput = actualStr !== undefined && actualStr !== '';
                const sysBal = Number(acc.balance || 0);
                const actBal = hasInput ? Number(actualStr) : sysBal;
                const diff = actBal - sysBal;

                return (
                  <tr key={acc.id} className={hasInput && diff !== 0 ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{acc.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-bold uppercase">{acc.type}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-600">{sysBal.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        className="w-full border-gray-300 rounded p-1.5 focus:ring-blue-500 text-right"
                        placeholder="Leave blank if correct"
                        value={actualStr || ''}
                        onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
                      />
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {diff > 0 ? '+' : ''}{diff !== 0 ? diff.toLocaleString() : '-'}
                    </td>
                  </tr>
                );
              })}
              {accountsToInit.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No accounts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !equityAccount}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Apply True-Up Adjustments'}
          </button>
        </div>
      </div>
    </div>
  );
}
