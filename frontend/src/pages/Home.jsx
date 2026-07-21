import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { ShoppingCart, PlusCircle, Receipt, Wallet, Users, ArrowRight } from 'lucide-react';

const availableWidgets = {
  quick_sale: { id: 'quick_sale', title: 'Quick Sale', type: 'action' },
  new_order: { id: 'new_order', title: 'New Order', type: 'action' },
  add_expense: { id: 'add_expense', title: 'Add Expense', type: 'action' },
  bank_balances: { id: 'bank_balances', title: 'Bank Balances', type: 'data' },
  labour: { id: 'labour', title: 'Labour Dashboard', type: 'action' }
};

// Default widgets if user has no preferences set
const defaultWidgets = ['quick_sale', 'new_order', 'add_expense', 'bank_balances', 'labour'];

// --- WIDGET COMPONENTS ---

const ActionWidget = ({ title, icon: Icon, to, colorClass }) => (
  <Link to={to} className={`flex flex-col items-center justify-center p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-1 ${colorClass}`}>
    <div className="p-4 bg-white/30 rounded-full mb-3 backdrop-blur-sm">
      <Icon className="w-8 h-8" />
    </div>
    <span className="font-semibold text-lg">{title}</span>
  </Link>
);

const BankBalancesWidget = () => {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['treasuryAccounts'],
    queryFn: () => api.get('/ledger/treasury-accounts')
  });

  if (isLoading) return <div className="p-6 bg-white rounded-2xl shadow-sm border animate-pulse h-40"></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4 text-gray-800">
        <Wallet className="w-6 h-6 text-blue-600" />
        <h3 className="font-bold text-lg">Bank & Cash Balances</h3>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {accounts.filter(a => a.type === 'ASSET').slice(0, 5).map(acc => (
          <div key={acc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{acc.name}</div>
              <div className="text-xs text-gray-500">{acc.subType}</div>
            </div>
            <div className="font-bold text-gray-900">
              ₹{(acc.balance || 0).toLocaleString()}
            </div>
          </div>
        ))}
        {accounts.length === 0 && <p className="text-gray-500 text-sm">No accounts found.</p>}
      </div>
      <Link to="/ledger-accounts" className="mt-4 text-sm text-blue-600 font-medium flex items-center hover:underline">
        View all accounts <ArrowRight className="w-4 h-4 ml-1" />
      </Link>
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
      case 'bank_balances':
        return <div key={widgetId} className="md:col-span-2 lg:col-span-2"><BankBalancesWidget /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Welcome Back</h1>
        <p className="text-gray-500">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {userWidgets.map(renderWidget)}
      </div>
    </div>
  );
}
