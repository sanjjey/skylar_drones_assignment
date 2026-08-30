import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  ShieldAlert,
  Printer
} from 'lucide-react';
import { API_BASE } from '../config';

export default function LeadershipModal({ isOpen, onClose }) {
  const [briefing, setBriefing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`${API_BASE}/api/leadership/briefing`)
        .then(res => res.json())
        .then(data => {
          setBriefing(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load leadership briefing:", err);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!briefing) return;
    const textToCopy = `
# ${briefing.title}
Generated: ${briefing.generated_at}
Data Source: ${briefing.data_source}

## EXECUTIVE SUMMARY
${briefing.executive_summary}

## HEADLINE METRICS
- Active Pipeline: ${briefing.headline_kpis.active_pipeline}
- Weighted Pipeline: ${briefing.headline_kpis.weighted_pipeline}
- Closed Won Bookings: ${briefing.headline_kpis.closed_won_value}
- Contracted Operations: ${briefing.headline_kpis.contracted_operations}
- Cash Collected: ${briefing.headline_kpis.collected_revenue}
- Outstanding AR: ${briefing.headline_kpis.outstanding_ar}
- Collection Efficiency: ${briefing.headline_kpis.collection_efficiency}
- Software Attach Rate: ${briefing.headline_kpis.software_attach_rate}

## STRATEGIC RISKS & BLOCKERS
${briefing.strategic_risks_and_blockers.map(r => `• ${r}`).join('\n')}

## RECOMMENDED LEADERSHIP ACTIONS
${briefing.recommended_actions.map(a => `• ${a}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Executive Leadership Briefing</h3>
              <p className="text-xs text-slate-400">Synthesized cross-board intelligence for founder & board updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading || !briefing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Memo'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Print Briefing"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span>Synthesizing Leadership Briefing from live board data...</span>
            </div>
          ) : briefing ? (
            <>
              {/* Meta timestamp */}
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Generated on <strong>{briefing.generated_at}</strong></span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {briefing.data_source}
                </span>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-900/40 text-slate-200 leading-relaxed">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Executive Summary</span>
                </div>
                <p>{briefing.executive_summary}</p>
              </div>

              {/* Headline KPIs Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Core Performance Pillars</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Active Pipeline</div>
                    <div className="text-base font-bold text-blue-400 mt-0.5">{briefing.headline_kpis.active_pipeline}</div>
                    <div className="text-[10px] text-slate-500">W: {briefing.headline_kpis.weighted_pipeline}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Won Bookings</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">{briefing.headline_kpis.closed_won_value}</div>
                    <div className="text-[10px] text-slate-500">Historical Sales</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Cash Realized</div>
                    <div className="text-base font-bold text-teal-400 mt-0.5">{briefing.headline_kpis.collected_revenue}</div>
                    <div className="text-[10px] text-slate-500">{briefing.headline_kpis.collection_efficiency} efficiency</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Outstanding AR</div>
                    <div className="text-base font-bold text-rose-400 mt-0.5">{briefing.headline_kpis.outstanding_ar}</div>
                    <div className="text-[10px] text-slate-500">Uncollected balance</div>
                  </div>
                </div>
              </div>

              {/* Sector Performance Highlights */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sector Pipeline Breakdown</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Sector</th>
                        <th className="py-2.5 px-3 font-semibold">Open Deals</th>
                        <th className="py-2.5 px-3 font-semibold">Pipeline Value</th>
                        <th className="py-2.5 px-3 font-semibold">Weighted Value</th>
                        <th className="py-2.5 px-3 font-semibold">Win Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {briefing.sector_highlights.map((sec, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-medium text-slate-200">{sec.sector}</td>
                          <td className="py-2 px-3">{sec.open_deals}</td>
                          <td className="py-2 px-3 text-blue-400 font-semibold">{sec.pipeline_value}</td>
                          <td className="py-2 px-3 text-emerald-400">{sec.weighted_value}</td>
                          <td className="py-2 px-3">{sec.avg_win_prob}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategic Risk Radar */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Strategic Risk Radar & Execution Blockers</span>
                </div>
                <div className="space-y-1.5 text-xs text-rose-200">
                  {briefing.strategic_risks_and_blockers.map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Leadership Actions */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Recommended Leadership Actions</span>
                </div>
                <div className="space-y-1.5 text-xs text-emerald-200">
                  {briefing.recommended_actions.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-400">Unable to generate leadership update.</div>
          )}
        </div>
      </div>
    </div>
  );
}
