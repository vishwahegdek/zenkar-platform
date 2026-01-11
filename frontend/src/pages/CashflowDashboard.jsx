import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isSameDay,
  parseISO
} from 'date-fns';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';

const RANGE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

export default function CashflowDashboard() {
  const [rangeType, setRangeType] = useState('today');
  const [customRange, setCustomRange] = useState({
    from: format(new Date(), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const { from, to } = useMemo(() => {
    const now = new Date();
    switch (rangeType) {
      case 'today':
        const day = format(now, 'yyyy-MM-dd');
        return { from: day, to: day };
      case 'week':
        return { 
          from: format(subDays(now, 7), 'yyyy-MM-dd'), 
          to: format(now, 'yyyy-MM-dd') 
        };
      case 'month':
        return { 
          from: format(subDays(now, 30), 'yyyy-MM-dd'), 
          to: format(now, 'yyyy-MM-dd') 
        };
      case 'custom':
        return customRange;
      default:
        return { from: format(now, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
    }
  }, [rangeType, customRange]);

  const { data, isLoading } = useQuery({
    queryKey: ['cashflow', from, to],
    queryFn: () => api.get(`/dashboard/cashflow?from=${from}&to=${to}`),
    refetchInterval: 60000,
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const summary = data?.summary || { totalIn: 0, totalOut: 0, net: 0 };
  const entries = data?.entries || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Sticky Header with Range Selector */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Cashflow
              </h1>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRangeType(opt.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      rangeType === opt.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {rangeType === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="date"
                  value={customRange.from}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                  className="flex-1 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customRange.to}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                  className="flex-1 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Money In</span>
            </div>
            <div className="text-xl font-black text-gray-900">
              {formatCurrency(summary.totalIn)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-red-600">
              <TrendingDown className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Money Out</span>
            </div>
            <div className="text-xl font-black text-gray-900">
              {formatCurrency(summary.totalOut)}
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-blue-600 p-4 rounded-2xl shadow-md flex flex-col gap-1 text-white">
            <div className="flex items-center gap-1.5 opacity-80">
              <Wallet className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Net Cashflow</span>
            </div>
            <div className="text-xl font-black">
              {formatCurrency(summary.net)}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">Transactions</h2>
            <span className="text-[10px] font-medium text-gray-400 px-2 py-0.5 bg-gray-50 rounded-full">
              {entries.length} items
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 font-medium">Checking accounts...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No transactions in this period</p>
              <p className="text-xs text-gray-400 mt-1">Try selecting a different date range</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-xl flex-shrink-0 ${
                    entry.type === 'IN' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {entry.type === 'IN' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {entry.category}
                      </h3>
                      <span className={`text-sm font-black whitespace-nowrap ${
                        entry.type === 'IN' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {entry.type === 'IN' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {entry.description}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(entry.time), 'dd MMM, hh:mm a')}
                      </span>
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                        {entry.source}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
