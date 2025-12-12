
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

import SmartSelector from '../components/SmartSelector';

const ExpenseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  
  // Custom state for selector since it's complex
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      categoryId: ''
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: async () => {
      return await api.get('/expenses/categories');
    }
  });

  const { data: expense, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const res = await api.get(`/expenses?id=${id}`); // Assuming API supports filtering by ID returns array
      return res[0]; 
    },
    enabled: isEditMode
  });

  useEffect(() => {
    if (expense) {
      setValue('date', new Date(expense.date).toISOString().split('T')[0]);
      setValue('amount', expense.amount);
      setValue('description', expense.description);
      setValue('categoryId', expense.categoryId);
      
      if (expense.recipient) {
         setSelectedRecipient({
             name: expense.recipient.name,
             id: expense.recipient.id,
             contactId: expense.recipient.contactId
         });
      }
    }
  }, [expense, setValue]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        amount: parseFloat(data.amount),
        categoryId: parseInt(data.categoryId),
        date: new Date(data.date).toISOString(),
        description: data.description,
        // Smart Selector Data
        recipientId: selectedRecipient?.id || null, 
        recipientName: selectedRecipient?.name,
        contactId: selectedRecipient?.contactId || null
      };

      if (isEditMode) {
        return api.patch(`/expenses/${id}`, payload);
      }
      return api.post('/expenses', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      navigate('/expenses');
    }
  });

  const onSubmit = (data) => {
    if (!selectedRecipient) {
        // Maybe required? Or optional? User said "Recipient field is not mandatory"
        // So allow null
    }
    mutation.mutate(data);
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow rounded-lg mt-4">
      <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Edit Expense' : 'New Expense'}</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              step="0.01"
              {...register('amount', { required: 'Amount is required' })}
              className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              placeholder="0.00"
            />
          </div>
           {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        {/* Recipient (Smart Selector) */}
        <div className="mb-4">
            <SmartSelector 
                label="Recipient / Payee"
                type="recipient"
                initialValue={selectedRecipient?.name || ''}
                onSelect={(item) => setSelectedRecipient(item)}
            />
             <p className="text-xs text-gray-500 mt-1">Select existing recipient, contact, or type new name.</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            {...register('categoryId', { required: 'Category is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          >
            <option value="">Select Category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
           <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {mutation.isLoading ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
