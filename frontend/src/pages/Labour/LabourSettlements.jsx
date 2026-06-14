import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { format } from 'date-fns';

export default function LabourSettlements() {
  const [selectedLabourerId, setSelectedLabourerId] = useState('');

  // Fetch all active labourers for the dropdown
  const { data: labourers, isLoading: isLoadingLabourers } = useQuery({
    queryKey: ['labourersActive'],
    queryFn: async () => {
      const res = await api.get('/labour');
      return res;
    }
  });

  const { data: settlements, isLoading: isLoadingSettlements } = useQuery({
    queryKey: ['labourSettlements', selectedLabourerId],
    queryFn: async () => {
      if (!selectedLabourerId) return [];
      const res = await api.get(`/labour/${selectedLabourerId}/settlements`);
      return res;
    },
    enabled: !!selectedLabourerId
  });

  const selectedLabourer = labourers?.find(l => l.id === Number(selectedLabourerId));

  const theme = {
    bg: 'rgb(59, 100, 116)',
    cardBg: '#1e293b',
    text: 'white',
    tableHeaderBg: '#4caf50',
    tableCellBg: '#2d3748',
  };

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-6">Settlement History</h1>

        {/* Labourer Selection Dropdown */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6 border border-gray-700">
          <label className="block text-gray-400 text-sm font-bold mb-2">Select Labourer</label>
          <select 
            value={selectedLabourerId} 
            onChange={(e) => setSelectedLabourerId(e.target.value)}
            className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 text-lg focus:border-green-500 focus:outline-none"
          >
            <option value="">-- Choose Labourer --</option>
            {labourers?.map(l => (
              <option key={l.id} value={l.id}>{l.name} (Wage: ₹{l.defaultDailyWage})</option>
            ))}
          </select>
        </div>

        {/* Loading States */}
        {isLoadingLabourers && <p className="text-white">Loading labourers...</p>}
        {selectedLabourerId && isLoadingSettlements && <p className="text-white">Loading settlements...</p>}

        {/* Settlements Table */}
        {selectedLabourerId && settlements && !isLoadingSettlements && (
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Settlements for {selectedLabourer?.name}</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-600 bg-gray-700">Period Ending</th>
                    <th className="p-3 text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-600 bg-gray-700 text-center">Wage Snap.</th>
                    <th className="p-3 text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-600 bg-gray-700 text-center">Attendance</th>
                    <th className="p-3 text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-600 bg-gray-700 text-right">Payable</th>
                    <th className="p-3 text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-600 bg-gray-700 text-right">Paid</th>
                    <th className="p-3 text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-600 bg-gray-700 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-gray-400">
                        No settlements found for this labourer.
                      </td>
                    </tr>
                  ) : (
                    settlements.map((settlement, idx) => (
                      <tr key={settlement.id} className="hover:bg-gray-750 transition-colors">
                        <td className="p-3 text-white whitespace-nowrap">
                          {format(new Date(settlement.settlementDate), 'dd MMM yyyy')}
                          {settlement.isCarryForward && (
                            <span className="ml-2 text-xs bg-yellow-600/30 text-yellow-400 px-2 py-0.5 rounded">CF</span>
                          )}
                        </td>
                        <td className="p-3 text-center text-gray-300">
                           ₹{Number(settlement.wageSnapshot)}
                        </td>
                        <td className="p-3 text-center text-white font-bold">
                          {Number(settlement.totalAttendance)} days
                        </td>
                        <td className="p-3 text-right text-green-400 font-mono">
                          ₹{Number(settlement.totalPayable)}
                        </td>
                        <td className="p-3 text-right text-blue-400 font-mono">
                          ₹{Number(settlement.totalPaid)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold">
                           <span className={Number(settlement.netBalance) > 0 ? 'text-red-400' : 'text-gray-300'}>
                              ₹{Number(settlement.netBalance)}
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
