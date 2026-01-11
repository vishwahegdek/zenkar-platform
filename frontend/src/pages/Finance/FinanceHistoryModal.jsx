import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import Modal from '../../components/Modal';
import { api } from '../../api';

export default function FinanceHistoryModal({ isOpen, onClose, party }) {
  const { data: fullParty, isLoading } = useQuery({
    queryKey: ['finance-party', party?.id],
    queryFn: () => api.get(`/finance/parties/${party.id}`).then(res => res),
    enabled: !!party?.id && isOpen
  });

  const transactions = fullParty?.transactions || [];
  const stats = fullParty?.stats || {};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'BORROWED':
        return { label: 'Borrowed', color: 'text-red-600', bg: 'bg-red-50', icon: ArrowDownLeft };
      case 'REPAID':
        return { label: 'Repaid', color: 'text-green-600', bg: 'bg-green-50', icon: ArrowUpRight };
      case 'LENT':
        return { label: 'Lent', color: 'text-red-600', bg: 'bg-red-50', icon: ArrowUpRight }; // Money out
      case 'COLLECTED':
        return { label: 'Collected', color: 'text-green-600', bg: 'bg-green-50', icon: ArrowDownLeft }; // Money in
      default:
        return { label: type, color: 'text-gray-600', bg: 'bg-gray-50', icon: FileText };
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`History - ${party?.name}`} maxWidth="max-w-2xl">
      <div className="space-y-6">
        
        {/* Summary Card */}
        {isLoading ? (
             <div className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>
        ) : (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                <div>
                    <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Current Net Balance</span>
                    <div className={`text-3xl font-bold mt-1 ${stats.netBalance > 0 ? 'text-red-600' : stats.netBalance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {Math.abs(stats.netBalance || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </div>
                     <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                         {stats.netBalance > 0 ? 'To Pay' : stats.netBalance < 0 ? 'To Receive' : 'Settled'}
                     </p>
                </div>
                <div className="text-right text-sm space-y-1">
                    {party.type === 'CREDITOR' ? (
                        <>
                            <div className="text-gray-600">Total Borrowed: <span className="font-semibold text-gray-900">{stats.borrowed?.toLocaleString('en-IN')}</span></div>
                            <div className="text-gray-600">Total Repaid: <span className="font-semibold text-green-700">{stats.repaid?.toLocaleString('en-IN')}</span></div>
                        </>
                    ) : (
                        <>
                            <div className="text-gray-600">Total Lent: <span className="font-semibold text-gray-900">{stats.lent?.toLocaleString('en-IN')}</span></div>
                            <div className="text-gray-600">Total Collected: <span className="font-semibold text-green-700">{stats.collected?.toLocaleString('en-IN')}</span></div>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* Transactions List */}
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Transactions</h3>
            {isLoading ? (
                <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-lg"></div>)}
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl bg-gray-50">
                    No transactions found.
                </div>
            ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {transactions.map(tx => {
                        const config = getTypeConfig(tx.type);
                        const Icon = config.icon;
                        
                        return (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{config.label}</p>
                                        <p className="text-xs text-gray-500">{formatDate(tx.date)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${config.color}`}>
                                        {Number(tx.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </p>
                                    {tx.note && (
                                        <p className="text-xs text-gray-400 max-w-[150px] truncate">{tx.note}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        <div className="flex justify-end pt-2">
            <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
