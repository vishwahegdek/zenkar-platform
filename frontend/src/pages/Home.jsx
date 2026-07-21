import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { ShoppingCart, PlusCircle, Receipt, Wallet, Users, ArrowRight } from 'lucide-react';

const availableWidgets = {
  overall_balance: { id: 'overall_balance', title: 'Overall Balance', type: 'data' },
  quick_sale: { id: 'quick_sale', title: 'Quick Sale', type: 'action' },
  new_order: { id: 'new_order', title: 'New Order', type: 'action' },
  add_expense: { id: 'add_expense', title: 'Add Expense', type: 'action' },
  bank_balances: { id: 'bank_balances', title: 'Your Balance', type: 'data' },
  labour: { id: 'labour', title: 'Labour Dashboard', type: 'action' }
};

// Default widgets if user has no preferences set
const defaultWidgets = ['overall_balance', 'quick_sale', 'new_order', 'add_expense', 'bank_balances', 'labour'];

// --- WIDGET COMPONENTS ---

const ActionWidget = ({ title, icon: Icon, to, colorClass }) => (
  <Link to={to} className={`flex flex-col items-center justify-center p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-1 ${colorClass}`}>
    <div className="p-4 bg-white/30 rounded-full mb-3 backdrop-blur-sm">
      <Icon className="w-8 h-8" />
    </div>
    <span className="font-semibold text-lg">{title}</span>
  </Link>
);

const OverallBalanceWidget = () => {
  const { data: balanceSheet, isLoading } = useQuery({
    queryKey: ['balanceSheet'],
    queryFn: () => api.get('/ledger/balance-sheet')
  });

  if (isLoading) return <div className="p-6 bg-white rounded-2xl shadow-sm border animate-pulse h-40 col-span-full"></div>;

  const assets = balanceSheet?.assets?.items || [];
  const bankAccounts = assets.filter(a => a.subType?.toUpperCase() === 'BANK' || a.subType?.toUpperCase() === 'BANK_ACCOUNT');
  const cashAccounts = assets.filter(a => a.subType?.toUpperCase() === 'CASH' || (!a.subType && a.name.toLowerCase().includes('cash')));
  
  const totalBank = bankAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalCash = cashAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalOverall = totalBank + totalCash;

  return (
    <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center justify-between col-span-full text-white">
      <div className="mb-6 md:mb-0">
        <h3 className="font-medium text-blue-200 mb-1">Total Balance</h3>
        <div className="text-4xl font-bold">₹{totalOverall.toLocaleString('en-IN')}</div>
      </div>
      <div className="flex gap-8 md:gap-12">
        <div>
          <h4 className="text-xs text-blue-300 uppercase tracking-wider mb-1">Bank Accounts</h4>
          <div className="text-xl font-semibold">₹{totalBank.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <h4 className="text-xs text-blue-300 uppercase tracking-wider mb-1">Main Cashbook</h4>
          <div className="text-xl font-semibold">₹{totalCash.toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>
  );
};

const BankBalancesWidget = ({ settings }) => {
  const { data: balanceSheet, isLoading } = useQuery({
    queryKey: ['balanceSheet'],
    queryFn: () => api.get('/ledger/balance-sheet')
  });

  if (isLoading) return <div className="p-6 bg-white rounded-2xl shadow-sm border animate-pulse h-40"></div>;

  const allAccounts = [
    ...(balanceSheet?.assets?.items || []),
    ...(balanceSheet?.liabilities?.items || []),
  ];

  const quickAccessIds = settings?.paymentMethods?.quickAccessIds || [];
  const nicknames = settings?.paymentMethods?.nicknames || {};

  const displayAccounts = allAccounts.filter(a => 
    quickAccessIds.includes(a.id) && 
    a.subType?.toUpperCase() !== 'CASH'
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4 text-gray-800 border-b pb-4">
        <Wallet className="w-6 h-6 text-blue-600" />
        <h3 className="font-bold text-lg">Your Balance</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayAccounts.map(acc => (
          <div key={acc.id} className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
            <div className="font-medium text-gray-900 mb-1 line-clamp-1" title={nicknames[acc.id] || acc.name}>
              {nicknames[acc.id] || acc.name}
            </div>
            <div className="font-bold text-gray-900 text-xl">
              ₹{(acc.balance || 0).toLocaleString('en-IN')}
            </div>
          </div>
        ))}
        {displayAccounts.length === 0 && (
          <p className="text-gray-500 text-sm col-span-full">No quick access accounts configured. Go to Settings to add them.</p>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: () => api.get('/users/me/settings')
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your workspace...</div>;
  }

  const userWidgets = settings?.homepage?.widgets || defaultWidgets;

  // Render a specific widget based on its ID
  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'quick_sale':
        return <ActionWidget key={widgetId} title="Quick Sale" icon={ShoppingCart} to="/quick-sale" colorClass="bg-gradient-to-br from-green-500 to-green-600 text-white border-green-700" />;
      case 'new_order':
        return <ActionWidget key={widgetId} title="New Order" icon={PlusCircle} to="/orders/new" colorClass="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-700" />;
      case 'add_expense':
        return <ActionWidget key={widgetId} title="Add Expense" icon={Receipt} to="/expenses/new" colorClass="bg-gradient-to-br from-orange-400 to-orange-500 text-white border-orange-600" />;
      case 'labour':
        return <ActionWidget key={widgetId} title="Labour" icon={Users} to="/labour/daily" colorClass="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-700" />;
      case 'overall_balance':
        return <OverallBalanceWidget key={widgetId} />;
      case 'bank_balances':
        return <div key={widgetId} className="col-span-full"><BankBalancesWidget settings={settings} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {userWidgets.map(renderWidget)}
      </div>
    </div>
  );
}
