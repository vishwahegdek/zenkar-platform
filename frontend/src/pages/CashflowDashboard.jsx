import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  format, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths
} from 'date-fns';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart2
} from 'lucide-react';

export default function CashflowDashboard() {
  const [rangeType, setRangeType] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customRange, setCustomRange] = useState({
    from: format(new Date(), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const [chartTimeframe, setChartTimeframe] = useState('day');
  const [showChart, setShowChart] = useState(true);

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
      case 'custom':
        return { 
            ...customRange, 
            label: `${format(new Date(customRange.from), 'MMM d')} - ${format(new Date(customRange.to), 'MMM d, yyyy')}`
        };
      default:
        return { from: format(anchor, 'yyyy-MM-dd'), to: format(anchor, 'yyyy-MM-dd'), label: '' };
    }
  }, [rangeType, selectedDate, customRange]);

  // Navigation Handlers
  const handlePrevious = () => {
    switch(rangeType) {
        case 'today': setSelectedDate(d => subDays(d, 1)); break;
        case 'week': setSelectedDate(d => subWeeks(d, 1)); break;
        case 'month': setSelectedDate(d => subMonths(d, 1)); break;
        default: break;
    }
  };

  const handleNext = () => {
    switch(rangeType) {
        case 'today': setSelectedDate(d => addDays(d, 1)); break;
        case 'week': setSelectedDate(d => addWeeks(d, 1)); break;
        case 'month': setSelectedDate(d => addMonths(d, 1)); break;
        default: break;
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['cashflow', from, to],
    queryFn: () => api.get(`/dashboard/cashflow?from=${from}&to=${to}`),
    refetchInterval: 60000,
  });

  const { data: chartData = [], isLoading: isChartLoading } = useQuery({
    queryKey: ['cashflowChart', from, to, chartTimeframe],
    queryFn: () => api.get(`/dashboard/chart?from=${from}&to=${to}&timeframe=${chartTimeframe}`),
    enabled: showChart // Only fetch if visible? Maybe keep fetching to avoid lag on toggle
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
      {/* Sticky Header with Navigation & Range Selector */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
               {/* View Toggles */}
               <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto overflow-x-auto max-w-full">
                {['today', 'week', 'month', 'custom'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRangeType(mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all whitespace-nowrap ${
                      rangeType === mode
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {mode === 'today' ? 'Day' : mode}
                  </button>
                ))}
              </div>

               {/* Navigation Controls */}
               <div className="flex items-center justify-between md:justify-end gap-3 flex-1">
                    {rangeType !== 'custom' && (
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                             <button 
                                 onClick={handlePrevious}
                                 className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all"
                             >
                                <ChevronLeft className="w-5 h-5" />
                             </button>
                             <span className="text-sm font-bold text-gray-900 min-w-[140px] text-center leading-none px-2 whitespace-nowrap">
                                {label}
                             </span>
                             <button 
                                 onClick={handleNext}
                                 className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all"
                             >
                                <ChevronRight className="w-5 h-5" />
                             </button>
                        </div>
                    )}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-4">
        {/* Mobile Single Row Summary */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            {/* Money In */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-0.5 md:gap-1 p-1 md:p-3 rounded-xl md:bg-green-50/50">
                <div className="flex items-center gap-1 text-green-600 mb-0.5">
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider">Money In</span>
                </div>
                <span className="md:hidden text-[10px] text-gray-400 font-medium uppercase tracking-wider">In</span>
                <div className="text-sm md:text-xl font-black text-gray-900 leading-tight">
                    {formatCurrency(summary.totalIn)}
                </div>
            </div>

            {/* Money Out */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-0.5 md:gap-1 p-1 md:p-3 rounded-xl md:bg-red-50/50">
                <div className="flex items-center gap-1 text-red-600 mb-0.5">
                    <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider">Money Out</span>
                </div>
                <span className="md:hidden text-[10px] text-gray-400 font-medium uppercase tracking-wider">Out</span>
                <div className="text-sm md:text-xl font-black text-gray-900 leading-tight">
                    {formatCurrency(summary.totalOut)}
                </div>
            </div>

            {/* Net */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-0.5 md:gap-1 p-1 md:p-3 rounded-xl bg-blue-50 md:bg-blue-600 md:text-white">
                <div className="flex items-center gap-1 text-blue-600 md:text-white/80 mb-0.5">
                    <Wallet className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider">Net</span>
                </div>
                <span className="md:hidden text-[10px] text-gray-400 font-medium uppercase tracking-wider">Net</span>
                <div className="text-sm md:text-xl font-black text-gray-900 md:text-white leading-tight">
                    {formatCurrency(summary.net)}
                </div>
            </div>
        </div>

        {/* Chart Section with Toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-4 flex items-center justify-between border-b border-gray-50">
                 <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-gray-400" />
                    <span>Trend Analysis</span>
                 </h2>
                 <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowChart(!showChart)}
                        className="text-xs font-medium text-blue-600 md:hidden"
                    >
                        {showChart ? 'Hide' : 'Show'}
                    </button>
                    {showChart && (
                        <div className="flex bg-gray-100 p-0.5 rounded-lg">
                            {['day', 'week', 'month'].map(tf => (
                            <button
                                key={tf}
                                onClick={() => setChartTimeframe(tf)}
                                className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md transition-all ${
                                chartTimeframe === tf ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'
                                }`}
                            >
                                {tf}
                            </button>
                            ))}
                        </div>
                    )}
                 </div>
             </div>
             
             {showChart && (
                <div className="h-64 w-full p-4 animate-in slide-in-from-top-2 duration-300">
                    {isChartLoading ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs">Loading chart...</div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs">No chart data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                            dataKey="date" 
                            fontSize={10} 
                            tickFormatter={(val) => {
                                const d = new Date(val);
                                if (chartTimeframe === 'month') return format(d, 'MMM yy');
                                return format(d, 'dd MMM');
                            }}
                            />
                            <YAxis fontSize={10} tickFormatter={(val) => `₹${val/1000}k`} />
                            <Tooltip 
                            formatter={(val) => formatCurrency(val)}
                            labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="income" name="Money In" fill="#16a34a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Money Out" fill="#dc2626" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
             )}
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
              <p className="text-gray-500 font-medium">No transactions for {label}</p>
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
