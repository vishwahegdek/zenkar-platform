import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

const RecipientModal = ({ isOpen, onClose, recipientToEdit, prefilledName }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      // contactId: '' // Future: Link to contact
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (recipientToEdit) {
        setValue('name', recipientToEdit.name);
      } else if (prefilledName) {
        setValue('name', prefilledName);
      } else {
        reset();
      }
    }
  }, [isOpen, recipientToEdit, prefilledName, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (recipientToEdit) {
        return api.patch(`/recipients/${recipientToEdit.id}`, data);
      }
      return api.post('/recipients', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['recipients']);
      onClose(data); // Pass back the created/updated recipient
      reset();
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => onClose(null)}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {recipientToEdit ? 'Edit Recipient' : 'New Recipient'}
              </h3>
              <div className="mt-2">
                <form id="recipient-form" onSubmit={handleSubmit(onSubmit)}>
                   <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left">Name</label>
                        <input
                          type="text"
                          id="name"
                          {...register('name', { required: 'Name is required' })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          autoFocus
                          autoComplete="off"
                        />
                         {errors.name && <p className="text-red-500 text-xs mt-1 text-left">{errors.name.message}</p>}
                      </div>
                   </div>
                </form>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              form="recipient-form"
              disabled={mutation.isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {mutation.isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => onClose(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientModal;
