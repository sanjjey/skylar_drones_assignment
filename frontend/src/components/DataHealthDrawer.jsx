import React from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  FileSpreadsheet,
  Key,
  Info
} from 'lucide-react';

export default function DataHealthDrawer({ isOpen, onClose, syncStatus, onSync, isSyncing }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Data Resilience & Governance</h3>
              <p className="text-[11px] text-slate-400">Live Monday.com Data Quality Audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Connection Status Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Sync Status</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${
                syncStatus?.is_live_connected 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {syncStatus?.is_live_connected ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>{syncStatus?.is_live_connected ? 'Monday.com: LIVE' : 'Local Fallback Active'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Last Synchronized</span>
              <span className="text-slate-200 font-mono">
                {syncStatus?.last_sync ? new Date(syncStatus.last_sync).toLocaleTimeString() : 'Never'}
              </span>
            </div>

            {/* Error / Warning Notice if any */}
            {syncStatus?.last_error && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Monday.com Live Sync Error:</span>
                </div>
                <div className="font-mono text-[10px] break-all">{syncStatus.last_error}</div>
              </div>
            )}

            {!syncStatus?.is_live_connected && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  <span>How to activate Monday.com Live Sync:</span>
                </div>
                <p>
                  Add your <strong>MONDAY_API_KEY</strong> and Board IDs in <code className="text-blue-400">backend/.env</code>:
                </p>
                <pre className="p-2 rounded bg-slate-950 text-slate-300 font-mono text-[10px] overflow-x-auto border border-slate-800">
{`MONDAY_API_KEY=your_token_here
MONDAY_DEALS_BOARD_ID=123456789
MONDAY_WORK_ORDERS_BOARD_ID=987654321`}
                </pre>
              </div>
            )}

            <button
              onClick={onSync}
              disabled={isSyncing}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isSyncing ? 'Re-syncing Boards...' : 'Refresh / Force Sync'}</span>
            </button>
          </div>

          {/* Quality Scores */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Data Quality Scores</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Deals Board</span>
                </div>
                <div className="text-xl font-bold text-slate-100">{syncStatus?.deals_quality_score || 95}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{syncStatus?.deals_count} records audited</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Work Orders Board</span>
                </div>
                <div className="text-xl font-bold text-slate-100">{syncStatus?.wo_quality_score || 92}%</div>
                <div className="text-[10px] text-slate-500">{syncStatus?.work_orders_count} records audited</div>
              </div>
            </div>
          </div>

          {/* Active Data Resilience Caveats */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Data Quality Caveats</span>
            </h4>
            <div className="space-y-2">
              {syncStatus?.deals_caveats?.map((c, i) => (
                <div key={`d-${i}`} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300 text-xs flex gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>[Deals]</strong> {c}</span>
                </div>
              ))}
              {syncStatus?.wo_caveats?.map((c, i) => (
                <div key={`w-${i}`} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300 text-xs flex gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>[Work Orders]</strong> {c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Data Cleaning Pipeline info */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-slate-400 leading-relaxed">
            <h5 className="font-bold text-slate-300 text-xs">Automated Normalization Applied:</h5>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li><strong>Currency / Numbers:</strong> Stripped symbols (₹, $, commas) & unparsed dashes.</li>
              <li><strong>Dates:</strong> Normalized multiple date formats into ISO standard and computed Fiscal/Calendar quarters.</li>
              <li><strong>Sector Harmonization:</strong> Unified messy labels (e.g. <em>Powerline</em> & <em>Energy</em> into <em>Energy & Powerlines</em>).</li>
              <li><strong>Cross-Board Keying:</strong> Linked Deals to Work Orders via masked deal names and customer codes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
