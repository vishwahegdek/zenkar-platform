import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function LabourReport() {
  const [selectedLabourerId, setSelectedLabourerId] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // For searchable input
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch Labour List
  const { data: labourList } = useQuery({
      queryKey: ['labourList'],
      queryFn: async () => {
          return await api.get('/labour');
      }
  });

  const queryClient = useQueryClient();

  const filteredLabourers = useMemo(() => {
     if (!labourList) return [];
     return labourList.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [labourList, searchTerm]);

  const handleSelectLabourer = (labourer) => {
      setSelectedLabourerId(labourer.id);
      setSearchTerm(labourer.name);
      setIsDropdownOpen(false);
  };

  const [selectedSettlementId, setSelectedSettlementId] = useState(''); // Empty = Current Period

  // Fetch Report
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['labourReport', selectedLabourerId, selectedSettlementId],
    queryFn: async () => {
      if (!selectedLabourerId) return null;
      let url = `/labour/report?labourerId=${selectedLabourerId}`;
      if (selectedSettlementId) url += `&settlementId=${selectedSettlementId}`;
      const res = await api.get(url);
      return res;
    },
    enabled: !!selectedLabourerId
  });

  const employeeData = reportData && reportData.length > 0 ? reportData[0] : null;

  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', date: '' });

  // Fetch Settlements for History Dropdown
  const { data: settlements } = useQuery({
      queryKey: ['settlements', selectedLabourerId],
      queryFn: async () => {
          if(!selectedLabourerId) return [];
          return await api.get(`/labour/${selectedLabourerId}/settlements`);
      },
      enabled: !!selectedLabourerId
  });

  const { mutate: settle } = useMutation({
    mutationFn: (data) => api.post(`/labour/${data.id}/settle`, { settlementDate: data.date, isCarryForward: data.isCarryForward }),
    onSuccess: () => {
        toast.success('Settlement created successfully.');
        setConfirmModal({ ...confirmModal, open: false });
        refetch();
    },
    onError: (err) => toast.error('Failed to settle: ' + err.message)
  });

  const initiateSettle = (type) => { // type: 'CLEAR' or 'CARRY_FORWARD'
     if (!settlementDate) return toast.error("Please select a date");
     setConfirmModal({ open: true, type, date: settlementDate });
  };

  const executeSettle = () => {
      const isCF = confirmModal.type === 'CARRY_FORWARD';
      settle({ id: employeeData.id, date: confirmModal.date, isCarryForward: isCF });
  };

  return (
    <div className="pb-20 bg-gray-900 min-h-screen">
      
      {/* 1. Header & Search Area - Compact & Sticky */}
      <div className="bg-gray-800 p-2 sticky top-0 z-40 border-b border-gray-700 shadow-md">
          <div className="relative max-w-lg mx-auto">
             <input 
                type="text"
                placeholder="Search & Select Employee..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if(e.target.value === '') setSelectedLabourerId('');
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full p-2 pl-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none placeholder-gray-400 font-bold"
                autoFocus
             />
             {isDropdownOpen && filteredLabourers.length > 0 && (
                 <ul className="absolute w-full mt-1 bg-gray-700 border border-gray-600 rounded shadow-xl max-h-60 overflow-y-auto z-50">
                     {filteredLabourers.map(emp => (
                         <li 
                            key={emp.id}
                            onClick={() => handleSelectLabourer(emp)}
                            className="p-3 text-white hover:bg-green-600 cursor-pointer border-b border-gray-600 last:border-0"
                         >
                            {emp.name}
                         </li>
                     ))}
                 </ul>
             )}
          </div>
      </div>

      {isLoading && <div className="text-center text-gray-400 mt-4">Loading Report...</div>}

      {/* 2. Report Display */}
      {selectedLabourerId && employeeData && (
         <div className="bg-gray-800 shadow-xl overflow-hidden">
            
            {/* Employee Info & Settle Bar */}
            <div className="p-3 bg-gray-900 border-b border-gray-700 flex flex-wrap justify-between items-center gap-2">
                <div>
                     <div className="text-xs text-gray-400">
                        Current Wage: <span className="text-white font-mono">₹{employeeData.salary}</span> | 
                        Last Settled: <span className="text-yellow-400 font-mono">
                            {employeeData.lastSettlementDate 
                                ? format(new Date(employeeData.lastSettlementDate), 'dd/MM/yyyy')
                                : 'Never'}
                        </span>
                     </div>
                </div>

                {/* History Selector */}
                <div className="flex gap-2">
                    <select 
                        className="p-1 rounded bg-gray-700 text-white text-xs border border-gray-600"
                        value={selectedSettlementId}
                        onChange={(e) => setSelectedSettlementId(e.target.value)}
                    >
                        <option value="">Current Period</option>
                        {settlements?.map(s => (
                            <option key={s.id} value={s.id}>
                                {format(new Date(s.settlementDate), 'dd/MM/yyyy')} {s.isCarryForward ? '(CF)' : ''} - ₹{Number(s.netBalance).toFixed(0)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Settle Actions - Only show if in Current Period */}
                {!selectedSettlementId && (
                    <div className="flex bg-gray-800 rounded border border-gray-600 p-1 gap-1 items-center">
                       <input 
                           type="date" 
                           className="p-1 rounded bg-gray-700 text-white text-xs border border-gray-600" 
                           value={settlementDate}
                           onChange={e => setSettlementDate(e.target.value)}
                       />
                       
                       <div className="flex">
                           <button 
                               onClick={() => initiateSettle('CLEAR')}
                               className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-l text-[10px] font-bold uppercase border-r border-red-800"
                               title="Settle and Clear Balance to Zero"
                           >
                               Settle (Clear)
                           </button>
                           <button 
                             onClick={() => initiateSettle('CARRY_FORWARD')}
                             className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-r text-[10px] font-bold uppercase"
                             title="Settle and Carry Forward Balance"
                           >
                               Carry Fwd
                           </button>
                       </div>
                    </div>
                )}
            </div>

            {/* Data Table - Edge to Edge */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-700 text-gray-200 uppercase text-xs font-bold sticky top-0">
                        <tr>
                            <th className="p-2 border-b border-gray-600">Date</th>
                            <th className="p-2 border-b border-gray-600 text-center">Att</th>
                            <th className="p-2 border-b border-gray-600 text-right">Paid</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300 text-sm">
                        {/* Opening Balance Row */}
                        {employeeData.openingBalance !== 0 && (
                            <tr className="bg-gray-800/80 border-b border-gray-700 font-bold text-yellow-500">
                                <td className="p-2 italic border-r border-gray-700/50">OPENING BAL</td>
                                <td className="p-2 border-r border-gray-700/50"></td>
                                <td className="p-2 text-right">₹{employeeData.openingBalance.toFixed(0)}</td>
                            </tr>
                        )}
                        {employeeData.records.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-6 text-center text-gray-500 italic">
                                    No records found since last settlement.
                                </td>
                            </tr>
                        ) : (
                            employeeData.records.map((rec, idx) => (
                                <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-2 font-mono border-r border-gray-700/50">{rec.date}</td>
                                    <td className="p-2 text-center border-r border-gray-700/50">
                                        {rec.attendance > 0 ? (
                                            <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                                                {rec.attendance}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-2 text-right">
                                        {rec.amount > 0 ? (
                                            <span className="text-yellow-300 font-mono">₹{rec.amount}</span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Compact Totals & Balance Fixed at Bottom */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-700 shadow-lg z-50">
                 <div className="grid grid-cols-3 divide-x divide-gray-700">
                    <div className="p-2 flex flex-col justify-center items-center">
                         <span className="text-gray-500 text-[10px] uppercase tracking-wide">Work</span>
                         <span className="text-lg font-bold text-green-400">₹{employeeData.totalSalary.toFixed(0)}</span>
                         <span className="text-[10px] text-gray-400">{employeeData.totalDays} days</span>
                    </div>

                    <div className="p-2 flex flex-col justify-center items-center bg-gray-800/50">
                         <span className="text-gray-500 text-[10px] uppercase tracking-wide">Paid</span>
                         <span className="text-lg font-bold text-yellow-400">₹{employeeData.totalPaid.toFixed(0)}</span>
                    </div>

                    <div className={`p-2 flex flex-col justify-center items-center relative overflow-hidden ${employeeData.balance < 0 ? 'bg-red-900/20' : 'bg-green-900/20'}`}>
                         <div className={`absolute left-0 top-0 bottom-0 w-1 ${employeeData.balance < 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                         <span className="text-gray-500 text-[10px] uppercase tracking-wide">Balance</span>
                         <span className={`text-xl font-bold ${employeeData.balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ₹{Math.abs(employeeData.balance).toFixed(0)}
                         </span>
                    </div>
                 </div>
            </div>
            
            {/* Spacer for fixed footer */}
            <div className="h-20"></div>

         </div>
      )}

     {/* 3. Custom Confirmation Modal */}
     {confirmModal.open && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl max-w-sm w-full p-4 transform scale-100 transition-all">
                 <h3 className="text-lg font-bold text-white mb-2">Confirm Settlement</h3>
                 
                 <div className="bg-gray-900/50 p-3 rounded mb-4 text-sm text-gray-300">
                     <p className="mb-2">Settle up to <span className="font-mono text-white">{confirmModal.date}</span>?</p>
                     
                     {confirmModal.type === 'CARRY_FORWARD' ? (
                         <div className="flex items-start gap-2 text-blue-300 bg-blue-900/20 p-2 rounded">
                             <span className="text-lg">➥</span>
                             <p>Balance will be <strong>Carried Forward</strong> as Opening Balance for the next period.</p>
                         </div>
                     ) : (
                        <div className="flex items-start gap-2 text-red-300 bg-red-900/20 p-2 rounded">
                            <span className="text-lg">✘</span>
                            <p>Balance will be <strong>CLEARED (Zeroed)</strong>. This starts clean.</p>
                        </div>
                     )}
                 </div>

                 <div className="flex justify-end gap-3">
                     <button 
                         onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                         className="px-4 py-2 text-gray-400 hover:text-white font-bold"
                     >
                         Cancel
                     </button>
                     <button 
                        onClick={executeSettle}
                        className={`px-4 py-2 rounded font-bold text-white shadow-lg ${
                            confirmModal.type === 'CARRY_FORWARD' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'
                        }`}
                     >
                         Confirm {confirmModal.type === 'CARRY_FORWARD' ? 'Carry Forward' : 'Clear'}
                     </button>
                 </div>
             </div>
         </div>
     )}
    </div>
  );
}
