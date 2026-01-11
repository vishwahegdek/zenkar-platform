import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { Plus, Search, ArrowUpRight, ArrowDownLeft, Wallet, User as UserIcon, History } from 'lucide-react';
import FinancePartyModal from './FinancePartyModal';
import TransactionModal from './TransactionModal';
import FinanceHistoryModal from './FinanceHistoryModal';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('CREDITOR'); // CREDITOR (Payables) | DEBTOR (Receivables)
  const [searchTerm, setSearchTerm] = useState('');
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null); // For Transaction or Edit

  const { data: parties = [], isLoading, refetch } = useQuery({
    queryKey: ['finance-parties', activeTab],
    queryFn: () => api.get(`/finance/parties?type=${activeTab}`).then(res => res)
  });

  const filteredParties = parties.filter(p => 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate Totals
  const totalBalance = parties.reduce((sum, p) => sum + (Number(p.stats?.netBalance) || 0), 0);
  
  const handleEditParty = (party) => {
    setSelectedParty(party);
    setIsPartyModalOpen(true);
  };
  
  const handleAddTransaction = (party) => {
      setSelectedParty(party);
      setIsTxModalOpen(true);
  };

  const handleViewHistory = (party) => {
      setSelectedParty(party);
      setIsHistoryModalOpen(true);
  };

  const handleCreateParty = () => {
      setSelectedParty(null);
      setIsPartyModalOpen(true);
  };
  
  const handleTxSuccess = () => {
      refetch();
      setIsTxModalOpen(false);
  };

  const handlePartySuccess = () => {
      refetch();
      setIsPartyModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 md:px-0">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="w-8 h-8 text-primary" />
                Finance Book
            </h1>
            <p className="text-gray-500">Manage Payables and Receivables</p>
        </div>
        
        {/* Total Card */}
        <div className={`px-6 py-3 rounded-xl border ${activeTab === 'CREDITOR' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
            <span className="text-sm font-medium opacity-80">{activeTab === 'CREDITOR' ? 'Total Payable' : 'Total Receivable'}</span>
            <div className="text-2xl font-bold">
                {Math.abs(totalBalance).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </div>
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 px-4 md:px-0">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button 
                onClick={() => setActiveTab('CREDITOR')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'CREDITOR' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Payables (We Owe)
              </button>
              <button 
                onClick={() => setActiveTab('DEBTOR')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'DEBTOR' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Receivables (They Owe)
              </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={handleCreateParty}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Add Party</span>
                <span className="md:hidden">Add</span>
              </button>
          </div>
      </div>

      {/* List */}
      {isLoading ? (
         <div className="p-12 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-0">
          {filteredParties.map(party => (
            <div key={party.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                            {(party.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{party.name || 'Unknown Party'}</h3>
                            <p className="text-xs text-gray-500 mt-1">{party.phone || 'No phone'}</p>
                        </div>
                    </div>
                    {/* Menu or Edit - For now simple edit on card click or dedicated button */}
                    <button onClick={() => handleEditParty(party)} className="text-gray-400 hover:text-blue-600">
                        <UserIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Net Balance</p>
                        <p className={`text-xl font-bold ${party.stats?.netBalance > 0 ? 'text-red-600' : party.stats?.netBalance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {Math.abs(party.stats?.netBalance || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">
                           {party.stats?.netBalance > 0 ? 'To Pay' : party.stats?.netBalance < 0 ? 'To Receive' : 'Settled'}
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleViewHistory(party)}
                            className="bg-white hover:bg-gray-50 text-gray-600 p-2 rounded-lg border border-gray-200 transition-colors"
                            title="View History"
                        >
                            <History className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleAddTransaction(party)}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
                        >
                            Transaction
                        </button>
                    </div>
                </div>
            </div>
          ))}

          {filteredParties.length === 0 && (
             <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 No parties found.
             </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isPartyModalOpen && (
          <FinancePartyModal 
            isOpen={isPartyModalOpen}
            onClose={() => setIsPartyModalOpen(false)}
            onSuccess={handlePartySuccess}
            party={selectedParty}
            defaultType={activeTab}
          />
      )}

      {isTxModalOpen && selectedParty && (
          <TransactionModal 
            isOpen={isTxModalOpen}
            onClose={() => setIsTxModalOpen(false)}
            onSuccess={handleTxSuccess}
            party={selectedParty}
          />
      )}

      {isHistoryModalOpen && selectedParty && (
          <FinanceHistoryModal 
              isOpen={isHistoryModalOpen}
              onClose={() => setIsHistoryModalOpen(false)}
              party={selectedParty}
          />
      )}
    </div>
  );
}
