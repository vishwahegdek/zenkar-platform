
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

export default function ManageExpenses() {
  // Now just focusing on categories, can rename this component later to CategoriesManager if needed.
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Categories</h1>
      <CategoriesManager />
    </div>
  );
}

function CategoriesManager() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  const { data: categories } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: async () => {
      return await api.get('/expenses/categories');
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/expenses/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenseCategories']);
      reset();
      toast.success('Category added');
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to add category');
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-3">Add Category</h3>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex gap-2">
          <input
            {...register('name', { required: true })}
            placeholder="Category Name (e.g. Fuel, Labour)"
            className="flex-1 rounded-md border-gray-300 shadow-sm border p-2"
          />
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-medium p-4 border-b">Existing Categories</h3>
        <div className="divide-y">
          {categories?.map((cat) => (
            <div key={cat.id} className="p-3 px-4 text-gray-700">
              {cat.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
