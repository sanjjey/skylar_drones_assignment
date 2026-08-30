import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart2, 
  TrendingUp, 
  PieChart as PieIcon, 
  Table as TableIcon, 
  LayoutGrid, 
  Download 
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export default function MultiViewVisualizer({ chartData }) {
  // Respect the requested chart type (pie, bar, area, table, cards)
  const initialMode = chartData?.defaultView || chartData?.type || 'bar';
  const [viewMode, setViewMode] = useState(initialMode);

  useEffect(() => {
    if (chartData?.defaultView || chartData?.type) {
      setViewMode(chartData.defaultView || chartData.type);
    }
  }, [chartData]);

  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return null;
  }

  const { title, data, xKey = 'name', bars } = chartData;

  // Extract metric keys
  const sampleItem = data[0] || {};
  const metricKeys = bars 
    ? bars.map(b => b.key) 
    : Object.keys(sampleItem).filter(k => k !== xKey && typeof sampleItem[k] === 'number');

  const primaryKey = metricKeys[0] || 'Value';

  const formatVal = (val) => {
    if (typeof val !== 'number') return val;
    return val.toLocaleString('en-IN');
  };

  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = [xKey, ...metricKeys].join(',');
    const rows = data.map(row => [row[xKey], ...metricKeys.map(k => row[k] ?? '')].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
      {/* Visualizer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          <span>{title}</span>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('bar')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              viewMode === 'bar' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bar Chart View"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bar</span>
          </button>
          <button
            onClick={() => setViewMode('area')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              viewMode === 'area' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Trend Area Chart View"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trend</span>
          </button>
          <button
            onClick={() => setViewMode('pie')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              viewMode === 'pie' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Donut / Distribution View"
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pie / Donut</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              viewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tabular Data View"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Key Metric Cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Metrics</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main View Container */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80">
        {/* 1. Bar Chart View */}
        {viewMode === 'bar' && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey={xKey} 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end" 
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {bars ? (
                  bars.map((b, bi) => (
                    <Bar key={bi} dataKey={b.key} fill={b.color} radius={[4, 4, 0, 0]} />
                  ))
                ) : (
                  <Bar dataKey={primaryKey} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 2. Area Trend Chart View */}
        {viewMode === 'area' && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey={xKey} 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end" 
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey={primaryKey} stroke="#3B82F6" fillOpacity={1} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 3. Donut / Pie View */}
        {viewMode === 'pie' && (
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey={primaryKey}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name ? name.substring(0, 12) : ''} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 4. Tabular Data View */}
        {viewMode === 'table' && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 font-semibold">{xKey}</th>
                  {metricKeys.map((k, ki) => (
                    <th key={ki} className="py-2 px-3 font-semibold text-right">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-medium text-slate-200">{row[xKey]}</td>
                    {metricKeys.map((k, ki) => (
                      <td key={ki} className="py-2 px-3 text-right font-mono text-blue-400">
                        {formatVal(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Key Metrics Cards */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto">
            {data.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400 truncate">{item[xKey]}</div>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {formatVal(item[primaryKey])}
                </div>
                {metricKeys[1] && (
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    {metricKeys[1]}: {formatVal(item[metricKeys[1]])}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
