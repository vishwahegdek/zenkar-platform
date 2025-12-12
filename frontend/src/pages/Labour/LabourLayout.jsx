
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function LabourLayout() {
  const theme = {
    bg: 'rgb(59, 100, 116)',
    navBg: '#4caf50',
    navText: 'white',
    activeNavBg: '#45a049',
  };

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: 'white' }}>
      <nav className="flex justify-between items-center p-4 bg-opacity-90 sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 className="text-xl font-bold">Labour Manager</h1>
        <div className="flex gap-4">
          <NavLink 
            to="/labour/daily" 
            className={({ isActive }) => `px-4 py-2 rounded ${isActive ? 'bg-green-700' : 'bg-green-600 hover:bg-green-500'}`}
            style={{ backgroundColor: theme.navBg, color: theme.navText, textDecoration: 'none' }}
          >
            Daily Entry
          </NavLink>
          <NavLink 
            to="/labour/report" 
            className={({ isActive }) => `px-4 py-2 rounded ${isActive ? 'bg-green-700' : 'bg-green-600 hover:bg-green-500'}`}
            style={{ backgroundColor: theme.navBg, color: theme.navText, textDecoration: 'none' }}
          >
            Report
          </NavLink>
          <NavLink 
            to="/labour/manage" 
            className={({ isActive }) => `px-4 py-2 rounded ${isActive ? 'bg-green-700' : 'bg-green-600 hover:bg-green-500'}`}
            style={{ backgroundColor: theme.navBg, color: theme.navText, textDecoration: 'none' }}
          >
            Manage
          </NavLink>
        </div>
      </nav>
      
      <div className="p-4 max-w-5xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
