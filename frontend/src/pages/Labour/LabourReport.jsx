
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function LabourReport() {
  const [dateRange, setDateRange] = useState({
      from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedLabourerId, setSelectedLabourerId] = useState('');

  // Fetch Labour List for Dropdown
  const { data: labourList } = useQuery({
      queryKey: ['labourList'],
      queryFn: async () => {
          return await api.get('/labour');
      }
  });

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['labourReport', dateRange, selectedLabourerId],
    queryFn: async () => {
      let url = `/labour/report?from=${dateRange.from}&to=${dateRange.to}`;
      if(selectedLabourerId) url += `&labourerId=${selectedLabourerId}`;
      const res = await api.get(url);
      return res;
    }
  });

  const handleSubmit = (e) => {
      e.preventDefault();
      refetch();
  };

  const theme = {
    headerColor: '#4caf50', 
    rowBg: '#4d4d4d',
  };

  if(isLoading) return <div>Loading Report...</div>;

  return (
    <div>
      <h1 className="text-center text-2xl font-bold mb-4">Employee Data Report</h1>
      
      {/* Date Filter */}
      <div className="flex justify-center mb-4">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 items-stretch md:items-end bg-white/10 p-3 rounded-lg w-full max-w-md">
            <div className="flex flex-col">
                <label className="block text-sm font-bold mb-1">Start Date:</label>
                <input 
                    type="date" 
                    value={dateRange.from}
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                    className="p-2 rounded text-black text-sm"
                />
            </div>
            
            <div className="flex flex-col w-full md:w-auto">
                 <label className="block text-sm font-bold mb-1">Employee:</label>
                 <select 
                    value={selectedLabourerId}
                    onChange={(e) => setSelectedLabourerId(e.target.value)}
                    className="p-2 rounded text-black text-sm w-full"
                 >
                    <option value="">All Employees</option>
                    {labourList?.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                 </select>
            </div>

            <div className="flex flex-col">
                 <label className="block text-sm font-bold mb-1">End Date:</label>
                <input 
                    type="date" 
                    value={dateRange.to}
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                    className="p-2 rounded text-black text-sm"
                />
            </div>
            <button 
                type="submit" 
                className="px-4 py-2 font-bold text-white bg-green-600 hover:bg-green-500 rounded text-sm md:text-base mt-2 md:mt-0"
            >
                Get Data
            </button>
        </form>
      </div>

      {/* Report Cards */}
      <div className="space-y-4">
        {report?.length === 0 && <div className="text-center">No data found for the specified criteria.</div>}
        
        {report?.map((emp) => (
            <div key={emp.id} className="bg-white/5 p-3 rounded-lg border border-gray-600 shadow-md">
                <h2 className="text-lg font-bold text-yellow-500 mb-1">{emp.name} (ID: {emp.id})</h2>
                <h3 className="text-base mb-2">Daily Wage: ₹{emp.salary}</h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse mb-2 text-sm">
                        <thead>
                            <tr style={{ backgroundColor: theme.headerColor }}>
                                <th className="border border-white/20 p-1 text-left">Date</th>
                                <th className="border border-white/20 p-1 text-left">Attendance</th>
                                <th className="border border-white/20 p-1 text-left">Amount Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emp.records.map((rec, idx) => (
                                <tr key={idx} style={{ backgroundColor: theme.rowBg }}>
                                    <td className="border border-white/20 p-1">{rec.date}</td>
                                    <td className="border border-white/20 p-1">{rec.attendance > 0 ? rec.attendance : '-'}</td>
                                    <td className="border border-white/20 p-1">{rec.amount > 0 ? `₹${rec.amount}` : '-'}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-700 font-bold">
                                <td className="border border-white/20 p-1 text-right">Total</td>
                                <td className="border border-white/20 p-1">{emp.totalDays}</td>
                                <td className="border border-white/20 p-1">₹{emp.totalPaid.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="border border-white/20 p-1 font-bold text-right" colSpan={2}>Total Salary</td>
                                <td className="border border-white/20 p-1 font-bold text-green-400">
                                    ₹{emp.totalSalary.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="text-right mt-2">
                    <h3 className="text-xl font-bold" style={{ color: emp.balance < 0 ? 'red' : '#00ff08' }}>
                        Balance: ₹{emp.balance.toFixed(2)}
                    </h3>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
