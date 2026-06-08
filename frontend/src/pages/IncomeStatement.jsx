  import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { 
    format, 
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addDays, 
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calculator } from 'lucide-react';

export default function IncomeStatement() {
  const [viewMode, setViewMode] = useState('month'); // Default to month for P&L
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [customRange, setCustomRange] = useState({
      from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const dateRange = useMemo(() => {
      const anchor = selectedDate;
      switch(viewMode) {
          case 'day':
              return {
                  from: format(anchor, 'yyyy-MM-dd'),
                  to: format(anchor, 'yyyy-MM-dd'),
                  label: format(anchor, 'EEEE, MMM d, yyyy')
              };
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
                  from: customRange.from,
                  to: customRange.to,
                  label: `${format(new Date(customRange.from), 'MMM d')} - ${format(new Date(customRange.to), 'MMM d, yyyy')}`
              };
          default:
              return { from: format(anchor, 'yyyy-MM-dd'), to: format(anchor, 'yyyy-MM-dd'), label: '' };
      }
  }, [viewMode, selectedDate, customRange]);

  const handlePrevious = () => {
      switch(viewMode) {
          case 'day': setSelectedDate(d => subDays(d, 1)); break;
          case 'week': setSelectedDate(d => subWeeks(d, 1)); break;
          case 'month': setSelectedDate(d => subMonths(d, 1)); break;
          default: break;
      }
  };

  const handleNext = () => {
      switch(viewMode) {
          case 'day': setSelectedDate(d => addDays(d, 1)); break;
          case 'week': setSelectedDate(d => addWeeks(d, 1)); break;
          case 'month': setSelectedDate(d => addMonths(d, 1)); break;
          default: break;
      }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['income-statement', dateRange.from, dateRange.to],
    queryFn: () => api.get(`/ledger/income-statement?startDate=${dateRange.from}&endDate=${dateRange.to}`),
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" />
            Income Statement
        </h1>
        
        <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            {['day', 'week', 'month', 'custom'].map((mode) => (
                <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all whitespace-nowrap flex-1 md:flex-none ${
                        viewMode === mode 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {mode}
                </button>
            ))}
        </div>
      </div>

      {viewMode === 'custom' && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex items-center gap-4">
              <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <input 
                      type="date" 
                      value={customRange.from}
                      onChange={e => setCustomRange(prev => ({...prev, from: e.target.value}))}
                      className="w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
              <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <input 
                      type="date" 
                      value={customRange.to}
                      onChange={e => setCustomRange(prev => ({...prev, to: e.target.value}))}
                      className="w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
          </div>
      )}

      {/* Header with Integrated Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  {viewMode !== 'custom' && (
                      <button 
                           onClick={handlePrevious}
                           className="p-1.5 hover:bg-white hover:shadow-sm rounded-full bg-gray-200 text-gray-600 transition-all"
                      >
                          <ChevronLeft className="w-5 h-5" />
                      </button>
                  )}
                  
                  <div className="min-w-[120px] text-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Period</span>
                      <div className="text-sm md:text-base font-bold text-gray-900 leading-tight whitespace-nowrap">
                          {dateRange.label}
                      </div>
                  </div>

                  {viewMode !== 'custom' && (
                      <button 
                           onClick={handleNext}
                           className="p-1.5 hover:bg-white hover:shadow-sm rounded-full bg-gray-200 text-gray-600 transition-all"
                      >
                          <ChevronRight className="w-5 h-5" />
                      </button>
                  )}
              </div>
          </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Calculating Income Statement...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-12">Failed to load Income Statement</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-200 text-center">
            <h2 className="text-xl font-bold text-gray-800">Zenkar Platform</h2>
            <h3 className="text-lg font-semibold text-gray-600">Income Statement</h3>
            <p className="text-sm text-gray-500">For the period {format(new Date(dateRange.from), 'dd MMM yyyy')} to {format(new Date(dateRange.to), 'dd MMM yyyy')}</p>
          </div>

          <div className="p-8">
            {/* Revenue Section */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 border-b-2 border-green-200 pb-2 mb-4">Revenue</h4>
              {data.revenue.items.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No revenue recorded in this period.</p>
              ) : (
                <div className="space-y-2 pl-4">
                  {data.revenue.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 font-bold text-green-700">
                <span>Total Revenue</span>
                <span>{formatCurrency(data.revenue.total)}</span>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 border-b-2 border-red-200 pb-2 mb-4">Expenses</h4>
              {data.expenses.items.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No expenses recorded in this period.</p>
              ) : (
                <div className="space-y-2 pl-4">
                  {data.expenses.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(item.balance)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 font-bold text-red-700">
                <span>Total Expenses</span>
                <span>{formatCurrency(data.expenses.total)}</span>
              </div>
            </div>

            {/* Net Income Summary */}
            <div className={`mt-10 p-6 rounded-lg flex justify-between items-center ${data.netIncome >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div>
                <span className={`text-xl font-bold ${data.netIncome >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  Net {data.netIncome >= 0 ? 'Income' : 'Loss'}
                </span>
                <p className={`text-sm ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  (Total Revenue - Total Expenses)
                </p>
              </div>
              <span className={`text-3xl font-black ${data.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(data.netIncome)}
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
