import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  CreditCard, 
  Layers, 
  AlertOctagon,
  Percent
} from 'lucide-react';

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${Number(val).toLocaleString('en-IN')}`;
}

export default function KpiRibbon({ kpis, isLoading }) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 px-4 lg:px-8 py-3 bg-slate-900/40 border-b border-slate-800">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const { pipeline, financials, operations } = kpis;

  const cards = [
    {
      label: 'Open Pipeline',
      value: formatCurrency(pipeline?.total_open_value),
      subtext: `${pipeline?.open_deals_count || 0} active deals`,
      icon: TrendingUp,
      accent: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20'
    },
    {
      label: 'Weighted Pipeline',
      value: formatCurrency(pipeline?.weighted_value),
      subtext: `Confidence adjusted`,
      icon: Percent,
      accent: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20'
    },
    {
      label: 'Closed Won',
      value: formatCurrency(pipeline?.won_deals_value),
      subtext: `${pipeline?.win_rate_percent}% win rate`,
      icon: Briefcase,
      accent: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20'
    },
    {
      label: 'Contracted Ops',
      value: formatCurrency(financials?.contracted_value),
      subtext: `${operations?.total_work_orders} work orders`,
      icon: Layers,
      accent: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/20'
    },
    {
      label: 'Cash Collected',
      value: formatCurrency(financials?.collected_cash),
      subtext: `${financials?.collection_efficiency_percent}% of billed`,
      icon: DollarSign,
      accent: 'from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/20'
    },
    {
      label: 'Outstanding AR',
      value: formatCurrency(financials?.outstanding_ar),
      subtext: 'Uncollected invoices',
      icon: AlertOctagon,
      accent: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/20'
    },
    {
      label: 'Software Attach',
      value: `${operations?.software_adoption_percent}%`,
      subtext: `${operations?.software_enabled_orders} orders enabled`,
      icon: CreditCard,
      accent: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 px-4 lg:px-8 py-3 bg-slate-900/40 border-b border-slate-800/80">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3 rounded-xl border bg-gradient-to-b ${card.accent} flex flex-col justify-between transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="truncate">{card.label}</span>
              <Icon className="w-3.5 h-3.5 opacity-80 shrink-0" />
            </div>
            <div className="mt-1">
              <div className="text-base lg:text-lg font-bold text-slate-100 tracking-tight">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
