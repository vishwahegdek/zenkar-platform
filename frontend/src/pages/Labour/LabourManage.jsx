
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export default function LabourManage() {
  const queryClient = useQueryClient();
  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd } = useForm();
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch only labour contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['labourContacts'],
    queryFn: async () => {
      return await api.get('/labour');
    }
  });

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [contacts, searchTerm]);

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/labour', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['labourContacts']);
      resetAdd();
      setIsAdding(false);
      toast.success('Employee Added Successfully');
    },
    onError: (err) => toast.error('Failed to add employee: ' + err.message)
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.post(`/labour/${data.id}`, { 
        name: data.name, 
        defaultDailyWage: parseFloat(data.defaultDailyWage) 
    }),
    onSuccess: () => {
        queryClient.invalidateQueries(['labourContacts']);
        toast.success('Employee Updated Successfully');
    },
    onError: (err) => toast.error('Failed to update: ' + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/labour/${id}`),
    onSuccess: () => {
        queryClient.invalidateQueries(['labourContacts']);
        toast.success('Employee Removed');
    },
    onError: (err) => toast.error('Failed to remove: ' + err.message)
  });

  if(isLoading) return <div className="text-gray-400 text-center mt-10">Loading Employees...</div>;

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 p-2 shadow-md">
          <div className="flex gap-2 items-center">
              <input 
                  type="text" 
                  placeholder="Search Employee..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-gray-800 text-white p-3 rounded border border-gray-700 focus:outline-none focus:border-green-500 font-bold placeholder-gray-500"
              />
               <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className={`px-4 py-3 rounded font-bold text-sm whitespace-nowrap transition-all ${isAdding ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-green-600 text-white flex items-center gap-1 hover:bg-green-500'}`}
               >
                   {isAdding ? '✕ Cancel' : '+ Add'}
               </button>
          </div>
           
           {/* Add Form */}
           {isAdding && (
               <div className="mt-2 bg-gray-800 rounded p-3 border border-gray-600 animate-fade-in-down">
                   <form onSubmit={handleSubmitAdd(addMutation.mutate)} className="flex flex-col gap-3">
                        <div className="flex gap-2">
                             <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Name</label>
                                <input 
                                    {...registerAdd('name', { required: true })}
                                    placeholder="Name"
                                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                                    autoFocus
                                />
                             </div>
                             <div className="w-28">
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Wage (₹)</label>
                                <input 
                                    {...registerAdd('defaultDailyWage', { required: true })}
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                                />
                             </div>
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-500">
                            Save 
                        </button>
                   </form>
               </div>
           )}
      </div>

      {/* Employee List - Single Row Cards */}
      <div className="p-2 grid gap-2">
          {filteredContacts.map(c => (
             <EmployeeRow 
                 key={c.id} 
                 employee={c} 
                 onUpdate={updateMutation.mutate}
                 onDelete={deleteMutation.mutate}
             />
          ))}
          {filteredContacts.length === 0 && (
              <div className="text-center text-gray-500 py-10">No employees found matching "{searchTerm}"</div>
          )}
      </div>
    </div>
  );
}

function EmployeeRow({ employee, onUpdate, onDelete }) {
    const { register, handleSubmit, formState: { isDirty } } = useForm({
        defaultValues: {
            id: employee.id,
            name: employee.name,
            defaultDailyWage: employee.defaultDailyWage || 0
        }
    });

    return (
        <div className="bg-gray-800 rounded border border-gray-700 p-2 shadow-sm">
            <form onSubmit={handleSubmit(onUpdate)} className="flex items-center gap-2">
                
                {/* Name Input */}
                <div className="flex-1 min-w-0">
                    <input 
                        {...register('name')}
                        className="w-full bg-transparent text-white font-bold text-base focus:bg-gray-700 p-1 rounded focus:outline-none border-b border-transparent focus:border-gray-500 transition-all placeholder-gray-600 truncate"
                    />
                </div>

                {/* Wage Input */}
                <div className="w-20 shrink-0 relative">
                    <span className="absolute left-1 top-1.5 text-gray-500 text-xs">₹</span>
                    <input 
                        {...register('defaultDailyWage')}
                        type="number"
                        className="w-full bg-transparent text-right text-green-400 font-mono text-base focus:bg-gray-700 p-1 pl-4 rounded focus:outline-none border-b border-transparent focus:border-gray-500 transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center ml-4">
                     {isDirty ? (
                         <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-500 shadow animate-pulse">
                             Save
                         </button>
                     ) : (
                        <button 
                            type="button" 
                            onClick={() => { if(confirm(`Remove ${employee.name}?`)) onDelete(employee.id); }}
                            className="bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded transition-all"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                     )}
                </div>

            </form>
        </div>
    );
}
