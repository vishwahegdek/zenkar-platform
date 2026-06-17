import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { format } from 'date-fns';

export default function LabourSettlements() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialId = queryParams.get('labourerId');
  
  const [selectedLabourerId, setSelectedLabourerId] = useState(initialId ? Number(initialId) : '');

  useEffect(() => {
    if (initialId) {
      setSelectedLabourerId(Number(initialId));
    }
  }, [initialId]);

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

  return (
    <div className="pb-20 bg-gray-900 min-h-screen font-sans">
      <div className="p-3 bg-gray-900 border-b border-gray-700 flex flex-col gap-3">
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Settlement History</h1>
            <button onClick={() => window.history.back()} className="text-sm text-gray-400 hover:text-white">
                ← Back
            </button>
        </div>
      </div>

      {!selectedLabourerId && (
          <div className="p-6 text-center text-gray-500 italic">
              No labourer selected. Please navigate from a specific Labourer's report.
          </div>
      )}

      {/* Loading States */}
      {selectedLabourerId && isLoadingSettlements && <p className="text-center text-gray-400 mt-4">Loading settlements...</p>}

      {/* Settlements Table */}
      {selectedLabourerId && settlements && !isLoadingSettlements && (
          <div className="bg-gray-800 shadow-xl overflow-hidden mt-2">
            <div className="p-3 bg-gray-900 border-b border-gray-700">
              <div className="text-xs text-gray-400">
                  Labourer: <span className="text-white font-bold text-sm">{selectedLabourer?.name}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-700 text-gray-200 uppercase text-[10px] font-bold sticky top-0">
                  <tr>
                    <th className="p-2 border-b border-gray-600">Period</th>
                    <th className="p-2 border-b border-gray-600 text-center">Work</th>
                    <th className="p-2 border-b border-gray-600 text-right">Paid</th>
                    <th className="p-2 border-b border-gray-600 text-right">Bal</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 text-sm">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-gray-500 italic">
                        No settlements found for this labourer.
                      </td>
                    </tr>
                  ) : (
                    settlements.map((settlement, idx) => (
                      <tr key={settlement.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-2 align-top border-r border-gray-700/50">
                          <div className="font-mono text-[11px] mt-1 whitespace-nowrap text-gray-300">
                            {format(new Date(settlement.settlementDate), 'dd/MM/yy')}
                          </div>
                          {settlement.isCarryForward && (
                            <span className="text-[10px] text-yellow-500 font-bold inline-block mt-0.5">CF</span>
                          )}
                        </td>
                        <td className="p-2 align-top text-center border-r border-gray-700/50">
                          <div className="text-[11px] font-bold text-white mt-1">{Number(settlement.totalAttendance)}d</div>
                          <div className="text-[9px] text-gray-500 mt-0.5">@₹{Number(settlement.wageSnapshot)}</div>
                          <div className="text-[11px] text-green-400 font-mono mt-1">₹{Number(settlement.totalPayable)}</div>
                        </td>
                        <td className="p-2 align-top text-right border-r border-gray-700/50">
                          <div className="text-[11px] text-blue-400 font-mono mt-1">₹{Number(settlement.totalPaid)}</div>
                        </td>
                        <td className="p-2 align-top text-right">
                          <div className={`text-[11px] font-mono font-bold mt-1 ${Number(settlement.netBalance) > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                             ₹{Number(settlement.netBalance)}
                          </div>
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
  );
}
