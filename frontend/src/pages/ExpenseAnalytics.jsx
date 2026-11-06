import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
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
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear
} from 'date-fns';
import { 
  TrendingDown, 
  TrendingUp, 
  Receipt, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  CreditCard, 
  Building2, 
  Smartphone, 
  BarChart2, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Tag, 
  Users, 
  Plus, 
  Filter, 
  Layers, 
  AlertCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const PALETTE = [
  '#F43F5E', // Rose
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export default function ExpenseAnalytics() {
  const [rangeType, setRangeType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [chartTimeframe, setChartTimeframe] = useState('day');
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [activePieIndex, setActivePieIndex] = useState(null);

  // Compute from, to, and label for date range
  const { from, to, label } = useMemo(() => {
    const anchor = selectedDate;
    switch (rangeType) {
      case 'today': {
        const day = format(anchor, 'yyyy-MM-dd');
        return { from: day, to: day, label: format(anchor, 'EEEE, MMM d, yyyy') };
      }
      case 'week': {
        const start = startOfWeek(anchor, { weekStartsOn: 1 });
        const end = endOfWeek(anchor, { weekStartsOn: 1 });
        return { 
          from: format(start, 'yyyy-MM-dd'), 
          to: format(end, 'yyyy-MM-dd'),
          label: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
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
      case 'quarter': {
        const start = startOfQuarter(anchor);
        const end = endOfQuarter(anchor);
        return {
          from: format(start, 'yyyy-MM-dd'),
          to: format(end, 'yyyy-MM-dd'),
          label: `Q${Math.floor(anchor.getMonth() / 3) + 1} ${format(anchor, 'yyyy')}`
        };
      }
      case 'custom':
        return {
          from: customFrom,
          to: customTo,
          label: `${format(new Date(customFrom), 'MMM d, yyyy')} – ${format(new Date(customTo), 'MMM d, yyyy')}`
        };
      default:
        return { from: format(anchor, 'yyyy-MM-dd'), to: format(anchor, 'yyyy-MM-dd'), label: '' };
    }
  }, [rangeType, selectedDate, customFrom, customTo]);

  const handlePrevious = () => {
    switch (rangeType) {
      case 'today': setSelectedDate(d => subDays(d, 1)); break;
      case 'week': setSelectedDate(d => subWeeks(d, 1)); break;
      case 'month': setSelectedDate(d => subMonths(d, 1)); break;
      case 'quarter': setSelectedDate(d => subMonths(d, 3)); break;
      default: break;
    }
  };

  const handleNext = () => {
    switch (rangeType) {
      case 'today': setSelectedDate(d => addDays(d, 1)); break;
      case 'week': setSelectedDate(d => addWeeks(d, 1)); break;
      case 'month': setSelectedDate(d => addMonths(d, 1)); break;
      case 'quarter': setSelectedDate(d => addMonths(d, 3)); break;
      default: break;
    }
  };

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: () => api.get('/expenses/categories'),
  });

  const selectedCategoryId = useMemo(() => {
    if (selectedCategory === 'All') return undefined;
    const cat = categories.find(c => c.name === selectedCategory);
    return cat ? cat.id : undefined;
  }, [selectedCategory, categories]);

  const { data, isLoading } = useQuery({
    queryKey: ['expenseAnalytics', from, to, chartTimeframe, selectedCategoryId, selectedMethod],
    queryFn: () => {
      const params = new URLSearchParams({
        from,
        to,
        timeframe: chartTimeframe,
      });
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId.toString());
      if (selectedMethod && selectedMethod !== 'All') params.append('paymentMethod', selectedMethod);
      return api.get(`/expenses/analytics?${params.toString()}`);
    },
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const summary = data?.summary || {
    totalExpenses: 0,
    totalTransactions: 0,
    averageExpense: 0,
    prevPeriodTotal: 0,
    percentageChange: null,
    dailyAverage: 0,
    daysCount: 1,
    topCategory: null,
    topRecipient: null,
  };

  const trendData = useMemo(() => {
    if (!data?.trend) return [];
    return data.trend;
  }, [data?.trend]);

  const categoryBreakdown = useMemo(() => {
    if (!data?.byCategory) return [];
    return data.byCategory;
  }, [data?.byCategory]);

  const paymentBreakdown = useMemo(() => {
    if (!data?.byPaymentMethod) return [];
    return data.byPaymentMethod;
  }, [data?.byPaymentMethod]);

  const topRecipients = useMemo(() => {
    if (!data?.topRecipients) return [];
    return data.topRecipients;
  }, [data?.topRecipients]);

  const highValueExpenses = useMemo(() => {
    if (!data?.highValueExpenses) return [];
    return data.highValueExpenses;
  }, [data?.highValueExpenses]);

  // Payment method icon and label helper
  const getMethodMeta = (method) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return { label: 'Cash', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
      case 'BANK_TRANSFER':
      case 'BANK':
        return { label: 'Bank Transfer', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' };
      case 'UPI':
      case 'ONLINE':
        return { label: 'UPI / Online', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' };
      case 'CHEQUE':
        return { label: 'Cheque', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' };
      default:
        return { label: method || 'Other', icon: Receipt, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' };
    }
  };

  // Custom chart tooltip
  const CustomChartTooltip = ({ active, payload, label: tooltipLabel }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs max-w-xs">
          <p className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between gap-4">
            <span>{tooltipLabel}</span>
            <span className="text-slate-400 font-normal">{item.count} transaction{item.count === 1 ? '' : 's'}</span>
          </p>
          <p className="text-lg font-black text-rose-400 mb-2">
            {formatCurrency(item.amount)}
          </p>
          {item.categories && Object.keys(item.categories).length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-slate-800">
              {Object.entries(item.categories).slice(0, 4).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between items-center text-[11px] text-slate-300">
                  <span className="truncate max-w-[120px]">{cat}</span>
                  <span className="font-semibold text-white ml-2">{formatCurrency(amt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 md:pb-12">
      {/* Sticky Top Header */}
      <div className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col gap-3">
            {/* Top row: Title, quick actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/25 shrink-0">
                  <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                    Expense Analytics
                  </h1>
                  <p className="text-xs text-slate-500 hidden sm:block">
                    Financial outflow insights, cost drivers & category analytics
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/expenses"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors bg-white shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Expense</span> Book
                </Link>
                <Link
                  to="/expenses/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-semibold hover:from-rose-700 hover:to-pink-700 transition-all shadow-sm shadow-rose-600/30"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Expense</span>
                </Link>
              </div>
            </div>

            {/* Bottom row: Time range pills & date stepper */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 sm:border-0 sm:pt-0">
              {/* Range Presets (Horizontal Scrollable on Mobile) */}
              <div className="flex bg-slate-100/90 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                {[
                  { id: 'today', label: 'Day' },
                  { id: 'week', label: 'Week' },
                  { id: 'month', label: 'Month' },
                  { id: 'quarter', label: 'Quarter' },
                  { id: 'custom', label: 'Custom' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setRangeType(item.id)}
                    className={`px-3 sm:px-4 py-1 text-xs font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${
                      rangeType === item.id
                        ? 'bg-white text-rose-600 shadow-xs ring-1 ring-slate-900/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Date Stepper / Custom Inputs */}
              {rangeType === 'custom' ? (
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1 border border-slate-200 shadow-xs text-xs w-full sm:w-auto">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="outline-none bg-transparent font-medium text-slate-700 cursor-pointer text-xs"
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="outline-none bg-transparent font-medium text-slate-700 cursor-pointer text-xs"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between sm:justify-end gap-1.5 bg-white rounded-xl p-1 border border-slate-200 shadow-xs w-full sm:w-auto">
                  <button
                    onClick={handlePrevious}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    aria-label="Previous period"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 px-2 text-center min-w-[130px] sm:min-w-[150px] truncate">
                    {label}
                  </span>
                  <button
                    onClick={handleNext}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    aria-label="Next period"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* Dynamic Category & Payment Method Filter Chips */}
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <Filter className="w-3.5 h-3.5 text-rose-500" />
            <span>Category Filter</span>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="ml-auto text-[11px] font-semibold text-rose-600 hover:underline capitalize"
              >
                Reset Filter
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards Row (Mobile First 2 cols, Desktop 4 cols) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Outflow */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-60 pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Outflow
              </span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? '...' : formatCurrency(summary.totalExpenses)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              {summary.percentageChange !== null ? (
                <span
                  className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
                    summary.percentageChange > 0
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {summary.percentageChange > 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5 stroke-[2.5]" />
                  )}
                  {Math.abs(summary.percentageChange).toFixed(1)}%
                </span>
              ) : (
                <span className="text-slate-400">First recorded period</span>
              )}
              <span className="text-slate-400 truncate">vs prev {rangeType}</span>
            </div>
          </div>

          {/* Card 2: Daily Run Rate */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-60 pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Daily Avg Spend
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? '...' : formatCurrency(summary.dailyAverage)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Across <span className="font-semibold text-slate-700">{summary.daysCount}</span> day{summary.daysCount === 1 ? '' : 's'} in range
            </div>
          </div>

          {/* Card 3: Transaction Volume & Avg Ticket */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-60 pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Transactions
              </span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? '...' : summary.totalTransactions}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Avg <span className="font-bold text-purple-700">{formatCurrency(summary.averageExpense)}</span> / bill
            </div>
          </div>

          {/* Card 4: Top Category Outflow */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-60 pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Top Category
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {isLoading ? '...' : summary.topCategory ? summary.topCategory.name : 'None'}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 truncate">
              {summary.topCategory ? (
                <>
                  <span className="font-bold text-blue-700">{formatCurrency(summary.topCategory.amount)}</span>
                  {' '}({summary.topCategory.percentage.toFixed(0)}% of spend)
                </>
              ) : (
                'No expenses recorded'
              )}
            </div>
          </div>
        </div>

        {/* Charts Section: 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trend Chart (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-rose-500" />
                  <span>Outflow Trend</span>
                  {selectedCategory !== 'All' && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full">
                      {selectedCategory}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Timeline of expenses over the selected interval</p>
              </div>

              {/* Chart Controls: Timeframe & Chart Type Toggle */}
              <div className="flex items-center gap-2">
                {/* Timeframe granularity */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                  {['day', 'week', 'month'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setChartTimeframe(tf)}
                      className={`px-2.5 py-1 text-[11px] uppercase rounded-md transition-all ${
                        chartTimeframe === tf
                          ? 'bg-white text-rose-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Area vs Bar Toggle */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setChartType('area')}
                    className={`p-1 rounded-md transition-all ${
                      chartType === 'area' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Area Chart"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`p-1 rounded-md transition-all ${
                      chartType === 'bar' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Bar Chart"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="p-4 sm:p-5 flex-1 min-h-[300px]">
              {isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                </div>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'area' ? (
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="date"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="#94A3B8"
                        dy={6}
                        tickFormatter={(val) => {
                          try {
                            const d = new Date(val);
                            if (chartTimeframe === 'month') return format(d, 'MMM yy');
                            return format(d, 'd MMM');
                          } catch (e) {
                            return val;
                          }
                        }}
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="#94A3B8"
                        tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        name="Outflow"
                        stroke="#F43F5E"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#expenseGradient)"
                        activeDot={{ r: 6, fill: '#E11D48', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="date"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="#94A3B8"
                        dy={6}
                        tickFormatter={(val) => {
                          try {
                            const d = new Date(val);
                            if (chartTimeframe === 'month') return format(d, 'MMM yy');
                            return format(d, 'd MMM');
                          } catch (e) {
                            return val;
                          }
                        }}
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="#94A3B8"
                        tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="amount" name="Outflow" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Receipt className="w-12 h-12 stroke-[1.5] opacity-20" />
                  <p className="text-sm font-medium">No expenses in this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Category Distribution (1 Col Donut + Ranked List) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 flex flex-col">
            <div className="border-b border-slate-50 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-rose-500" />
                  <span>Category Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">Proportional budget allocation</p>
              </div>
            </div>

            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
              </div>
            ) : categoryBreakdown.length > 0 ? (
              <div className="flex flex-col gap-4">
                {/* Donut Chart */}
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(null)}
                      >
                        {categoryBreakdown.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PALETTE[index % PALETTE.length]}
                            className="transition-opacity duration-200 cursor-pointer"
                            opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.6}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => formatCurrency(val)}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '12px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                    <span className="text-sm font-black text-slate-800">
                      {formatCurrency(summary.totalExpenses)}
                    </span>
                  </div>
                </div>

                {/* Ranked Progress Bars List */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {categoryBreakdown.map((cat, idx) => (
                    <div
                      key={cat.id || cat.name}
                      onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'All' : cat.name)}
                      className="cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-center text-xs mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                          />
                          <span className="font-semibold text-slate-800 truncate">{cat.name}</span>
                          <span className="text-[10px] text-slate-400">({cat.count})</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-slate-900">{formatCurrency(cat.amount)}</span>
                          <span className="text-[10px] font-bold text-slate-500 w-9 text-right">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(3, cat.percentage)}%`,
                            backgroundColor: PALETTE[idx % PALETTE.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Tag className="w-8 h-8 mb-2 opacity-20" />
                <p>No category breakdown available</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5">
          <div className="border-b border-slate-50 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Payment Channels & Methods</span>
              </h3>
              <p className="text-xs text-slate-400">How funds were disbursed</p>
            </div>
            {selectedMethod !== 'All' && (
              <button
                onClick={() => setSelectedMethod('All')}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Reset Method
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentBreakdown.length > 0 ? (
              paymentBreakdown.map((pm) => {
                const meta = getMethodMeta(pm.method);
                const IconComponent = meta.icon;
                const isSelected = selectedMethod === pm.method;
                return (
                  <div
                    key={pm.method}
                    onClick={() => setSelectedMethod(isSelected ? 'All' : pm.method)}
                    className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                        : `${meta.bg} hover:shadow-xs`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg bg-white shadow-2xs ${meta.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{pm.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {formatCurrency(pm.amount)}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5 flex justify-between">
                      <span>{meta.label}</span>
                      <span className="text-slate-400">{pm.count} tx</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                No payment method distribution for this period
              </div>
            )}
          </div>
        </div>

        {/* Two Columns: Top Recipients (Payees) and High-Value Outliers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Payees / Recipients */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Top Payees & Recipients</span>
                </h3>
                <p className="text-xs text-slate-400">Parties receiving highest disbursements</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex-1">
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-7 h-7 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                </div>
              ) : topRecipients.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {topRecipients.map((rec, idx) => (
                    <div key={rec.name} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-700'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                            {rec.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {rec.count} payment{rec.count === 1 ? '' : 's'} · Latest: {rec.latestDate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {formatCurrency(rec.amount)}
                        </div>
                        <div className="text-[10px] font-semibold text-purple-600">
                          {rec.percentage.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No recipient data found
                </div>
              )}
            </div>
          </div>

          {/* High-Value Transactions (Outlier Audit) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Significant Outliers (Top Bills)</span>
                </h3>
                <p className="text-xs text-slate-400">Largest single expenditures in this range</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex-1">
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-7 h-7 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                </div>
              ) : highValueExpenses.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {highValueExpenses.map((exp) => (
                    <Link
                      key={exp.id}
                      to={`/expenses/${exp.id}/edit`}
                      className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate group-hover:text-rose-600 transition-colors">
                            {exp.recipientName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 truncate">
                            {exp.categoryName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {exp.description || 'No description recorded'} · {format(new Date(exp.date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div className="text-xs sm:text-sm font-black text-slate-900">
                          {formatCurrency(exp.amount)}
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No expenses recorded in this period
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
