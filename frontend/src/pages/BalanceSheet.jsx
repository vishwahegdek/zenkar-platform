import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { format } from 'date-fns';
import { Scale, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BalanceSheet() {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: report, isLoading } = useQuery({
    queryKey: ['balanceSheet', asOfDate],
    queryFn: () => api.get(`/ledger/balance-sheet?date=${asOfDate}`),
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const AccountRow = ({ item }) => (
    <div className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors group">
      <Link to={`/ledger?accountId=${item.id}`} className="text-sm text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
        {item.name}
      </Link>
      <span className="text-sm font-semibold text-gray-900">
        {formatCurrency(item.balance)}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-6 h-6 text-blue-600" />
              Balance Sheet
            </h1>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium hidden md:inline-block">As of:</span>
              <div className="relative">
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400 font-medium">Calculating balances...</p>
          </div>
        ) : !report ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-medium">No data available.</p>
          </div>
        ) : (
          <>
            {!report.isBalanced && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-800">Balance Sheet is Out of Balance</h3>
                  <p className="text-sm text-red-600 mt-1">
                    Total Assets ({formatCurrency(report.assets.total)}) do not equal Total Liabilities & Equity ({formatCurrency(report.liabilities.total + report.equity.total)}).
                    This indicates a potential issue in the underlying double-entry records.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets Column */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Assets</h2>
                  </div>
                  <div className="p-4 space-y-1">
                    {report.assets.items.length === 0 ? (
                      <p className="text-sm text-gray-400 italic px-3 py-2">No assets recorded</p>
                    ) : (
                      report.assets.items.map(item => (
                        <AccountRow key={item.id} item={item} />
                      ))
                    )}
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-700">Total Assets</span>
                    <span className="text-lg font-black text-blue-600 border-double border-b-4 border-blue-600 pb-0.5">
                      {formatCurrency(report.assets.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="space-y-6">
                {/* Liabilities */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Liabilities</h2>
                  </div>
                  <div className="p-4 space-y-1">
                    {report.liabilities.items.length === 0 ? (
                      <p className="text-sm text-gray-400 italic px-3 py-2">No liabilities recorded</p>
                    ) : (
                      report.liabilities.items.map(item => (
                        <AccountRow key={item.id} item={item} />
                      ))
                    )}
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-700">Total Liabilities</span>
                    <span className="text-base font-black text-gray-900">
                      {formatCurrency(report.liabilities.total)}
                    </span>
                  </div>
                </div>

                {/* Equity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Equity</h2>
                  </div>
                  <div className="p-4 space-y-1">
                    {report.equity.items.map(item => (
                      <AccountRow key={item.id} item={item} />
                    ))}
                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-green-50/50">
                      <span className="text-sm text-green-800 font-bold">Retained Earnings (Net Income)</span>
                      <span className="text-sm font-black text-green-700">
                        {formatCurrency(report.equity.netIncome)}
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-700">Total Equity</span>
                    <span className="text-base font-black text-gray-900">
                      {formatCurrency(report.equity.total)}
                    </span>
                  </div>
                </div>

                {/* Total L & E */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total Liabilities & Equity</span>
                  <span className="text-lg font-black text-blue-600 border-double border-b-4 border-blue-600 pb-0.5">
                    {formatCurrency(report.liabilities.total + report.equity.total)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
