import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ShieldAlert, 
  HelpCircle, 
  ArrowRight,
  Undo2,
  Edit3
} from 'lucide-react';
import MultiViewVisualizer from './MultiViewVisualizer';

const STARTER_PROMPTS = [
  "How are the missing values handled in our dataset?",
  "Can you show the tentative dates for different sectors using trend",
  "How's our pipeline looking for the energy sector this quarter?",
  "What is our total outstanding AR and which accounts are top priority?",
  "Generate pie chart of work orders by execution status",
  "Correlate our closed-won deals with work order execution status."
];

export default function ChatInterface({ 
  onSendMessage, 
  messages, 
  isLoading,
  onUndoLastMessage,
  onEditMessage
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    onSendMessage(text);
  };

  const handleChipClick = (promptText) => {
    if (isLoading) return;
    onSendMessage(promptText);
  };

  const handleEditClick = (index, originalText) => {
    setInput(originalText);
    if (onEditMessage) {
      onEditMessage(index);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Top Action Bar (Undo & Info) */}
      {messages.length > 0 && (
        <div className="px-4 lg:px-8 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Executive Inquiry Active</span>
            <span className="text-slate-500">• {messages.length} messages</span>
          </div>
          {onUndoLastMessage && (
            <button
              onClick={onUndoLastMessage}
              disabled={isLoading || messages.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Undo last question and answer"
            >
              <Undo2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Undo Last</span>
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Welcome to Skylark Executive BI Agent</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Ask natural language business questions across our live Monday.com Deals Funnel and Work Order Operations boards.
            </p>

            <div className="mt-8 w-full text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Quick Inquiries</span>
              </div>
              <div className="flex flex-col gap-2">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleChipClick(prompt)}
                    className="flex items-center justify-between text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all group cursor-pointer"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-4xl mx-auto group ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Edit Message Button for User Messages */}
              {msg.sender === 'user' && !isLoading && (
                <button
                  onClick={() => handleEditClick(index, msg.text)}
                  className="opacity-0 group-hover:opacity-100 transition self-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
                  title="Edit this request"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              <div
                className={`rounded-2xl px-5 py-4 text-sm leading-relaxed max-w-[88%] lg:max-w-[85%] ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none shadow-lg'
                }`}
              >
                {/* Clean GFM Rendered Markdown */}
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 space-y-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
                          <table className="w-full text-left text-xs text-slate-300 border-collapse" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead className="bg-slate-900/90 text-slate-300 uppercase text-[11px] font-semibold border-b border-slate-800" {...props} />
                      ),
                      th: ({ node, ...props }) => (
                        <th className="py-2.5 px-3.5 border-r border-slate-800/80 last:border-r-0 font-bold text-slate-200" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="py-2 px-3.5 border-b border-slate-800/60 border-r border-slate-800/60 last:border-r-0 text-slate-300 font-normal" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-base font-bold text-slate-100 mt-2 mb-1 flex items-center gap-1.5" {...props} />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-3 mb-1" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="leading-relaxed" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="leading-relaxed mb-2 text-slate-300" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-slate-100" {...props} />
                      )
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>

                {/* Multi-View Visualizer (Bar, Trend, Donut, Table, Cards) */}
                {msg.chart && msg.chart.data && msg.chart.data.length > 0 && (
                  <MultiViewVisualizer chartData={msg.chart} />
                )}

                {/* Clarification Pill Options */}
                {msg.clarification && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-2">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{msg.clarification.question}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.clarification.options.map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() => handleChipClick(opt)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-left cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Caveats Banner */}
                {msg.caveats && msg.caveats.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-slate-300">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span>Data Resilience & Imputation Notes:</span>
                    </div>
                    {msg.caveats.map((c, ci) => (
                      <div key={ci} className="pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-slate-500">
                        {c}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Followups */}
                {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                  <div className="mt-3 pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Suggested:</span>
                    {msg.suggested_followups.map((sug, si) => (
                      <button
                        key={si}
                        onClick={() => handleChipClick(sug)}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-4xl mx-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Querying Monday.com boards & calculating metrics...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Query Input Box */}
      <div className="p-4 lg:px-8 bg-slate-900/90 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything (e.g. 'Can you show the tentative dates for different sectors using trend')..."
            className="w-full pl-4 pr-12 py-3 bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 text-sm shadow-inner transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition shadow cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="max-w-4xl mx-auto mt-2 text-[11px] text-slate-500 text-center">
          Answers are dynamically generated using deterministic calculations from Monday.com boards.
        </div>
      </div>
    </div>
  );
}
