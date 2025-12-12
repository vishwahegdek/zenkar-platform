import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { format, addDays, subDays } from 'date-fns';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = format(selectedDate, 'yyyy-MM-dd'); // API expects YYYY-MM-DD

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', dateStr],
    queryFn: () => api.get(`/dashboard/stats?date=${dateStr}`),
    refetchInterval: 30000, 
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['dashboard-payments', dateStr],
    queryFn: () => api.get(`/dashboard/payments?date=${dateStr}`),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: () => api.get('/dashboard/activities'),
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));

  if (statsLoading || paymentsLoading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="container mx-auto px-0 py-0 space-y-0 max-w-full overflow-x-hidden font-sans">
      {/* Date Navigation & Header - Flush with top */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-0 bg-white border-b border-gray-200 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800 hidden md:block p-4">Dashboard</h1>
        
        {/* Minimalist Date Nav - Full Width, No Borders on container, just bottom border of header */}
        <div className="flex items-center justify-between w-full md:w-auto h-12">
           <button 
             onClick={handlePrevDay} 
             className="h-full px-4 hover:bg-gray-50 transition-colors text-gray-600 font-bold border-r border-gray-100"
             aria-label="Previous Day"
           >
             ←
           </button>
           
           <div className="flex items-center justify-center gap-2 font-semibold text-gray-900 text-sm flex-1 h-full relative">
             <span className="text-base">📅</span>
             <span>{format(selectedDate, 'dd MMM yyyy')}</span>
             <input 
               type="date" 
               className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
               value={dateStr}
               onChange={(e) => setSelectedDate(new Date(e.target.value))}
             />
           </div>

           <button 
             onClick={handleNextDay} 
             className="h-full px-4 hover:bg-gray-50 transition-colors text-gray-600 font-bold border-l border-gray-100"
             aria-label="Next Day"
           >
             →
           </button>
        </div>
      </div>

      {/* Recent Payments Table - Square */}
      <div className="bg-white border-b border-gray-200 rounded-none">
            {/* Header with Only Income - Square */}
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center rounded-none">
                <h2 className="text-sm font-bold text-gray-800">Payments</h2>
                <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Income</span>
                    <span className="text-sm font-bold text-green-700">{formatCurrency(Number(stats?.totalReceived) || 0)}</span>
                </div>
                {/* Optional: Summary in Header? User asked to remove Total Sales field, but keep Income. 
                    The Income Card is already there. Do we need it in header too? 
                    User said "Keep income". I'll keep the card as primary. 
                    I'll remove the header summary to be cleaner if not strictly requested, 
                    OR keep it minimal properly. Let's keep distinct Income in header if useful, 
                    but the Big Card does the job. I'll remove the header summary to "Remove the total sales field totally".
                */}
            </div>

            {/* Optimized List View - Fonts matching Order List */}
            <div className="md:hidden divide-y divide-gray-100">
                {payments?.map((payment) => (
                    <div key={payment.id} className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            {/* Customer Name: font-medium text-gray-900 (Matching Order List) */}
                            <div className="font-medium text-gray-900 truncate w-[65%] text-sm">
                                {payment.customerName}
                            </div>
                            {/* Amount: font-bold text-gray-900 (Matching Order List) */}
                            <div className="font-bold text-gray-900 text-sm">
                                {formatCurrency(payment.amount)}
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-0.5">
                             <div className="flex gap-2">
                                 <span>#{payment.orderNo || payment.orderId}</span>
                                 <span>{format(new Date(payment.date), 'hh:mm a')}</span>
                             </div>
                             <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-none
                                ${payment.method === 'UPI' ? 'bg-purple-50 text-purple-700' : 
                                  payment.method === 'Cash' ? 'bg-green-50 text-green-700' : 
                                  'bg-gray-50 text-gray-600'}`}>
                                {payment.method || 'Gen'}
                             </span>
                        </div>
                    </div>
                ))}
                 {!payments?.length && (
                     <div className="p-4 text-center text-gray-400 text-sm">No payments found.</div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 font-medium">Time</th>
                            <th className="px-4 py-3 font-medium">Customer</th>
                            <th className="px-4 py-3 font-medium">Method</th>
                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payments?.map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {payment.customerName}
                                    <span className="block text-xs text-gray-400">Order #{payment.orderNo}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-none 
                                        ${payment.method === 'UPI' ? 'bg-purple-100 text-purple-700' : 
                                          payment.method === 'Cash' ? 'bg-green-100 text-green-700' : 
                                          'bg-gray-100 text-gray-600'}`}>
                                        {payment.method || 'Gen'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                    {formatCurrency(payment.amount)}
                                </td>
                            </tr>
                        ))}
                         {!payments?.length && (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No payments.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
      </div>

        {/* Audit Log / Recent Activities */}
        <div className="bg-white shadow-sm border border-gray-200 h-fit">
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div className="p-0">
                <ul className="divide-y divide-gray-100">
                    {activities?.map((log) => (
                        <li key={log.id} className="px-2 py-2 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-2">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 
                                    ${log.action === 'CREATE' ? 'bg-green-500' : 
                                      log.action === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-800 leading-snug truncate">
                                        <span className="font-semibold">{log.user?.username || 'System'}</span> 
                                        {' '}{log.action.toLowerCase()}d 
                                        {' '}<span className="font-medium">{log.resource}</span>
                                    </p>
                                </div>
                                <div className="text-[9px] text-gray-400 whitespace-nowrap">
                                    {format(new Date(log.createdAt), 'hh:mm a')}
                                </div>
                            </div>
                        </li>
                    ))}
                    {!activities?.length && (
                         <li className="px-4 py-4 text-center text-gray-400 text-xs">No recent activity</li>
                    )}
                </ul>
            </div>
        </div>
    </div>
  );
}
