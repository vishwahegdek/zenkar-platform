
import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { format, parseISO, addDays, subDays } from 'date-fns';

const ExpensesBook = () => {
    // Basic filter state
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [localSearch, setLocalSearch] = useState(''); // Local state for input
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Debounce Search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(localSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch]);
    
    const { data: categories } = useQuery({
        queryKey: ['expenseCategories'],
        queryFn: async () => {
            return await api.get('/expenses/categories');
        }
    });

    const { data: expenses, isLoading, isFetching } = useQuery({
        queryKey: ['expenses', filterCategory, searchTerm, format(selectedDate, 'yyyy-MM-dd')],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterCategory) params.append('categoryId', filterCategory);
            if (searchTerm) params.append('search', searchTerm);
            // Always filter by selected Date
            params.append('date', format(selectedDate, 'yyyy-MM-dd'));
            
            return await api.get(`/expenses?${params.toString()}`);
        },
        placeholderData: keepPreviousData // Correct v5 syntax
    });

    // Helper to group by DAY (Simplified for Single Day view, mostly for sorting)
    const sortedExpenses = React.useMemo(() => {
        if (!expenses) return [];
        return [...expenses].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }, [expenses]);

    const dayTotal = sortedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Label Logic
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
    const isYesterday = format(new Date(Date.now() - 864e5), 'yyyy-MM-dd') === dateKey;
    let dateLabel = format(selectedDate, 'EEEE, MMM d, yyyy');
    if (isToday) dateLabel = 'Today';
    if (isYesterday) dateLabel = 'Yesterday';

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Expense Book</h1>
                <div className="flex gap-2">
                    <Link 
                        to="/expenses/manage" 
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
                    >
                        Manage Categories
                    </Link>
                    <Link 
                        to="/expenses/new" 
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                    >
                        + Add Expense
                    </Link>
                </div>
            </div>

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

               <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilterCategory('')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
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
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
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

            {/* Main Daily Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Integrated Navigation */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button 
                             onClick={() => setSelectedDate(d => subDays(d, 1))}
                             className="p-1.5 hover:bg-white hover:shadow-sm rounded-full bg-gray-200 text-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                             title="Previous Day"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        
                        <div className="text-center min-w-[120px]">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">{isToday || isYesterday ? format(selectedDate, 'EEE, MMM d') : 'Date'}</span>
                            <div className="text-base font-bold text-gray-900 leading-tight">
                                {dateLabel}
                            </div>
                        </div>

                        <button 
                             onClick={() => setSelectedDate(d => addDays(d, 1))}
                             className="p-1.5 hover:bg-white hover:shadow-sm rounded-full bg-gray-200 text-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                             title="Next Day"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total</span>
                        <div className="text-lg font-bold text-gray-900 leading-tight">₹{dayTotal.toFixed(2)}</div>
                    </div>
                </div>
                
                {isLoading && !expenses ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : sortedExpenses.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 text-sm">No expenses found for this date.</p>
                        {searchTerm && <p className="text-xs text-gray-400 mt-1">Try clearing filters.</p>}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {sortedExpenses.map(expense => (
                        <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <div className="font-medium text-gray-900">{expense.recipient?.name || expense.labourer?.name || expense.payee || 'Unknown Payee'}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {expense.category?.name} • <span className="text-gray-400 font-medium">{format(parseISO(expense.updatedAt), 'h:mm a')}</span>
                                    </div>
                                </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">
                                    -₹{parseFloat(expense.amount).toFixed(2)}
                                </div>
                                <Link 
                                    to={`/expenses/${expense.id}/edit`}
                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold inline-block mt-1 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                                >
                                    EDIT
                                </Link>
                            </div>
                        </div>
                        {expense.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1 bg-gray-50 p-1.5 rounded text-xs border border-gray-100 inline-block">{expense.description}</p>
                        )}
                        </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpensesBook;
