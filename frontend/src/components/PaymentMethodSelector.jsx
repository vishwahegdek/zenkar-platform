import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Banknote, Landmark, CreditCard, Wallet, MoreHorizontal } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

export default function PaymentMethodSelector({ value, onChange }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['treasuryAccounts'],
    queryFn: () => api.get('/ledger/treasury-accounts'),
  });

  const { data: settings = {}, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: () => api.get('/users/me/settings')
  });

  if (isLoadingAccounts || isLoadingSettings) {
    return <div className="h-10 animate-pulse bg-gray-100 rounded-lg"></div>;
  }
  
  if (accounts.length === 0) return null;

  const prefs = settings.paymentMethods;

  let quickAccounts = [];
  let dropdownAccounts = [];

  // If preferences exist, use them. Otherwise default to Cash & Bank in Quick, rest in Dropdown.
  if (prefs?.quickAccessIds || prefs?.dropdownIds) {
    quickAccounts = accounts.filter(acc => prefs.quickAccessIds?.includes(acc.id));
    dropdownAccounts = accounts.filter(acc => prefs.dropdownIds?.includes(acc.id));
  } else {
    quickAccounts = accounts.filter(acc => acc.subType === 'CASH' || acc.subType === 'BANK');
    dropdownAccounts = accounts.filter(acc => acc.subType !== 'CASH' && acc.subType !== 'BANK');
  }

  // If a value is selected that is in the dropdown (or nowhere), we might want to ensure the dropdown is visible
  // But for now, we just rely on the user clicking "Other"
  const isDropdownValueSelected = dropdownAccounts.some(acc => acc.id === value);
  const isCustomActive = showDropdown || isDropdownValueSelected;

  const getIcon = (subType, isSelected) => {
    const className = `w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`;
    switch(subType) {
      case 'CASH': return <Banknote className={className.replace('text-blue-600', 'text-green-600')} />;
      case 'CREDIT_CARD': return <CreditCard className={className} />;
      default: return <Landmark className={className} />;
    }
  };

  const dropdownOptions = dropdownAccounts.map(acc => ({
    value: acc.id,
    label: acc.name,
    subLabel: acc.type === 'LIABILITY' ? 'Liability/Credit' : acc.subType
  }));

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
      
      {/* Horizontally scrollable container */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {quickAccounts.map(acc => {
          const isSelected = value === acc.id;
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => {
                onChange(acc.id);
                setShowDropdown(false);
              }}
              className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all border ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {getIcon(acc.subType, isSelected)}
              {acc.name}
            </button>
          );
        })}

        {dropdownAccounts.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDropdown(true)}
            className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all border ${
              isCustomActive && !quickAccounts.some(a => a.id === value)
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <MoreHorizontal className={`w-4 h-4 ${isCustomActive ? 'text-blue-600' : 'text-gray-400'}`} />
            Other...
          </button>
        )}
      </div>

      {/* Slide-down dropdown for custom accounts */}
      {(showDropdown || isDropdownValueSelected) && dropdownAccounts.length > 0 && (
        <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <SearchableSelect
            options={dropdownOptions}
            value={isDropdownValueSelected ? value : ''}
            onChange={(val) => {
              if (val) onChange(val);
            }}
            placeholder="Select payment method..."
          />
        </div>
      )}
    </div>
  );
}
