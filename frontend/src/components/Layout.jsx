import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { useMobileAutoScroll } from '../hooks/useMobileAutoScroll';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Activate global mobile auto-scroll for all inputs
  useMobileAutoScroll();
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen pb-10 bg-gray-50">
      <Toaster position="top-center" />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight">Order Book</Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/orders">Orders</NavLink>
              <NavLink to="/expenses">Expenses</NavLink>
              <NavLink to="/contacts">Contacts</NavLink>
              <NavLink to="/labour">Labour</NavLink>
              <NavLink to="/customers">Customers</NavLink>
              <NavLink to="/products">Products</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/quick-sale" className="bg-purple-100 text-purple-700 px-3 py-2 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors shadow-sm flex items-center gap-1" aria-label="Quick Sale">
               <span className="text-lg">⚡</span> <span className="hidden md:inline">Quick</span>
            </Link>
            <Link to="/orders/new" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2" aria-label="New Order">
              <span className="md:hidden">New</span> <span className="hidden md:inline">New Order</span>
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Open menu"
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-2 flex flex-col gap-1">
              <NavLink to="/dashboard" mobile>Dashboard</NavLink>
              <NavLink to="/orders" mobile>Orders</NavLink>
              <NavLink to="/expenses" mobile>Expenses</NavLink>
              <NavLink to="/contacts" mobile>Contacts</NavLink>
              <NavLink to="/labour" mobile>Labour</NavLink>
              <NavLink to="/customers" mobile>Customers</NavLink>
              <NavLink to="/products" mobile>Products</NavLink>
            </div>
          </div>
        )}
      </header>
      
      <main className="max-w-6xl mx-auto px-0 md:px-4 py-4 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, children, mobile }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);
  
  const baseClasses = mobile 
    ? "block px-3 py-2 text-base font-medium rounded-md transition-colors"
    : "px-3 py-2 text-sm font-medium rounded-md transition-colors";
    
  const activeClasses = isActive 
    ? "text-blue-700 bg-blue-50" 
    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50";

  return (
    <Link to={to} className={`${baseClasses} ${activeClasses}`}>
      {children}
    </Link>
  );
}
