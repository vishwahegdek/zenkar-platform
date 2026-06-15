import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, Check, Plus, Trash2 } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('payments');
  const [localNicknames, setLocalNicknames] = useState({});

  // Fetch all potential payment accounts (Cash + Bank + Liabilities)
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['treasuryAccounts'],
    queryFn: () => api.get('/ledger/treasury-accounts')
  });

  // Fetch user settings
  const { data: settings = {}, isLoading: loadingSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: () => api.get('/users/me/settings')
  });

  React.useEffect(() => {
    if (settings?.paymentMethods?.nicknames) {
      setLocalNicknames(settings.paymentMethods.nicknames);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (newSettings) => api.patch('/users/me/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries(['userSettings']);
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings')
  });

  if (loadingAccounts || loadingSettings) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  const prefs = settings.paymentMethods || { quickAccessIds: [], dropdownIds: [] };

  const handleToggleCategory = (accountId, category) => {
    let newQuick = [...(prefs.quickAccessIds || [])];
    let newDrop = [...(prefs.dropdownIds || [])];

    if (category === 'quick') {
      if (newQuick.includes(accountId)) {
        newQuick = newQuick.filter(id => id !== accountId);
      } else {
        newQuick.push(accountId);
        newDrop = newDrop.filter(id => id !== accountId);
      }
    } else if (category === 'drop') {
      if (newDrop.includes(accountId)) {
        newDrop = newDrop.filter(id => id !== accountId);
      } else {
        newDrop.push(accountId);
        newQuick = newQuick.filter(id => id !== accountId);
      }
    }

    mutation.mutate({
      ...settings,
      paymentMethods: { 
        ...prefs,
        quickAccessIds: newQuick, 
        dropdownIds: newDrop 
      }
    });
  };

  const handleNicknameBlur = (accountId) => {
    const currentNicknames = prefs.nicknames || {};
    const localVal = localNicknames[accountId];
    
    if (currentNicknames[accountId] !== localVal) {
      mutation.mutate({
        ...settings,
        paymentMethods: {
          ...prefs,
          nicknames: {
            ...currentNicknames,
            [accountId]: localVal
          }
        }
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Customize your zenkar experience</p>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button 
          className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('payments')}
        >
          Payment Methods
        </button>
        {/* Future tabs can go here */}
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
            <h3 className="font-bold mb-1">How it works</h3>
            <p>Customize which accounts show up when you record a payment (like receiving cash or paying an expense). <strong>Quick Tabs</strong> show as fast-tap buttons, and <strong>Dropdown</strong> accounts are hidden under an "Other..." button.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Nickname</th>
                  <th className="px-4 py-3 text-center">Quick Tab</th>
                  <th className="px-4 py-3 text-center">Dropdown</th>
                  <th className="px-4 py-3 text-center">Hidden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map(acc => {
                  const isQuick = prefs.quickAccessIds?.includes(acc.id);
                  const isDrop = prefs.dropdownIds?.includes(acc.id);
                  const isHidden = !isQuick && !isDrop;

                  return (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{acc.name}</div>
                        <div className="text-[10px] text-gray-500">{acc.type} • {acc.subType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={localNicknames[acc.id] || ''}
                          onChange={(e) => setLocalNicknames(prev => ({ ...prev, [acc.id]: e.target.value }))}
                          onBlur={() => handleNicknameBlur(acc.id)}
                          placeholder="E.g. Dad's SBI"
                          className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full max-w-[150px]"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="radio" 
                          name={`acc-${acc.id}`} 
                          checked={isQuick} 
                          onChange={() => handleToggleCategory(acc.id, 'quick')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="radio" 
                          name={`acc-${acc.id}`} 
                          checked={isDrop} 
                          onChange={() => handleToggleCategory(acc.id, 'drop')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="radio" 
                          name={`acc-${acc.id}`} 
                          checked={isHidden} 
                          onChange={() => {
                            const newQuick = (prefs.quickAccessIds || []).filter(id => id !== acc.id);
                            const newDrop = (prefs.dropdownIds || []).filter(id => id !== acc.id);
                            mutation.mutate({
                              ...settings,
                              paymentMethods: { ...prefs, quickAccessIds: newQuick, dropdownIds: newDrop }
                            });
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
