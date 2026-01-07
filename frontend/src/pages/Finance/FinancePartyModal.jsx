import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react'; // Using Lucide icons
import Modal from '../../components/Modal'; // Using standard Modal component
import { api } from '../../api';
import { toast } from 'react-hot-toast';
import Autocomplete from '../../components/Autocomplete';

export default function FinancePartyModal({ isOpen, onClose, onSuccess, party, defaultType }) {
  const [formData, setFormData] = useState({
      name: '',
      phone: '',
      notes: '',
      type: defaultType || 'CREDITOR',
      contactId: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (party) {
        setFormData({
            name: party.name,
            phone: party.phone || '',
            notes: party.notes || '',
            type: party.type,
            contactId: party.contactId || null
        });
    } else {
        setFormData(prev => ({ ...prev, type: defaultType }));
    }
  }, [party, defaultType]);

  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContactSelect = (contact) => {
      setFormData(prev => ({
          ...prev,
          contactId: contact.id,
          name: contact.name, // Show name in UI for validation/feedback
          phone: contact.phone || ''
      }));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          // Prepare payload: if linked to contact, send name/phone as null/undefined (or omit)
          // The backend will resolve them.
          const payload = { ...formData };
          if (payload.contactId) {
             delete payload.name;
             delete payload.phone;
          }

          if (party) {
              await api.put(`/finance/parties/${party.id}`, payload);
              toast.success('Party updated');
          } else {
              await api.post('/finance/parties', payload);
              toast.success('Party created');
          }
          onSuccess();
      } catch (err) {
          console.error(err);
          toast.error('Failed to save party');
      } finally {
          setLoading(false);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={party ? "Edit Party" : "New Finance Party"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Contact Link */}
            {!party && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                    <Autocomplete 
                        label="Link from Contacts (Optional)" 
                        placeholder="Search contacts..." 
                        endpoint="/contacts"
                        onSelect={handleContactSelect}
                        onChange={(val) => {
                            // If user clears the input or types something new, we should unlink the contact
                            // (Strict mode: Only link if selected from list. If text changes, unlink)
                            if (formData.contactId) {
                                setFormData(prev => ({
                                    ...prev,
                                    contactId: null,
                                    // Optional: Clear name/phone too? Or leave them?
                                    // User flow: They linked, then decided to change. 
                                    // Better to keep the text but enable the fields?
                                    // Actually if they clear the Autocomplete completely, we assume unlink.
                                }));
                            }
                        }}
                        displayKey="name"
                        subDisplayKey="phone"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                        Select a contact to auto-fill details.
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input 
                    type="text" 
                    name="name"
                    required
                    className={`input-field w-full mt-1 ${formData.contactId ? 'bg-gray-100' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!!formData.contactId}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input 
                        type="text" 
                        name="phone"
                        className={`input-field w-full mt-1 ${formData.contactId ? 'bg-gray-100' : ''}`}
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!!formData.contactId}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select 
                        name="type" 
                        className="input-field w-full mt-1"
                        value={formData.type}
                        onChange={handleChange}
                    >
                        <option value="CREDITOR">Creditor (Payable)</option>
                        <option value="DEBTOR">Debtor (Receivable)</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea 
                    name="notes"
                    rows="3"
                    className="input-field w-full mt-1"
                    value={formData.notes}
                    onChange={handleChange}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Party'}
                </button>
            </div>
        </form>
    </Modal>
  );
}
