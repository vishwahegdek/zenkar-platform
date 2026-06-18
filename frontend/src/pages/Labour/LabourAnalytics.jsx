import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { 
  format, subDays, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, addDays, addWeeks, 
  addMonths, subWeeks, subMonths 
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Activity, 
  Users, UserCheck, CalendarDays, BarChart2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

export default function LabourAnalytics() {
  const [rangeType, setRangeType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [chartTimeframe, setChartTimeframe] = useState('day');
  const [showChart, setShowChart] = useState(true);
  const [selectedLabourer, setSelectedLabourer] = useState('All');

  const { from, to, label } = useMemo(() => {
    const anchor = selectedDate;
    switch (rangeType) {
      case 'today':
        const day = format(anchor, 'yyyy-MM-dd');
        return { from: day, to: day, label: format(anchor, 'EEEE, MMM d, yyyy') };
      case 'week': {
        const start = startOfWeek(anchor, { weekStartsOn: 1 });
        const end = endOfWeek(anchor, { weekStartsOn: 1 });
        return { 
          from: format(start, 'yyyy-MM-dd'), 
          to: format(end, 'yyyy-MM-dd'),
          label: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
        };
      }
      case 'month': {
        const start = startOfMonth(anchor);
        const end = endOfMonth(anchor);
        return { 
          from: format(start, 'yyyy-MM-dd'), 
          to: format(end, 'yyyy-MM-dd'),
          label: format(anchor, 'MMMM yyyy')
        };
      }
      case 'custom':
        return {
          from: customFrom,
          to: customTo,
          label: 'Custom Range'
        };
      default:
        return { from: format(anchor, 'yyyy-MM-dd'), to: format(anchor, 'yyyy-MM-dd'), label: '' };
    }
  }, [rangeType, selectedDate, customFrom, customTo]);

  const handlePrevious = () => {
    switch(rangeType) {
        case 'today': setSelectedDate(d => subDays(d, 1)); break;
        case 'week': setSelectedDate(d => subWeeks(d, 1)); break;
        case 'month': setSelectedDate(d => subMonths(d, 1)); break;
        default: break;
    }
  };

  const handleNext = () => {
    switch(rangeType) {
        case 'today': setSelectedDate(d => addDays(d, 1)); break;
        case 'week': setSelectedDate(d => addWeeks(d, 1)); break;
        case 'month': setSelectedDate(d => addMonths(d, 1)); break;
        default: break;
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['labourAnalytics', from, to, chartTimeframe, selectedLabourer],
    queryFn: () => api.get(`/labour/analytics?from=${from}&to=${to}${selectedLabourer !== 'All' ? `&labourerId=${selectedLabourer}` : ''}`),
  });

  const { data: labourers } = useQuery({
    queryKey: ['labourers'],
    queryFn: () => api.get('/labour'),
  });

  const displayTrend = useMemo(() => {
    if (!data?.trend) return [];
    
    // Aggregate trend based on timeframe
    if (chartTimeframe === 'day') return data.trend;

    const buckets = new Map();
    data.trend.forEach(t => {
      const d = new Date(t.date);
      let key = t.date;
      if (chartTimeframe === 'month') {
        key = t.date.slice(0, 7);
      } else if (chartTimeframe === 'week') {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        key = monday.toISOString().slice(0, 10);
      }
      buckets.set(key, (buckets.get(key) || 0) + t.attendance);
    });

    return Array.from(buckets.entries())
      .map(([date, attendance]) => ({ date, attendance }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data?.trend, chartTimeframe]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-8 font-sans">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Attendance Analytics</h1>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto">
                {['today', 'week', 'month', 'custom'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRangeType(mode)}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                      rangeType === mode
                        ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {mode === 'today' ? 'Day' : mode}
                  </button>
                ))}
              </div>

              {rangeType === 'custom' ? (
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full sm:w-auto justify-between text-sm">
                  <input 
                    type="date" 
                    value={customFrom} 
                    onChange={e => setCustomFrom(e.target.value)} 
                    className="outline-none bg-transparent px-2 py-1 font-medium text-slate-700 cursor-pointer" 
                  />
                  <span className="text-slate-400 font-medium">-</span>
                  <input 
                    type="date" 
                    value={customTo} 
                    onChange={e => setCustomTo(e.target.value)} 
                    className="outline-none bg-transparent px-2 py-1 font-medium text-slate-700 cursor-pointer" 
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full sm:w-auto justify-between">
                  <button onClick={handlePrevious} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-bold text-slate-700 min-w-[150px] text-center">
                    {label}
                  </span>
                  <button onClick={handleNext} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Total Man-Days</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {isLoading ? '...' : data?.summary?.totalManDays || 0}
                </h3>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Attendance Rate</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {isLoading ? '...' : `${data?.summary?.attendancePercentage || 0}%`}
                </h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Avg Daily Att.</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {isLoading ? '...' : data?.summary?.averageDailyAttendance || 0}
                </h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Active Labourers</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {isLoading ? '...' : data?.summary?.activeLabourers || 0}
                </h3>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">Filter by Labourer:</span>
          <select 
            value={selectedLabourer}
            onChange={(e) => setSelectedLabourer(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-slate-700 focus:ring-green-500 focus:border-green-500 bg-slate-50 outline-none"
          >
            <option value="All">All Labourers</option>
            {labourers?.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-4 flex items-center justify-between border-b border-gray-50">
                 <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-gray-400" />
                    <span>Attendance Trend</span>
                 </h2>
                 <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowChart(!showChart)}
                        className="text-xs font-medium text-green-600 md:hidden"
                    >
                        {showChart ? 'Hide' : 'Show'}
                    </button>
                    {showChart && (
                        <div className="flex bg-gray-100 p-0.5 rounded-lg">
                            {['day', 'week', 'month'].map(tf => (
                            <button
                                key={tf}
                                onClick={() => setChartTimeframe(tf)}
                                className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md transition-all ${
                                chartTimeframe === tf ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'
                                }`}
                            >
                                {tf}
                            </button>
                            ))}
                        </div>
                    )}
                 </div>
             </div>
             
             {showChart && (
                <div className="h-72 w-full p-4 animate-in slide-in-from-top-2 duration-300">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
                    </div>
                  ) : displayTrend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={10} 
                          tickFormatter={(val) => {
                              const d = new Date(val);
                              if (chartTimeframe === 'month') return format(d, 'MMM yy');
                              return format(d, 'dd MMM');
                          }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis 
                          fontSize={10} 
                          axisLine={false}
                          tickLine={false}
                          dx={-10}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = new Date(label);
                              let dateText = format(d, 'dd MMM yyyy');
                              if (chartTimeframe === 'month') dateText = format(d, 'MMMM yyyy');
                              if (chartTimeframe === 'week') dateText = format(d, 'dd MMM yyyy');

                              return (
                                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
                                  <p className="text-sm font-bold text-slate-700 mb-1">{dateText}</p>
                                  <p className="text-sm font-semibold" style={{ color: payload[0].value === 0 ? '#EF4444' : '#10B981' }}>
                                    Attendance: {payload[0].value} Days
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="attendance" radius={[4, 4, 0, 0]} minPointSize={3}>
                          {displayTrend.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.attendance === 0 ? '#EF4444' : '#10B981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center flex-col text-slate-400">
                      <Activity className="w-12 h-12 mb-3 opacity-20" />
                      <p>No attendance data for this period</p>
                    </div>
                  )}
                </div>
             )}
          </div>

          {/* Top Regular Labourers */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-800">All Labourers Regularity</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-100">
                  <tr className="text-slate-500">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold text-right">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan="2" className="px-4 py-6 text-center text-slate-400">Loading...</td>
                    </tr>
                  ) : data?.byLabourer?.length > 0 ? (
                    data.byLabourer.map((lab, idx) => (
                      <tr key={lab.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-700">{lab.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {lab.totalDays}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-4 py-6 text-center text-slate-400">No attendance data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
