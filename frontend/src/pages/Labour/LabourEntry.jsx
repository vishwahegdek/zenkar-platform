
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { format } from 'date-fns';

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
      alert('Updated Successfully!');
    }
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
    else alert("No changes to save.");
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
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', padding: '8px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media (max-width: 400px) {
           .responsive-hide { display: none; }
           .responsive-text { font-size: 14px !important; }
           .responsive-padding { padding: 4px !important; }
           .responsive-input { width: 60px !important; padding: 4px !important; }
        }
      `}</style>
      <h1 className="text-center text-white text-2xl font-bold mb-2">Labour Entry</h1>
      
      <div className="flex justify-center items-center gap-2 mb-4">
        <label className="text-white font-bold text-sm">Date:</label>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-1 rounded text-base"
          style={{ backgroundColor: theme.inputBg }}
        />
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
            {dailyView?.map((labourer) => (
              <tr key={labourer.id}>
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
                            defaultChecked={Number(labourer.attendance) === 0.5}
                            onChange={(e) => {
                                if(e.target.checked) document.getElementsByName(`attendance_${labourer.id}_1`)[0].checked = false;
                            }}
                            className="w-4 h-4"
                        /> 
                        ½
                    </label>
                    <label className="cursor-pointer flex items-center gap-1 text-sm">
                        <input 
                            type="checkbox" 
                            name={`attendance_${labourer.id}_1`} 
                            defaultChecked={Number(labourer.attendance) === 1}
                            onChange={(e) => {
                                if(e.target.checked) document.getElementsByName(`attendance_${labourer.id}_0.5`)[0].checked = false;
                            }}
                            className="w-4 h-4"
                        /> 
                        1
                    </label>
                  </div>
                </td>
                <td className="responsive-padding" style={{ backgroundColor: theme.tableCellBg, color: theme.tableCellColor, padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                  <input 
                    type="number" 
                    className="responsive-input"
                    name={`amount_${labourer.id}`}
                    defaultValue={labourer.amount || ''}
                    placeholder="0"
                    style={{ backgroundColor: theme.inputBg, width: '80px', padding: '8px' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="fixed bottom-0 left-0 w-full p-0 z-50">
            <button 
                type="submit" 
                style={{ backgroundColor: theme.buttonBg, height: '50px' }}
                className="w-full text-white text-lg font-bold hover:bg-green-600 transition-colors shadow-lg"
            >
                UPDATE RECORDS
            </button>
        </div>
      </form>
      <div className="h-20"></div> {/* Spacer for fixed button */}
    </div>
  );
}
