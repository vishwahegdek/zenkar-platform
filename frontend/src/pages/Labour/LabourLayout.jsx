
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function LabourLayout() {
  const location = useLocation();
  const isDailyEntry = location.pathname.includes('/labour/daily');
  const isReport = location.pathname.includes('/labour/report');
  const isManage = location.pathname.includes('/labour/manage');
  const isFullWidth = isDailyEntry || isReport || isManage;

  const theme = {
    bg: 'rgb(59, 100, 116)',
    navBg: '#4caf50',
    navText: 'white',
    activeNavBg: '#45a049',
  };

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: 'white' }}>

      <div className={isFullWidth ? "p-0 w-full" : "p-4 max-w-5xl mx-auto"}>
        <Outlet />
      </div>
    </div>
  );
}
