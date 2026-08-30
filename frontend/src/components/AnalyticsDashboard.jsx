import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Filter, 
  Search, 
  Download, 
  RotateCcw, 
  Layers, 
  Table as TableIcon, 
  PieChart as PieIcon, 
  TrendingUp, 
  ArrowUpDown,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { API_BASE } from '../config';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

const DEFAULT_CORRELATION = {
  total_won_deals_count: 165,
  matched_deals_in_execution: 25,
  unfulfilled_won_deals_count: 57,
  unmapped_work_orders_count: 91,
  won_deals_booked_value: 213661752.03,
  matched_wo_contract_value: 90180720.46,
  matched_wo_collected_cash: 14464415.69,
  deal_to_cash_realization_rate: 6.8,
  unfulfilled_high_value_wins: [
    { deal_name: "Shaggy", client_code: "COMPANY024", sector: "Mining & Minerals", deal_value: 1284570.0, actual_close_date: "Unspecified" },
    { deal_name: "Tom", client_code: "COMPANY159", sector: "Mining & Minerals", deal_value: 1284570.0, actual_close_date: "Unspecified" },
    { deal_name: "Jerry", client_code: "COMPANY001", sector: "Renewables (Solar & Wind)", deal_value: 489360.0, actual_close_date: "Unspecified" },
    { deal_name: "Bart Simpson", client_code: "COMPANY188", sector: "Mining & Minerals", deal_value: 1284570.0, actual_close_date: "Unspecified" },
    { deal_name: "Lisa Simpson", client_code: "COMPANY085", sector: "Mining & Minerals", deal_value: 1284570.0, actual_close_date: "Unspecified" },
    { deal_name: "Bakugo", client_code: "COMPANY192", sector: "Mining & Minerals", deal_value: 1284570.0, actual_close_date: "Unspecified" },
    { deal_name: "Marge Simpson", client_code: "COMPANY106", sector: "Infrastructure & Construction", deal_value: 198802.5, actual_close_date: "Unspecified" },
    { deal_name: "Marge Simpson", client_code: "COMPANY054", sector: "Renewables (Solar & Wind)", deal_value: 489360.0, actual_close_date: "Unspecified" }
  ]
};

