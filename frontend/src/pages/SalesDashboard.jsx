import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { 
  format, subDays, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, addDays, addWeeks, 
  addMonths, subWeeks, subMonths 
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, TrendingUp, 
  ShoppingCart, Tag, Award, Percent, BarChart2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

export default function SalesDashboard() {
  const [rangeType, setRangeType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [chartTimeframe, setChartTimeframe] = useState('day');
  const [showChart, setShowChart] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

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
          from: customFrom,
          to: customTo,
          label: 'Custom Range'
        };
      default:
        return { from: format(anchor, 'yyyy-MM-dd'), to: format(anchor, 'yyyy-MM-dd'), label: '' };
    }
  }, [rangeType, selectedDate, customFrom, customTo]);

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
    queryKey: ['salesAnalytics', from, to, chartTimeframe],
    queryFn: () => api.get(`/dashboard/sales?from=${from}&to=${to}&timeframe=${chartTimeframe}`),
  });

  const displayTrend = useMemo(() => {
    if (!data?.trend) return [];
    if (selectedCategory === 'All') return data.trend;
    
    return data.trend.map(t => ({
       date: t.date,
       revenue: t.categories?.[selectedCategory] || 0
    }));
  }, [data?.trend, selectedCategory]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur border border-gray-100 p-3 rounded-xl shadow-xl">
          <p className="text-sm text-gray-500 mb-1">{format(new Date(label), 'MMM dd, yyyy')}</p>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-8">
      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sales Analytics</h1>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto">
                {['today', 'week', 'month', 'custom'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRangeType(mode)}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                      rangeType === mode
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {mode === 'today' ? 'Day' : mode}
                  </button>
                ))}
              </div>

              {rangeType === 'custom' ? (
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full sm:w-auto justify-between text-sm">
                  <input 
                    type="date" 
                    value={customFrom} 
                    onChange={e => setCustomFrom(e.target.value)} 
                    className="outline-none bg-transparent px-2 py-1 font-medium text-slate-700 cursor-pointer" 
                  />
                  <span className="text-slate-400 font-medium">-</span>
                  <input 
                    type="date" 
                    value={customTo} 
                    onChange={e => setCustomTo(e.target.value)} 
                    className="outline-none bg-transparent px-2 py-1 font-medium text-slate-700 cursor-pointer" 
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full sm:w-auto justify-between">
                  <button onClick={handlePrevious} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-bold text-slate-700 min-w-[150px] text-center">
                    {label}
                  </span>
                  <button onClick={handleNext} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* KPI Cards */}
        <div className="flex">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group min-w-[240px]">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50"></div>
            <div className="flex justify-between items-center relative z-10">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Revenue</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
                  {isLoading ? '...' : formatCurrency(data?.summary?.totalSales || 0)}
                </h3>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-4 flex items-center justify-between border-b border-gray-50">
                 <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-gray-400" />
                    <span>Revenue Trend</span>
                 </h2>
                 <div className="flex items-center gap-3">
                    {data?.byCategory?.length > 0 && (
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-xs border-gray-200 rounded-md py-1 pl-2 pr-6 text-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 outline-none"
                      >
                        <option value="All">All Categories</option>
                        {data.byCategory.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    )}
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
                <div className="h-72 w-full p-4 animate-in slide-in-from-top-2 duration-300">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  ) : displayTrend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={10} 
                          tickFormatter={(val) => {
                              const d = new Date(val);
                              if (chartTimeframe === 'month') return format(d, 'MMM yy');
                              return format(d, 'dd MMM');
                          }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis 
                          fontSize={10} 
                          tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                          axisLine={false}
                          tickLine={false}
                          dx={-10}
                        />
                        <Tooltip 
                          formatter={(val) => formatCurrency(val)}
                          labelFormatter={(label) => {
                              const d = new Date(label);
                              if (chartTimeframe === 'month') return format(d, 'MMMM yyyy');
                              return format(d, 'dd MMM yyyy');
                          }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center flex-col text-slate-400">
                      <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                      <p>No sales data for this period</p>
                    </div>
                  )}
                </div>
             )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Sales by Category</h3>
            {isLoading ? (
              <div className="h-72 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : data?.byCategory?.length > 0 ? (
              <div className="space-y-5">
                {data.byCategory.map((cat, index) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(cat.revenue)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.max(2, (cat.revenue / data.summary.totalSales) * 100)}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400">
                <p>No category data</p>
              </div>
            )}
          </div>

        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-800">Top Performing Products</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-100">
                <tr className="text-slate-500">
                  <th className="px-6 py-4 font-semibold">Product Name</th>
                  <th className="px-6 py-4 font-semibold text-right">Units Sold</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-slate-400">Loading top products...</td>
                  </tr>
                ) : data?.topProducts?.length > 0 ? (
                  data.topProducts.map((product, idx) => (
                    <tr key={product.name} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-600' : 
                            idx === 1 ? 'bg-slate-100 text-slate-600' : 
                            idx === 2 ? 'bg-orange-100 text-orange-600' : 
                            'text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">
                        {product.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-slate-400">No products sold in this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
