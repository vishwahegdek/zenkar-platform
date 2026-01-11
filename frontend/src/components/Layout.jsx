import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Menu, X, LogOut, ChevronRight } from 'lucide-react';

import { useMobileAutoScroll } from '../hooks/useMobileAutoScroll';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';

const PAGE_TITLES = {
  '/dashboard': 'Overview',
  '/quick-sale': 'Quick Sale',
  '/orders': 'Orders',
  '/customers': 'Customer Directory',
  '/production': 'Production Floor',
  '/products': 'Inventory & Products',
  '/expenses': 'Expense Book',
  '/finance': 'Finance Ledger',
  '/labour': 'Labour Management',
  '/contacts': 'Global Contacts',
  '/': 'Orders',
};

export default function Layout() {
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Activate global mobile auto-scroll for all inputs
  useMobileAutoScroll();

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Determine Page Title
  // Sort by length desc to match most specific path first (e.g. /orders before /)
  const currentPath = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find(path => location.pathname.startsWith(path));
    
  const pageTitle = PAGE_TITLES[currentPath] || 'Zenkar Platform';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex w-64 flex-shrink-0" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             {(location.pathname === '/' || location.pathname === '/orders') && (
               <>
                 <Link to="/quick-sale" className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-1.5 rounded-md sm:rounded-full text-xs sm:text-sm font-medium hover:bg-purple-200 transition-colors shadow-sm flex items-center gap-1">
                   <span className="text-base">⚡</span> <span>Quick</span>
                 </Link>
                 <Link to="/orders/new" className="bg-blue-600 text-white px-2 sm:px-3 py-1.5 rounded-md sm:rounded-full text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1">
                  <span className="text-base">+</span> <span>New</span>
                 </Link>
               </>
             )}
            {/* Mobile Menu Trigger (Moved to Right) */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white transition-transform transform translate-x-0">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button 
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <Sidebar className="h-full border-none" />
            
             <div className="p-4 border-t border-gray-200 bg-gray-50">
               <button 
                 onClick={logout}
                 className="flex items-center gap-2 text-red-600 font-medium w-full px-3 py-2 rounded-md hover:bg-red-50"
               >
                 <LogOut className="w-5 h-5" />
                 Sign Out
               </button>
             </div>
          </div>
          
          <div className="flex-shrink-0 w-14">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </div>
      )}
    </div>
  );
}
