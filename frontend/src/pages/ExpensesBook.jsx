import React, { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { 
    format, 
    parseISO, 
    addDays, 
    subDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    isSameDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const ExpensesBook = () => {
    // View State
    const [viewMode, setViewMode] = useState('day'); // Default to day as requested
    const [selectedDate, setSelectedDate] = useState(new Date()); // Anchor date for generic navigation
    const [customRange, setCustomRange] = useState({
        from: format(new Date(), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd')
    });

    // Basic filter state
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [localSearch, setLocalSearch] = useState('');

    // Debounce Search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(localSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch]);
    
    // Calculate Date Range based on View Mode
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
                const start = startOfWeek(anchor, { weekStartsOn: 1 }); // Monday start
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

    // Navigation Handlers
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

    const { data: categories } = useQuery({
        queryKey: ['expenseCategories'],
        queryFn: async () => await api.get('/expenses/categories')
    });

    const { data: expenses, isLoading, isFetching } = useQuery({
        queryKey: ['expenses', filterCategory, searchTerm, viewMode, dateRange.from, dateRange.to],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterCategory) params.append('categoryId', filterCategory);
            if (searchTerm) params.append('search', searchTerm);
            
            // Send date range
            params.append('from', dateRange.from);
            params.append('to', dateRange.to);
            
            return await api.get(`/expenses?${params.toString()}`);
        },
        placeholderData: keepPreviousData
    });

    // Sort expenses
    const sortedExpenses = React.useMemo(() => {
        if (!expenses) return [];
        return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.updatedAt) - new Date(a.updatedAt));
    }, [expenses]);

    const totalAmount = sortedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Group expenses by date if not in Day view
    const groupedExpenses = React.useMemo(() => {
        if (viewMode === 'day') return { 'Today': sortedExpenses };
        
        return sortedExpenses.reduce((groups, expense) => {
            const dateStr = format(new Date(expense.date), 'yyyy-MM-dd');
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(expense);
            return groups;
        }, {});
    }, [sortedExpenses, viewMode]);

    return (
        <div className="p-4 max-w-4xl mx-auto pb-20 md:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
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

                <div className="flex gap-2 w-full md:w-auto">
                    <Link 
                        to="/expenses/manage" 
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex-1 md:flex-none text-center"
                    >
                        Manage Categories
                    </Link>
                    <Link 
                        to="/expenses/new" 
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm flex-1 md:flex-none text-center"
                    >
                        + Add Expense
                    </Link>
                </div>
            </div>

            {viewMode === 'custom' && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
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

            {/* Search & Filters */}
            <div className="mb-6 space-y-4">
               <div className="relative">
                   <input 
                      type="text" 
                      placeholder="Search expenses..." 
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                   />
                   {isFetching && (
                       <div className="absolute right-3 top-1/2 -translate-y-1/2">
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                       </div>
                   )}
               </div>

               <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setFilterCategory('')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        filterCategory === '' 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    All
                </button>
                {categories?.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilterCategory(cat.id.toString())}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            filterCategory === cat.id.toString()
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Integrated Navigation */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        {viewMode !== 'custom' && (
                            <button 
                                 onClick={handlePrevious}
                                 className="p-1.5 hover:bg-white hover:shadow-sm rounded-full bg-gray-200 text-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                                 title="Previous"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        
                        <div className="min-w-[120px]">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Period</span>
                            <div className="text-sm md:text-base font-bold text-gray-900 leading-tight whitespace-nowrap">
                                {dateRange.label}
                            </div>
                        </div>

                        {viewMode !== 'custom' && (
                            <button 
                                 onClick={handleNext}
                                 className="p-1.5 hover:bg-white hover:shadow-sm rounded-full bg-gray-200 text-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                                 title="Next"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total</span>
                        <div className="text-lg font-bold text-gray-900 leading-tight">₹{totalAmount.toFixed(2)}</div>
                    </div>
                </div>
                
                {isLoading && !expenses ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-400 font-medium">Loading expenses...</p>
                    </div>
                ) : sortedExpenses.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                           <CalendarIcon className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No expenses found</p>
                        <p className="text-xs text-gray-400 mt-1">Try changing the date range or filters</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {viewMode === 'day' ? (
                            // Flat list for Day view
                            sortedExpenses.map(expense => (
                                <ExpenseItem key={expense.id} expense={expense} showDate={false} />
                            ))
                        ) : (
                            // Grouped list for other views
                            Object.keys(groupedExpenses).sort((a,b) => new Date(b) - new Date(a)).map(dateStr => (
                                <div key={dateStr}>
                                    <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-[60px] md:top-[68px]">
                                        {format(parseISO(dateStr), 'EEEE, MMM d')}
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {groupedExpenses[dateStr].map(expense => (
                                            <ExpenseItem key={expense.id} expense={expense} showDate={false} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Extracted Component for cleaner render
const ExpenseItem = ({ expense, showDate }) => (
    <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-start mb-1">
            <div className="min-w-0 flex-1 pr-4">
                <div className="font-medium text-gray-900 truncate">
                    {expense.recipient?.name || expense.labourer?.name || 'Unknown Payee'}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-2 items-center">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{expense.category?.name}</span>
                    <span className="text-gray-300">•</span>
                    {showDate && (
                        <>
                            <span>{format(parseISO(expense.date), 'MMM d')}</span>
                            <span className="text-gray-300">•</span>
                        </>
                    )}
                    <span>{format(parseISO(expense.updatedAt), 'h:mm a')}</span>
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <div className="font-bold text-gray-900">
                    -₹{parseFloat(expense.amount).toFixed(2)}
                </div>
                <Link 
                    to={`/expenses/${expense.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold inline-block mt-1 px-2 py-0.5 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors uppercase tracking-wide"
                >
                    Edit
                </Link>
            </div>
        </div>
        {expense.description && (
            <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                {expense.description}
            </p>
        )}
    </div>
);

export default ExpensesBook;
