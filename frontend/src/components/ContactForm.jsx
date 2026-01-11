import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { parsePhoneNumber } from 'libphonenumber-js';

const formatDisplayPhone = (phone) => {
    try {
        const p = parsePhoneNumber(phone || '', 'IN');
        if (p) {
             return p.nationalNumber;
        }
    } catch(e) { }
    return phone;
};

export default function ContactForm({ initialData, onSuccess, onCancel, isModal = false }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = Boolean(initialData?.id);

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { 
        name: '', 
        phones: [{ value: '', type: 'mobile' }], 
        group: '' 
    }
  });
  
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "phones"
  });

  // Populate form if editing
  useEffect(() => {
    if (initialData) {
        setValue('name', initialData.name || '');
        setValue('group', initialData.group || '');
        
        if (initialData.phones && initialData.phones.length > 0) {
            replace(initialData.phones.map(p => {
                const display = formatDisplayPhone(p.phone); 
                return { value: display, type: p.type || 'mobile' }; 
            }));
        } else if (initialData.phone) {
             const display = formatDisplayPhone(initialData.phone);
             replace([{ value: display, type: 'mobile' }]);
        } else {
            replace([{ value: '', type: 'mobile' }]);
        }
    } else {
        reset({ name: '', phones: [{ value: '', type: 'mobile' }], group: '' });
    }
  }, [initialData, setValue, replace, reset]);

  const createMutation = useMutation({
    mutationFn: (data) => {
        const payload = {
            ...data,
            phones: data.phones.map(p => ({ value: p.value, type: p.type })).filter(p => p.value),
            userId: user?.id
        };
        return api.post('/contacts', payload);
    }, 
    onSuccess: (data) => {
      queryClient.invalidateQueries(['contacts']);
      toast.success('Contact added & Synced to Google');
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
        toast.error(error.message || "Failed to create contact");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
        const payload = {
            ...data,
            phones: data.phones.map(p => ({ value: p.value, type: p.type })).filter(p => p.value),
            userId: user?.id
        };
        return api.patch(`/contacts/${initialData.id}`, payload);
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries(['contacts']);
        toast.success('Contact updated & Synced to Google');
        if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
        toast.error(error.message || "Failed to update contact");
    }
  });

  const onSubmit = (data) => {
    if (isEdit) {
        updateMutation.mutate(data);
    } else {
        createMutation.mutate(data);
    }
  };

  const containerClasses = isModal ? "" : "bg-white p-4 rounded-lg shadow-sm border border-gray-100";

  return (
    <div className={containerClasses}>
      {!isModal && (
          <h2 className="text-lg font-medium mb-4">{isEdit ? 'Edit Contact' : 'Add New Contact'}</h2>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <fieldset>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g. Ramesh (Labour)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                autoFocus={isModal}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phones</label>
              <div className="space-y-2">
                  {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                          {/* Type Selector */}
                          <select
                             {...register(`phones.${index}.type`)}
                              className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm bg-gray-50"
                          >
                              <option value="mobile">Mobile</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                          </select>
                          
                          <input
                          {...register(`phones.${index}.value`, { required: 'Phone is required' })}
                          placeholder="9876543210"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                          />
                          {fields.length > 1 && (
                              <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500">
                                  <Trash2 size={18} />
                              </button>
                          )}
                      </div>
                  ))}
              </div>
               <button type="button" onClick={() => append({ value: '', type: 'mobile' })} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  <Plus size={16} /> Add Another Phone
               </button>
              {errors.phones && <p className="text-red-500 text-xs mt-1">At least one phone is required</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Group/Tag</label>
              <input
                {...register('group')}
                placeholder="e.g. Labour, Vendor"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              />
            </div>

            <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium disabled:bg-gray-300"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isEdit ? 'Update Contact' : 'Save Contact')}
                </button>
                
                {onCancel && (
                    <button 
                      type="button" 
                      onClick={onCancel}
                      className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                )}
            </div>
        </fieldset>
      </form>
    </div>
  );
}