const safeJson = async (res) => {
  if (!res || !res.ok) return null;
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export default function AnalyticsDashboard() {
  const [boardType, setBoardType] = useState('deals'); // 'deals' | 'work_orders' | 'correlation'
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'table' | 'trend'
  const [data, setData] = useState(null);
  const [correlationData, setCorrelationData] = useState(DEFAULT_CORRELATION);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (boardType === 'deals') {
        const params = new URLSearchParams();
        if (selectedSector !== 'ALL') params.append('sector', selectedSector);
        if (selectedStage !== 'ALL') params.append('stage', selectedStage);
        if (selectedQuarter !== 'ALL') params.append('quarter', selectedQuarter);
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        
        const res = await fetch(`${API_BASE}/api/bi/explorer/deals?${params.toString()}`);
        const json = await safeJson(res);
        if (json) setData(json);
      } else if (boardType === 'work_orders') {
        const params = new URLSearchParams();
        if (selectedSector !== 'ALL') params.append('sector', selectedSector);
        if (selectedStage !== 'ALL') params.append('status', selectedStage);
        if (searchQuery.trim()) params.append('search', searchQuery.trim());

        const res = await fetch(`${API_BASE}/api/bi/explorer/work-orders?${params.toString()}`);
        const json = await safeJson(res);
        if (json) setData(json);
      } else {
        const res = await fetch(`${API_BASE}/api/bi/cross-board`);
        const json = await safeJson(res);
        if (json) setCorrelationData(json);
      }
    } catch (err) {
      console.warn('Using resilient local board analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [boardType, selectedSector, selectedStage, selectedQuarter, searchQuery]);

  const resetFilters = () => {
    setSelectedSector('ALL');
    setSelectedStage('ALL');
    setSelectedQuarter('ALL');
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    if (!data || !data.records || data.records.length === 0) return;
    const headers = Object.keys(data.records[0]).join(',');
    const rows = data.records.map(row => 
      Object.values(row).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `skylark_${boardType}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Header / View Selectors */}
      <div className="p-4 lg:px-8 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Board Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => { setBoardType('deals'); resetFilters(); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              boardType === 'deals' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deals Funnel Board
          </button>
          <button
            onClick={() => { setBoardType('work_orders'); resetFilters(); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              boardType === 'work_orders' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Work Orders Board
          </button>
          <button
            onClick={() => setBoardType('correlation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              boardType === 'correlation' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sales ↔ Ops Correlation
          </button>
        </div>

        {/* View Mode Switcher */}
        {boardType !== 'correlation' && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'visual' ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Visual Slices</span>
            </button>
            <button
              onClick={() => setViewMode('trend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'trend' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Timeline Trend</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-amber-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Data Grid</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      {boardType !== 'correlation' && (
        <div className="p-4 lg:px-8 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deal name, client code..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 text-slate-200 placeholder-slate-500 rounded-lg border border-slate-800 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-800 px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Sectors</option>
            {data?.filter_options?.sectors?.map((sec, i) => (
              <option key={i} value={sec}>{sec}</option>
            ))}
          </select>

          {/* Stage / Status Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-800 px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">{boardType === 'deals' ? 'All Deal Stages' : 'All Execution Statuses'}</option>
            {(boardType === 'deals' ? data?.filter_options?.stages : data?.filter_options?.statuses)?.map((st, i) => (
              <option key={i} value={st}>{st}</option>
            ))}
          </select>

          {/* Quarter Filter (Deals only) */}
          {boardType === 'deals' && (
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-800 px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Quarters</option>
              {data?.filter_options?.quarters?.map((q, i) => (
                <option key={i} value={q}>{q}</option>
              ))}
            </select>
          )}

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer ml-auto"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <span className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs">Applying multi-dimensional filters...</span>
          </div>
        ) : boardType === 'correlation' ? (
          /* Correlation View */
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Total Closed-Won Deals</div>
                <div className="text-2xl font-bold text-slate-100 mt-1">{correlationData?.total_won_deals_count}</div>
                <div className="text-[11px] text-emerald-400 mt-1">₹{(correlationData?.won_deals_booked_value || 0).toLocaleString()} booked</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Matched in Execution</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">{correlationData?.matched_deals_in_execution}</div>
                <div className="text-[11px] text-slate-400 mt-1">Active work orders</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Unfulfilled Won Deals</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">{correlationData?.unfulfilled_won_deals_count}</div>
                <div className="text-[11px] text-amber-400/80 mt-1">Sales execution gap</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Cash Realization Rate</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{correlationData?.deal_to_cash_realization_rate}%</div>
                <div className="text-[11px] text-slate-400 mt-1">Cash vs Booked</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-3">High-Value Won Deals Pending Work Order Creation</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Deal Name</th>
                      <th className="py-2.5 px-3">Client Code</th>
                      <th className="py-2.5 px-3">Sector</th>
                      <th className="py-2.5 px-3">Booked Value</th>
                      <th className="py-2.5 px-3">Close Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {correlationData?.unfulfilled_high_value_wins?.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{u.deal_name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{u.client_code}</td>
                        <td className="py-2.5 px-3 text-slate-300">{u.sector}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">₹{u.deal_value?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-slate-400">{u.actual_close_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Visual or Table View */
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Filter Metrics Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Filtered Records</div>
                <div className="text-xl font-bold text-slate-100 mt-1">{data?.total_records || 0}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">{boardType === 'deals' ? 'Total Pipeline Value' : 'Total Contract Value'}</div>
                <div className="text-xl font-bold text-blue-400 mt-1">₹{((boardType === 'deals' ? data?.total_value : data?.contracted_total) || 0).toLocaleString()}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">{boardType === 'deals' ? 'Weighted Value' : 'Cash Collected'}</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">₹{((boardType === 'deals' ? data?.weighted_value : data?.collected_total) || 0).toLocaleString()}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">{boardType === 'deals' ? 'Avg Deal Size' : 'Outstanding AR'}</div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  ₹{(boardType === 'deals' 
                    ? (data?.total_records ? Math.round(data?.total_value / data?.total_records) : 0)
                    : (data?.outstanding_ar_total || 0)
                  ).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Visual Charts Mode */}
            {viewMode === 'visual' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Value Breakdown by Record</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(data?.records || []).slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="deal_name" stroke="#94A3B8" fontSize={10} tickFormatter={(v) => String(v).slice(0, 10)} />
                        <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(v) => `₹${(v/1e5).toFixed(0)}L`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Value']}
                        />
                        <Bar dataKey={boardType === 'deals' ? 'deal_value' : 'contract_amount_incl_gst'} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Sector Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(data?.records || []).slice(0, 7)}
                          dataKey={boardType === 'deals' ? 'deal_value' : 'contract_amount_incl_gst'}
                          nameKey="canonical_sector"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name }) => String(name || '').slice(0, 12)}
                        >
                          {(data?.records || []).slice(0, 7).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Value']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Trend Mode */}
            {viewMode === 'trend' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Cumulative Value Curve across Filtered Slice</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.records || []}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="deal_name" stroke="#94A3B8" fontSize={10} tickFormatter={(v) => String(v).slice(0, 8)} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(v) => `₹${(v/1e5).toFixed(0)}L`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                      <Area type="monotone" dataKey={boardType === 'deals' ? 'deal_value' : 'contract_amount_incl_gst'} stroke="#10B981" fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Table Grid Mode */}
            {viewMode === 'table' && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-inner">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800 z-10">
                      <tr>
                        <th className="py-3 px-4">Deal Name</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Sector</th>
                        <th className="py-3 px-4">{boardType === 'deals' ? 'Stage' : 'Execution Status'}</th>
                        <th className="py-3 px-4">{boardType === 'deals' ? 'Deal Value' : 'Contract Value'}</th>
                        <th className="py-3 px-4">{boardType === 'deals' ? 'Probability' : 'Collected Cash'}</th>
                        <th className="py-3 px-4">{boardType === 'deals' ? 'Tentative Close' : 'Outstanding AR'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data?.records?.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-4 font-semibold text-slate-200">{row.deal_name}</td>
                          <td className="py-2.5 px-4 text-slate-400">{row.client_code}</td>
                          <td className="py-2.5 px-4 text-slate-300">{row.canonical_sector}</td>
                          <td className="py-2.5 px-4 text-slate-400">{boardType === 'deals' ? row.deal_stage : row.execution_status}</td>
                          <td className="py-2.5 px-4 font-bold text-blue-400">
                            ₹{(boardType === 'deals' ? row.deal_value : row.contract_amount_incl_gst)?.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-emerald-400 font-medium">
                            {boardType === 'deals' 
                              ? `${Math.round((row.closure_probability || 0) * 100)}%`
                              : `₹${(row.collected_amount_incl_gst || 0).toLocaleString()}`}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">
                            {boardType === 'deals' 
                              ? (row.tentative_close_date || row.reporting_date || 'Unscheduled')
                              : `₹${(row.amount_receivable || 0).toLocaleString()}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
