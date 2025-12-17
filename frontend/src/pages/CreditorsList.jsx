import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CreditorsList() {
  // Simple search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: creditors, isLoading } = useQuery({
    queryKey: ['creditors'],
    queryFn: () => api.get('/creditors')
  });

  const filteredCreditors = creditors?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const navigate = useNavigate();

  const handleCreate = async () => {
    const name = window.prompt("Enter Creditor Name:");
    if (!name) return;
    
    try {
        await api.post('/creditors', { name });
        toast.success('Creditor added');
        // Refetch happens automatically if we invalidate, but here we just wait for next fetch or optimistic
        // Simpler to just invalidate or reload. 
        // But since we are using useQuery with specific key, we should invalidate.
        window.location.reload(); // Lazy reload for MVP or invalidate
        // ideally: queryClient.invalidateQueries(['creditors']);
    } catch (e) {
        toast.error('Failed to add creditor');
    }
  };
  
  // Better implementation of Create would be a proper modal or separate page.
  // For now, I'll link to a "New Creditor" page or use a simple prompt for speed if I don't want to build a full form page yet.
  // Actually, let's just make a simple "Add" button that prompts for name, similar to a quick add, or better, use a Modal if I had a reusable one.
  // To keep it robust, I will use a simple inline form or just navigate to a "new" page if complexity grows.
  // But wait, the plan said "Manager Creditors".
  
  // Let's stick to the "New Page" pattern for consistency if possible, or "Modal". 
  // Given I haven't seen a generic Modal in the file list easily, I'll implementing a proper `CreditorForm` might be overkill if it's just a name.
  // I'll stick to a simple UI first: A "New" button that navigates to `/creditors/new` or opens a dialog.
  // Let's try to do it inline or via separate page. I'll make a separate simple page or just use the prompt for MVP.
  // Prompt is bad UX. I'll use a simple state-based form in the list header or a modal overlay.
  // Let's use a standard "New" page pattern to be safe: `/creditors/new`.

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 md:px-0">
        <h1 className="text-2xl font-bold text-gray-900">Creditors (Accounts Payable)</h1>
        <div className="w-full md:w-auto flex gap-2">
            <input 
              type="text" 
              placeholder="Search..." 
              className="input-field w-full md:w-64"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            
            <button 
                onClick={handleCreate}
                className="hidden md:inline-flex bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 items-center gap-2"
            >
              + New Creditor
            </button>
        </div>
      </div>

      {isLoading ? (
         <div className="p-8 text-center text-gray-500">Loading creditors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-0">
          {filteredCreditors.map(creditor => (
            <Link key={creditor.id} to={`/creditors/${creditor.id}`} className="block">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{creditor.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{creditor.phone || 'No Phone'}</p>
                    </div>
                    <div className="text-right">
                        <span className={`font-bold text-lg ${creditor.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {Number(creditor.balance).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                        <div className="text-xs text-gray-400">Balance</div>
                    </div>
                  </div>
                </div>
            </Link>
          ))}
          
          {filteredCreditors.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                  No creditors found. <button onClick={handleCreate} className="text-blue-600 underline">Add one</button>
              </div>
          )}
        </div>
      )}

      {/* Mobile FAB */}
      <button onClick={handleCreate} className="md:hidden fixed bottom-6 right-6 bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 z-50 text-2xl">
        +
      </button>
    </div>
  );
}
