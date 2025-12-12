
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { format, startOfWeek, endOfWeek, isSameWeek, parseISO } from 'date-fns';

const ExpensesBook = () => {
    // Basic filter state
    const [filterCategory, setFilterCategory] = useState('');
    
    const { data: categories } = useQuery({
        queryKey: ['expenseCategories'],
        queryFn: async () => {
            return await api.get('/expenses/categories');
        }
    });

    const { data: expenses, isLoading } = useQuery({
        queryKey: ['expenses', filterCategory],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterCategory) params.append('categoryId', filterCategory);
            return await api.get(`/expenses?${params.toString()}`);
        }
    });

    // Helper to group by week
    const groupedExpenses = React.useMemo(() => {
        if (!expenses) return {};
        
        // Sort desc first
        const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        const groups = {};
        sorted.forEach(expense => {
            const date = parseISO(expense.date);
            const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
            const key = format(weekStart, 'yyyy-MM-dd');
            if (!groups[key]) groups[key] = [];
            groups[key].push(expense);
        });
        return groups;
    }, [expenses]);

    if (isLoading) return <div className="p-4">Loading expenses...</div>;

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

            {/* Filters */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
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

            {/* List */}
            <div className="space-y-8">
                {Object.keys(groupedExpenses).map(weekStart => {
                    const weekExpenses = groupedExpenses[weekStart];
                    const weekTotal = weekExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
                    const weekEndDate = endOfWeek(parseISO(weekStart), { weekStartsOn: 1 });

                    return (
                        <div key={weekStart} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Week of</span>
                                    <div className="text-sm font-medium text-gray-900">
                                        {format(parseISO(weekStart), 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
                                    <div className="text-sm font-bold text-gray-900">₹{weekTotal.toFixed(2)}</div>
                                </div>
                            </div>
                            
                            <div className="divide-y divide-gray-100">
                                {weekExpenses.map(expense => (
                                    <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <div className="font-medium text-gray-900">{expense.recipient?.name || expense.labourer?.name || expense.payee || 'Unknown Payee'}</div>
                                                <div className="text-xs text-gray-500">{expense.category?.name} • {format(parseISO(expense.date), 'EEE, MMM d')}</div>
                                            </div>
                                            <div className="font-semibold text-gray-900">
                                                -₹{parseFloat(expense.amount).toFixed(2)}
                                            </div>
                                        </div>
                                        {expense.description && (
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{expense.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {expenses?.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg dashed border-2 border-gray-200">
                        No expenses found for this selection.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpensesBook;
