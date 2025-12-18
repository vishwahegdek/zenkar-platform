import { useState, useEffect } from 'react';
import { Save, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import Modal from '../../components/Modal';
import { api } from '../../api';
import { toast } from 'react-hot-toast';

export default function TransactionModal({ isOpen, onClose, onSuccess, party }) {
  const [formData, setFormData] = useState({
      amount: '',
      type: '', // Will default based on party
      date: new Date().toISOString().split('T')[0],
      note: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (party) {
        // Set default logical action
        if (party.type === 'CREDITOR') {
            setFormData(prev => ({ ...prev, type: 'BORROWED' })); // Default: We borrow more
        } else {
            setFormData(prev => ({ ...prev, type: 'LENT' })); // Default: We lend more
        }
    }
  }, [party]);

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          await api.post(`/finance/parties/${party.id}/transactions`, {
              ...formData,
              amount: Number(formData.amount)
          });
          toast.success('Transaction saved');
          onSuccess();
      } catch (err) {
          toast.error('Failed to save transaction');
      } finally {
          setLoading(false);
      }
  };

  const isCreditor = party?.type === 'CREDITOR';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`New Transaction - ${party?.name}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Action Selector */}
            <div className="grid grid-cols-2 gap-3">
                {isCreditor ? (
                    <>
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'BORROWED' })}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === 'BORROWED' ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20' : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600'}`}
                        >
                            <ArrowDownLeft className="w-6 h-6" />
                            <span className="font-semibold">Borrow (Increase Debt)</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'REPAID' })}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === 'REPAID' ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-500/20' : 'bg-white border-gray-200 text-gray-500 hover:border-green-200 hover:text-green-600'}`}
                        >
                            <ArrowUpRight className="w-6 h-6" />
                            <span className="font-semibold">Repay (Reduce Debt)</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'LENT' })}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === 'LENT' ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20' : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600'}`}
                        >
                            <ArrowUpRight className="w-6 h-6" />
                            <span className="font-semibold">Lend (Give Money)</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'COLLECTED' })}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === 'COLLECTED' ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-500/20' : 'bg-white border-gray-200 text-gray-500 hover:border-green-200 hover:text-green-600'}`}
                        >
                            <ArrowDownLeft className="w-6 h-6" />
                            <span className="font-semibold">Collect (Receive Money)</span>
                        </button>
                   </>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                        <input 
                            type="number" 
                            name="amount"
                            required
                            min="0"
                            step="0.01"
                            className="input-field w-full pl-8"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input 
                        type="date" 
                        name="date"
                        required
                        className="input-field w-full mt-1"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea 
                    name="note"
                    rows="2"
                    placeholder="e.g. Bank Transfer, Cash, etc."
                    className="input-field w-full mt-1"
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Transaction'}
                </button>
            </div>
        </form>
    </Modal>
  );
}
