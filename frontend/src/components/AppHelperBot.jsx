import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  X, 
  Sparkles, 
  Send, 
  ArrowRight, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Database, 
  RefreshCw,
  MessageSquare,
  HelpCircle,
  BarChart2
} from 'lucide-react';

const HELPER_KNOWLEDGE = [
  {
    triggers: ["missing", "impute", "empty", "null"],
    answer: "🛡️ **How Missing Values Are Handled**: Our Two-Way Cross-Board Engine derives unstated deal values from matching Work Order contracts or Sector Medians, estimates win probabilities from sales stages (Lead=10%, Proposal=60%, Negotiation=80%), and calculates AR as `Billed - Collected`."
  },
  {
    triggers: ["chart", "pie", "bar", "view", "visualizer", "represent"],
    answer: "📊 **Multi-View Visualizer**: You can ask for specific chart formats (e.g. *'Generate pie chart of execution status'* or *'Trend of tentative dates'*). You can also click the view switcher icons on any generated chart to flip between Bar, Trend Area, Donut Pie, Data Table, and Metric Cards!"
  },
  {
    triggers: ["undo", "edit", "rename", "session"],
    answer: "✏️ **Chat Management**: You can rename any conversation in the left sidebar by clicking the pencil icon. Inside any chat, click **'Undo Last'** to revert your last prompt, or hover over any of your sent messages and click **'Edit'** to tweak and re-run your inquiry!"
  },
  {
    triggers: ["filter", "search", "explorer", "board"],
    answer: "🔍 **Interactive Board Explorer**: Click the **'📊 Interactive Board Explorer'** tab in the top navigation to filter Deals and Work Orders across Sectors, Stages, Quarters, and Client Codes with live charts and CSV export."
  },
  {
    triggers: ["supabase", "save", "sync", "database"],
    answer: "🗄️ **Supabase Cloud Persistence**: Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `backend/.env` and run `supabase_schema.sql` to sync conversations to PostgreSQL. If unconfigured, the app runs smoothly with local in-memory storage."
  },
  {
    triggers: ["leadership", "briefing", "memo", "executive"],
    answer: "📋 **Executive Leadership Briefing**: Click the **'Leadership Briefing'** button in the header or ask the agent *'Prepare data for leadership update'* to generate a 4-pillar executive memo with KPIs, risks, and strategic actions."
  }
];

export default function AppHelperBot({ 
  onNavigateTab, 
  onOpenLeadership, 
  onOpenDataHealth, 
  onTriggerSync 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "👋 Hi! I'm **Skylark App Navigator**. I help you explore features, shortcuts, and capabilities across the platform. What would you like to explore?"
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const userQ = input.trim();
    setInput('');

    const newMsgs = [...messages, { sender: 'user', text: userQ }];
    setMessages(newMsgs);

    // Contextual matching
    const qLower = userQ.toLowerCase();
    let reply = "I can help you navigate! You can switch between the **Executive AI Agent** and the **Interactive Board Explorer**, generate **Leadership Briefings**, or ask me about chart controls and missing value algorithms.";

    for (const item of HELPER_KNOWLEDGE) {
      if (item.triggers.some(t => qLower.includes(t))) {
        reply = item.answer;
        break;
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 300);
  };

  return (
    <>
      {/* Floating Bottom Right Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 border border-white/20 transition-all duration-200 hover:scale-105 cursor-pointer"
        title="Open Application Navigator & Feature Guide"
      >
        <Compass className="w-5 h-5 animate-spin-slow" />
        <span className="text-xs font-bold tracking-wide">App Navigator</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>

      {/* Floating Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100">App Navigator & Helper</h3>
                <p className="text-[10px] text-slate-400">Features, guides & quick launchers</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-1.5 text-[11px]">
            <button
              onClick={() => { onNavigateTab('agent'); setIsOpen(false); }}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 flex items-center gap-1 transition cursor-pointer"
            >
              <MessageSquare className="w-3 h-3" />
              <span>AI Agent</span>
            </button>
            <button
              onClick={() => { onNavigateTab('explorer'); setIsOpen(false); }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 transition cursor-pointer"
            >
              <BarChart2 className="w-3 h-3" />
              <span>Board Explorer</span>
            </button>
            <button
              onClick={() => { onOpenLeadership(); setIsOpen(false); }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 flex items-center gap-1 transition cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>Leadership Briefing</span>
            </button>
            <button
              onClick={() => { onOpenDataHealth(); setIsOpen(false); }}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 flex items-center gap-1 transition cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Data Health</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Frequently Asked Inquiries Chips */}
          <div className="px-3 py-2 bg-slate-950/40 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="text-slate-500 uppercase font-bold shrink-0">Ask:</span>
            <button
              onClick={() => setInput("How are missing values handled?")}
              className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
            >
              Missing Values
            </button>
            <button
              onClick={() => setInput("How do I edit or undo messages?")}
              className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
            >
              Undo / Edit
            </button>
            <button
              onClick={() => setInput("How do I filter boards?")}
              className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
            >
              Filter Boards
            </button>
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask how any feature works..."
              className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-xs border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
