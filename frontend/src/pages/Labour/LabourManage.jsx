
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { useForm } from 'react-hook-form';

export default function LabourManage() {
  const queryClient = useQueryClient();
  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd } = useForm();
  
  // Fetch only labour contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['labourContacts'],
    queryFn: async () => {
      // Use new /labour endpoints
      const res = await api.get('/labour');
      return res;
    }
  });

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/labour', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['labourContacts']);
      resetAdd();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.post(`/labour/${data.id}`, { 
        name: data.name, 
        defaultDailyWage: parseFloat(data.defaultDailyWage) 
    }),
    onSuccess: () => queryClient.invalidateQueries(['labourContacts'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/labour/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['labourContacts'])
  });

  // Bulk Update handler to mimic legacy "Update Existing Employees" button
  const handleBulkUpdate = async (e) => {
      e.preventDefault();
      const form = e.target;
      // In legacy, it was a form post. Here we can iterate. 
      // Since it's React, individual updates are cleaner, but let's support individual save for now 
      // or "Update All" button that loops?
      // Legacy UI had one big button. Let's do creating a mutation for each changed item is complex.
      // Let's just have inline updates for simplicity or individual Save buttons?
      // Legacy styling: Row with Name input, Checkbox Remove, Salary input. 
      // Let's replicate row.
      alert("Feature: In this version, changes are saved individually or by row. Use the 'Update' button if implemented or auto-save.");
  };

  const theme = {
    inputBg: '#ddd',
    inputColor: 'black',
    buttonBg: '#4caf50',
    deleteColor: '#ff0000',
  };

  if(isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-center text-2xl font-bold mb-4">Employee Information</h1>
      
      {/* Existing Employees List mimicking legacy form */}
      {/* Existing Employees List mimicking legacy form */}
      <div className="bg-white/10 p-3 rounded-lg mb-4">
        <h2 className="text-lg mb-2 font-bold">Existing Employees</h2>
        <div className="space-y-4">
            {contacts?.map(c => (
                <EmployeeRow 
                    key={c.id} 
                    employee={c} 
                    onUpdate={updateMutation.mutate}
                    onDelete={deleteMutation.mutate}
                    theme={theme}
                />
            ))}
        </div>
      </div>

      <hr className="border-gray-500 my-8"/>

      {/* Add New Employee */}
      <div className="bg-white/10 p-3 rounded-lg">
        <h2 className="text-lg mb-2 font-bold">Add New Employee</h2>
        <form onSubmit={handleSubmitAdd(addMutation.mutate)} className="space-y-3">
            <div>
                <label className="block font-bold mb-1">New Employee Name:</label>
                <input 
                    {...registerAdd('name', { required: true })}
                    className="p-2 w-full max-w-md"
                    style={{ backgroundColor: theme.inputBg, color: theme.inputColor }}
                />
            </div>
            <div>
                <label className="block font-bold mb-1">New Employee Salary:</label>
                <input 
                    {...registerAdd('defaultDailyWage', { required: true })}
                    type="number"
                    className="p-2 w-full max-w-md"
                    style={{ backgroundColor: theme.inputBg, color: theme.inputColor }}
                />
            </div>
            <button 
                type="submit" 
                className="mt-4 px-6 py-2 font-bold text-white transition-colors hover:bg-green-600"
                style={{ backgroundColor: theme.buttonBg }}
            >
                Add New Employee
            </button>
        </form>
      </div>
    </div>
  );
}

function EmployeeRow({ employee, onUpdate, onDelete, theme }) {
    const { register, handleSubmit, formState: { isDirty } } = useForm({
        defaultValues: {
            id: employee.id,
            name: employee.name,
            defaultDailyWage: employee.defaultDailyWage || 0
        }
    });

    return (
        <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col md:flex-row gap-2 items-start md:items-center border-b border-gray-600 pb-2">
            <div className="flex-1">
                <label className="block font-bold text-sm mb-1">Name:</label>
                <input 
                    {...register('name')}
                    className="p-2 w-full"
                    style={{ backgroundColor: theme.inputBg, color: theme.inputColor }}
                />
            </div>
            
            <div className="flex items-center gap-2 md:pt-6">
                 <button 
                    type="button" 
                    onClick={() => { if(confirm(`Remove ${employee.name}?`)) onDelete(employee.id); }}
                    className="text-red-400 hover:text-red-300 font-bold text-sm"
                 >
                    [ Remove ]
                 </button>
            </div>

            <div className="flex-1 w-full">
                <label className="block font-bold text-sm mb-1">Salary:</label>
                <input 
                    {...register('defaultDailyWage')}
                    type="number"
                    className="p-2 w-full"
                    style={{ backgroundColor: theme.inputBg, color: theme.inputColor }}
                />
            </div>

            <div className="w-full md:w-20 md:pt-6 text-left md:text-center text-xs text-gray-400">
                ID: {employee.id}
            </div>
            
            <div className="md:pt-6 w-full md:w-auto">
               {isDirty && (
                   <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
                       Save
                   </button>
               )}
            </div>
        </form>
    );
}
