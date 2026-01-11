import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Factory, 
  Receipt, 
  BookOpen, 
  Briefcase, 
  LogOut,
  Menu
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export function Sidebar({ className }) {
  const { logout } = useAuth();
  const location = useLocation();

  const menuGroups = [
    {
      title: "Sales",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Quick Sale", path: "/quick-sale", icon: ShoppingCart },
        { name: "Orders", path: "/orders", icon: Package },
        { name: "Customers", path: "/customers", icon: Users },
      ]
    },
    {
      title: "Operations",
      items: [
        { name: "Production", path: "/production", icon: Factory },
        { name: "Products", path: "/products", icon: Package },
      ]
    },
    {
      title: "Finance",
      items: [
        { name: "Expenses", path: "/expenses", icon: Receipt },
        { name: "Finance Book", path: "/finance", icon: BookOpen },
      ]
    },
    {
      title: "People",
      items: [
        { name: "Labour", path: "/labour", icon: Briefcase },
        { name: "Contacts", path: "/contacts", icon: Users },
      ]
    }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className={`bg-white border-r border-gray-200 flex flex-col ${className}`}>
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold">Z</span>
          </div>
          Zenkar
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-blue-600" : "text-gray-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-3 text-sm font-medium text-gray-700">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">Administrator</p>
              <p className="truncate text-xs text-gray-500">admin@zenkar.in</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
