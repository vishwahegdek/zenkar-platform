import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subWeeks, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, Filter, Plus } from 'lucide-react';
import ManualAdjustmentModal from '../components/ManualAdjustmentModal';

export default function LedgerDashboard() {
  const [searchParams] = useSearchParams();
  const initialAccountId = searchParams.get('accountId') || '';
  const [rangeType, setRangeType] = useState(initialAccountId ? 'all' : 'month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAccount, setSelectedAccount] = useState(initialAccountId);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // If the URL changes, update the local state
  useEffect(() => {
    const accountId = searchParams.get('accountId');
    if (accountId !== null && accountId !== selectedAccount) {
      setSelectedAccount(accountId);
    }
  }, [searchParams]);

  const { from, to, label } = useMemo(() => {
    const anchor = selectedDate;
    switch (rangeType) {
      case 'today':
        const day = format(anchor, 'yyyy-MM-dd');
        return { from: day, to: day, label: format(anchor, 'EEEE, MMM d, yyyy') };
      case 'week': {
        const start = startOfWeek(anchor, { weekStartsOn: 1 });
        const end = endOfWeek(anchor, { weekStartsOn: 1 });
        return { 
          from: format(start, 'yyyy-MM-dd'), 
          to: format(end, 'yyyy-MM-dd'),
          label: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
        };
      }
      case 'month': {
        const start = startOfMonth(anchor);
        const end = endOfMonth(anchor);
        return { 
          from: format(start, 'yyyy-MM-dd'), 
          to: format(end, 'yyyy-MM-dd'),
          label: format(anchor, 'MMMM yyyy')
        };
      }
      case 'all':
        return {
          from: '2000-01-01',
          to: '2099-12-31',
          label: 'All Time'
        };
      default:
        return { from: format(anchor, 'yyyy-MM-dd'), to: format(anchor, 'yyyy-MM-dd'), label: '' };
    }
  }, [rangeType, selectedDate]);

  const handlePrevious = () => {
    switch(rangeType) {
        case 'today': setSelectedDate(d => subDays(d, 1)); break;
        case 'week': setSelectedDate(d => subWeeks(d, 1)); break;
        case 'month': setSelectedDate(d => subMonths(d, 1)); break;
        case 'all': break;
        default: break;
    }
  };

  const handleNext = () => {
    switch(rangeType) {
        case 'today': setSelectedDate(d => addDays(d, 1)); break;
        case 'week': setSelectedDate(d => addWeeks(d, 1)); break;
        case 'month': setSelectedDate(d => addMonths(d, 1)); break;
        case 'all': break;
        default: break;
    }
  };

  const { data: accounts = [] } = useQuery({
    queryKey: ['ledgerAccounts'],
    queryFn: () => api.get('/ledger/accounts'),
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ledgerEntries', from, to, selectedAccount],
    queryFn: () => api.get(`/ledger/entries?from=${from}&to=${to}${selectedAccount ? `&accountId=${selectedAccount}` : ''}`),
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto">
              {['today', 'week', 'month', 'all'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRangeType(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all whitespace-nowrap ${
                    rangeType === mode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'today' ? 'Day' : mode === 'all' ? 'All Time' : mode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 max-w-[200px]"
              >
                <option value="">All Accounts</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))}
              </select>

              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                <button onClick={handlePrevious} className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-gray-900 min-w-[140px] text-center leading-none px-2 whitespace-nowrap">
                  {label}
                </span>
                <button onClick={handleNext} className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button 
                onClick={() => setIsAdjustmentModalOpen(true)}
                className="hidden md:flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Adjustment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> General Ledger
            </h2>
            <span className="text-[10px] font-medium text-gray-400 px-2 py-0.5 bg-gray-50 rounded-full">
              {entries.length} entries
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 font-medium">Loading ledger...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No ledger entries found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs uppercase text-gray-400 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Txn ID</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                    <th className="px-4 py-3 font-medium text-right text-red-600">Debit (DR)</th>
                    <th className="px-4 py-3 font-medium text-right text-green-600">Credit (CR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {format(new Date(entry.date), 'dd MMM yyyy')}
                        <div className="text-[10px] text-gray-400">{format(new Date(entry.createdAt), 'HH:mm')}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-500">{entry.transactionId}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{entry.accountName}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{entry.accountType}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" title={entry.note}>
                        {entry.note || <span className="text-gray-300 italic">No note</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ManualAdjustmentModal 
        isOpen={isAdjustmentModalOpen} 
        onClose={() => setIsAdjustmentModalOpen(false)} 
      />
    </div>
  );
}
