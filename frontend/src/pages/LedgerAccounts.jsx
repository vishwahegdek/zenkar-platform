import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { BookOpen, Search, Plus, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function CreateAccountModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: 'ASSET',
    subType: 'CUSTOM'
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/ledger/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['balanceSheet']);
      queryClient.invalidateQueries(['ledgerAccounts']);
      toast.success('Account created successfully');
      onClose();
      setFormData({ name: '', type: 'ASSET', subType: 'CUSTOM' });
    },
    onError: (err) => {
      toast.error('Failed to create account: ' + (err.response?.data?.message || err.message));
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. HDFC Bank, Loan Account..."
              className="w-full border-gray-300 rounded-lg p-2 focus:ring-blue-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select 
              className="w-full border-gray-300 rounded-lg p-2 focus:ring-blue-500"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="ASSET">Asset (Bank, Cash, Property)</option>
              <option value="LIABILITY">Liability (Loans, Debts)</option>
              <option value="EQUITY">Equity (Capital)</option>
              <option value="REVENUE">Revenue (Income)</option>
              <option value="EXPENSE">Expense (Costs)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Type (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. BANK_ACCOUNT, CREDIT_CARD"
              className="w-full border-gray-300 rounded-lg p-2 focus:ring-blue-500 uppercase"
              value={formData.subType}
              onChange={e => setFormData({...formData, subType: e.target.value.toUpperCase()})}
            />
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LedgerAccounts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({
    'ASSET': true,
    'LIABILITY': true,
    'EQUITY': true,
    'REVENUE': true,
    'EXPENSE': true
  });

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['ledgerAccounts'],
    queryFn: () => api.get('/ledger/accounts'),
  });

  const allAccounts = accountsData?.data || accountsData || [];

  const filteredAccounts = useMemo(() => {
    return allAccounts.filter(acc => 
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      acc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.subType && acc.subType.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allAccounts, searchTerm]);

  // Group accounts by type for better organization
  const groupedAccounts = useMemo(() => {
    return filteredAccounts.reduce((acc, account) => {
      if (!acc[account.type]) {
        acc[account.type] = [];
      }
      acc[account.type].push(account);
      return acc;
    }, {});
  }, [filteredAccounts]);

  const toggleGroup = (type) => {
    setCollapsedGroups(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const typeColors = {
    'ASSET': 'bg-blue-50 text-blue-700 ring-blue-600/20',
    'LIABILITY': 'bg-red-50 text-red-700 ring-red-600/20',
    'EQUITY': 'bg-purple-50 text-purple-700 ring-purple-600/20',
    'REVENUE': 'bg-green-50 text-green-700 ring-green-600/20',
    'EXPENSE': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Chart of Accounts
            </h1>
            
            <div className="flex items-center gap-3">
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Create Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-gray-100">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400 font-medium">Loading accounts...</p>
          </div>
        ) : Object.keys(groupedAccounts).length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 font-medium">No accounts found matching your search.</p>
          </div>
        ) : (
          Object.entries(groupedAccounts).map(([type, accs]) => {
            const isCollapsed = collapsedGroups[type];
            return (
              <div key={type} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleGroup(type)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      {type} Accounts
                    </h2>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 ml-2">
                      {accs.length}
                    </span>
                  </div>
                </button>
                
                {!isCollapsed && (
                  <div className="divide-y divide-gray-50 border-t border-gray-50">
                    {accs.map((account) => (
                      <div key={account.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900">{account.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase ring-1 ring-inset ${typeColors[account.type] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                              {account.type}
                            </span>
                            {account.subType && (
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                {account.subType.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Link 
                            to={`/ledger?accountId=${account.id}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="View Ledger Statement"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <CreateAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
