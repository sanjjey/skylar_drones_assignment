import React from 'react';
import { 
  Bot, 
  RefreshCw, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  MessageSquare,
  BarChart3
} from 'lucide-react';

export default function Header({ 
  activeTab,
  onTabChange,
  syncStatus, 
  onSync, 
  isSyncing, 
  onOpenLeadership, 
  onOpenDataHealth 
}) {
  const isLive = syncStatus?.is_live_connected;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base text-slate-100 tracking-tight">Skylark Drones</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
              Executive BI Agent
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Founder & Executive Intelligence Engine</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
        <button
          onClick={() => onTabChange('agent')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'agent'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Executive AI Agent</span>
        </button>

        <button
          onClick={() => onTabChange('explorer')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'explorer'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Interactive Board Explorer</span>
        </button>
      </div>

      {/* Status Badges & Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Monday.com Connection Badge */}
        <div 
          onClick={onOpenDataHealth}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
            isLive 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="Click to view data health & quality audit"
        >
          {isLive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Monday.com: <strong className="font-semibold">Live Connected</strong></span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Monday.com: <strong className="font-semibold">Local Fallback Active</strong></span>
            </>
          )}
        </div>

        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 transition cursor-pointer"
          title="Refresh board data dynamically"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Data Quality & Caveats Button */}
        <button
          onClick={onOpenDataHealth}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          title="Inspect data lineage and messy data caveats"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span>Governance</span>
        </button>

        {/* Leadership Update One-Click Button */}
        <button
          onClick={onOpenLeadership}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Leadership Briefing</span>
        </button>
      </div>
    </header>
  );
}
