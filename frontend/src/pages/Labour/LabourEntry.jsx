
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function LabourEntry() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const queryClient = useQueryClient();

  const { data: dailyView, isLoading } = useQuery({
    queryKey: ['labourDaily', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/labour/daily?date=${selectedDate}`);
      return res;
    }
  });

  const mutation = useMutation({
    mutationFn: (updates) => api.post('/labour/daily', { date: selectedDate, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries(['labourDaily', selectedDate]);
      toast.success('Updated Successfully!');
    },
    onError: (err) => toast.error('Update Failed: ' + err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = [];
    
    dailyView.forEach(labourer => {
       const form = e.target;
       const att05 = form[`attendance_${labourer.id}_0.5`].checked;
       const att10 = form[`attendance_${labourer.id}_1`].checked;
       const amount = form[`amount_${labourer.id}`].value;

       let attendance = 0;
       if (att10) attendance = 1;
       else if (att05) attendance = 0.5;

       if (attendance !== labourer.attendance || parseFloat(amount) !== parseFloat(labourer.amount || 0)) {
         updates.push({
           contactId: labourer.id,
           attendance,
           amount: parseFloat(amount) || 0
         });
       }
    });

    if (updates.length > 0) mutation.mutate(updates);
    else toast('No changes to save.', { icon: 'ℹ️' });
  };

  const changeDate = (days) => {
      const newDate = addDays(new Date(selectedDate), days);
      // Prevent future dates
      if (newDate > new Date()) return;
      setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  // Legacy Theme Colors
  const theme = {
    bg: 'rgb(59, 100, 116)',
    tableHeaderBg: '#4caf50',
    tableHeaderColor: 'white',
    tableCellBg: '#4d4d4d',
    tableCellColor: 'white',
    inputBg: '#ddd',
    buttonBg: '#4caf50',
  };

  if (isLoading) return <div className="text-white p-4">Loading...</div>;

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', padding: '0px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media (max-width: 400px) {
           .responsive-hide { display: none; }
           .responsive-text { font-size: 14px !important; }
           .responsive-padding { padding: 4px !important; }
           .responsive-input { width: 60px !important; padding: 4px !important; }
        }
      `}</style>
      <h1 className="text-center text-white text-2xl font-bold py-2 mb-0">Labour Entry</h1>
      
      <div className="flex justify-center items-center gap-4 mb-4 p-2 bg-black/20">
        <button 
            type="button" 
            onClick={() => changeDate(-1)}
            className="bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl"
        >
            &lt;
        </button>

        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="p-2 rounded text-lg font-bold text-center"
          style={{ backgroundColor: theme.inputBg, color: 'black' }}
        />

        <button 
            type="button" 
            onClick={() => changeDate(1)}
            disabled={selectedDate >= format(new Date(), 'yyyy-MM-dd')}
            className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl ${
                selectedDate >= format(new Date(), 'yyyy-MM-dd') 
                ? 'bg-transparent text-gray-500 cursor-not-allowed' 
                : 'bg-white/20 hover:bg-white/40 text-white'
            }`}
        >
            &gt;
        </button>
      </div>

      <form onSubmit={handleSubmit} key={selectedDate + dailyView?.length}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="responsive-hide" style={{ backgroundColor: theme.tableHeaderBg, color: theme.tableHeaderColor, padding: '10px' }}>ID</th>
              <th style={{ backgroundColor: theme.tableHeaderBg, color: theme.tableHeaderColor, padding: '10px' }}>Name</th>
              <th style={{ backgroundColor: theme.tableHeaderBg, color: theme.tableHeaderColor, padding: '10px' }}>Att.</th>
              <th style={{ backgroundColor: theme.tableHeaderBg, color: theme.tableHeaderColor, padding: '10px' }}>Amt.</th>
            </tr>
          </thead>
          <tbody>
            {dailyView?.map((labourer) => {
              const isSettled = labourer.lastSettlementDate && new Date(selectedDate) <= new Date(labourer.lastSettlementDate);
              const rowOpacity = isSettled ? '0.5' : '1';
              const rowBg = isSettled ? '#333' : theme.tableCellBg;

              return (
              <tr key={labourer.id} style={{ opacity: rowOpacity, backgroundColor: rowBg }}>
                <td className="responsive-hide" style={{ backgroundColor: theme.tableCellBg, color: theme.tableCellColor, padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                  {labourer.id}
                </td>
                <td className="responsive-padding responsive-text" style={{ backgroundColor: theme.tableCellBg, color: theme.tableCellColor, padding: '10px', textAlign: 'center', border: '1px solid #ddd', fontSize: '16px' }}>
                  {labourer.name}
                </td>
                <td className="responsive-padding" style={{ backgroundColor: theme.tableCellBg, color: theme.tableCellColor, padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                  <div className="flex justify-center gap-2">
                    <label className="cursor-pointer flex items-center gap-1 text-sm">
                        <input 
                            type="checkbox" 
                            name={`attendance_${labourer.id}_0.5`}
                            disabled={isSettled}
                            defaultChecked={Number(labourer.attendance) === 0.5}
                            onChange={(e) => {
                                if(e.target.checked) document.getElementsByName(`attendance_${labourer.id}_1`)[0].checked = false;
                            }}
                            className="w-5 h-5 accent-green-500"
                        /> 
                        ½
                    </label>
                    <label className="cursor-pointer flex items-center gap-1 text-sm">
                        <input 
                            type="checkbox" 
                            name={`attendance_${labourer.id}_1`} 
                            disabled={isSettled}
                            defaultChecked={Number(labourer.attendance) === 1}
                            onChange={(e) => {
                                if(e.target.checked) document.getElementsByName(`attendance_${labourer.id}_0.5`)[0].checked = false;
                            }}
                            className="w-5 h-5 accent-green-500"
                        /> 
                        1
                    </label>
                  </div>
                  {isSettled && <div className="text-xs text-red-300 mt-1 font-bold">Settled</div>}
                </td>
                <td className="responsive-padding" style={{ backgroundColor: theme.tableCellBg, color: theme.tableCellColor, padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                  <input 
                    type="number" 
                    disabled={isSettled} 
                    className="responsive-input font-bold"
                    name={`amount_${labourer.id}`}
                    defaultValue={labourer.amount || ''}
                    placeholder="0"
                    style={{ backgroundColor: theme.inputBg, color: 'black', width: '80px', padding: '8px' }}
                  />
                </td>

              </tr>
              );
            })}
          </tbody>
        </table>

        <div className="fixed bottom-0 left-0 w-full p-0 z-50">
            <button 
                type="submit" 
                style={{ backgroundColor: theme.buttonBg, height: '60px' }}
                className="w-full text-white text-xl font-bold hover:bg-green-600 transition-colors shadow-[0_-5px_15px_rgba(0,0,0,0.3)] border-t border-green-400"
            >
                SAVE UPDATES
            </button>
        </div>
      </form>
      <div className="h-24"></div> {/* Spacer for fixed button */}
    </div>
  );
}
