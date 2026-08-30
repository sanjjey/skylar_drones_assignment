import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KpiRibbon from './components/KpiRibbon';
import ChatSidebar from './components/ChatSidebar';
import ChatInterface from './components/ChatInterface';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AppHelperBot from './components/AppHelperBot';
import LeadershipModal from './components/LeadershipModal';
import DataHealthDrawer from './components/DataHealthDrawer';
import { AlertTriangle, X } from 'lucide-react';
import { API_BASE } from './config';

const DEFAULT_KPIS = {
  pipeline: {
    total_open_value: 2363655295.73,
    weighted_value: 846740618.39,
    open_deals_count: 181,
    won_deals_value: 489495475.25,
    won_deals_count: 53,
    lost_deals_count: 42,
    win_rate_percent: 55.8
  },
  financials: {
    contracted_value: 285154868786.0,
    billed_value: 233252973086.0,
    collected_cash: 149383717052.0,
    outstanding_ar: 184233585726.0,
    unbilled_pipeline: 51901895700.0,
    collection_efficiency_percent: 64.0,
    billing_conversion_percent: 81.8
  },
  operations: {
    total_work_orders: 176,
    completed_count: 58,
    in_progress_count: 94,
    pending_count: 24,
    software_enabled_orders: 48,
    software_adoption_percent: 27.3
  }
};

const DEFAULT_SYNC_STATUS = {
  source: 'LOCAL_FALLBACK',
  is_live_connected: false,
  deals_count: 346,
  work_orders_count: 176,
  deals_quality_score: 94.2,
  wo_quality_score: 91.8,
  deals_caveats: [
    '52% of unstated deal values mathematically derived via matched work orders & sector medians.',
    'Win probabilities derived from stage milestones (Lead=10%, Proposal=60%, Negotiation=80%).'
  ],
  wo_caveats: [
    'Missing delivery dates indicate operational completion lag.',
    'AR calculated deterministically as max(0, Billed - Collected Cash).'
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

export default function App() {
  const [activeTab, setActiveTab] = useState('agent'); // 'agent' | 'explorer'
  const [syncStatus, setSyncStatus] = useState(DEFAULT_SYNC_STATUS);
  const [kpis, setKpis] = useState(DEFAULT_KPIS);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Session / Chat State
  const [sessions, setSessions] = useState([
    { id: 'sess_default_1', title: 'Executive BI Inquiry', updated_at: new Date().toISOString() }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('sess_default_1');
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info'); // 'info' | 'error' | 'success'

  // Modals
  const [isLeadershipOpen, setIsLeadershipOpen] = useState(false);
  const [isDataHealthOpen, setIsDataHealthOpen] = useState(false);

  const showToast = (msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const showErrorToast = (msg) => showToast(msg, 'error');
  const showSuccessToast = (msg) => showToast(msg, 'success');

  // 1. Initial Load: Status, KPIs & Saved Sessions
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [statusRes, kpisRes, sessRes] = await Promise.all([
          fetch(`${API_BASE}/api/monday/status`).catch(() => null),
          fetch(`${API_BASE}/api/bi/kpis`).catch(() => null),
          fetch(`${API_BASE}/api/sessions`).catch(() => null)
        ]);
        
        const statusData = await safeJson(statusRes);
        const kpisData = await safeJson(kpisRes);
        const sessData = await safeJson(sessRes);

        if (statusData) setSyncStatus(statusData);
        if (kpisData) setKpis(kpisData);
        if (sessData && Array.isArray(sessData) && sessData.length > 0) {
          setSessions(sessData);
          setActiveSessionId(sessData[0].id);
          loadSessionMessages(sessData[0].id);
        }
      } catch (err) {
        console.warn('Backend offline, running in resilient client fallback mode:', err);
      }
    };

    loadInitialData();
  }, []);

  const loadSessionMessages = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
      const data = await safeJson(res);
      if (data && Array.isArray(data)) {
        const formatted = data.map(m => ({
          sender: m.sender,
          text: m.text,
          chart: m.chart_data,
          caveats: m.caveats,
          clarification: m.clarification,
          suggested_followups: m.suggested_followups
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.warn('Failed to load session messages:', err);
    }
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    loadSessionMessages(sessionId);
    setActiveTab('agent');
  };

  const handleNewSession = async () => {
    const newId = `sess_${Date.now()}`;
    const newSess = { id: newId, title: 'New Conversation', updated_at: new Date().toISOString() };
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
    setActiveTab('agent');

    try {
      await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      });
    } catch (err) {
      console.warn('Session created locally in memory:', err);
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    setSessions((prev) => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    try {
      await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
    } catch (err) {
      console.warn('Session renamed locally:', err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    setSessions((prev) => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        loadSessionMessages(remaining[0].id);
      } else {
        handleNewSession();
      }
    }
    try {
      await fetch(`${API_BASE}/api/sessions/${sessionId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Deleted locally:', err);
    }
  };

  const handleUndoLastMessage = () => {
    if (messages.length === 0) return;
    const newLen = Math.max(0, messages.length - 2);
    setMessages(prev => prev.slice(0, newLen));

    if (activeSessionId) {
      fetch(`${API_BASE}/api/sessions/${activeSessionId}/truncate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_index: newLen })
      }).catch(console.warn);
    }
  };

  const handleEditMessage = (messageIndex) => {
    setMessages(prev => prev.slice(0, messageIndex));

    if (activeSessionId) {
      fetch(`${API_BASE}/api/sessions/${activeSessionId}/truncate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_index: messageIndex })
      }).catch(console.warn);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/monday/sync`, { method: 'POST' });
      const data = await safeJson(res);
      if (data) {
        setSyncStatus(data);
        const kpisRes = await fetch(`${API_BASE}/api/bi/kpis`);
        const kpisData = await safeJson(kpisRes);
        if (kpisData) setKpis(kpisData);

        if (data.is_live_connected) {
          showSuccessToast('✅ Live Monday.com boards successfully synchronized!');
        } else if (data.warning) {
          showToast(`ℹ️ ${data.warning}`, 'info');
        } else {
          showSuccessToast('✅ Datasets refreshed (Local Fallback Mode: 346 deals, 176 work orders).');
        }
      } else {
        showSuccessToast('✅ Datasets active in Local Fallback Cache Mode.');
      }
    } catch (err) {
      console.warn('Sync fallback triggered:', err);
      showSuccessToast('✅ Datasets active in Local Fallback Cache Mode.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    let currSessionId = activeSessionId;
    if (!currSessionId) {
      currSessionId = `sess_${Date.now()}`;
      setActiveSessionId(currSessionId);
      setSessions(prev => [{ id: currSessionId, title: text.substring(0, 26) + '...' }, ...prev]);
    }

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await safeJson(res);

      if (data) {
        const assistantMsg = {
          sender: 'assistant',
          text: data.reply,
          chart: data.chart,
          caveats: data.caveats,
          suggested_followups: data.suggested_followups,
          clarification: data.clarification
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Fallback response if backend not yet running on cloud
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: `### 🤖 Skylark BI Assistant\n\nReceived your inquiry: **"${text}"**.\n\nPlease ensure your backend service (FastAPI) is running and configured at \`${API_BASE || 'http://localhost:8000'}\`.`,
            caveats: ['Running in client resilience mode.']
          }
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: '⚠️ An error occurred while contacting the AI service. Please verify your backend connection.'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Top Notification / Resilience Banner */}
      {toastMessage && (
        <div className={`border-b px-4 py-2 text-xs flex items-center justify-between z-50 animate-in slide-in-from-top duration-200 ${
          toastType === 'error'
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            : toastType === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${
              toastType === 'error' ? 'text-rose-400' : toastType === 'success' ? 'text-emerald-400' : 'text-blue-400'
            }`} />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header with Tab Switcher */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        syncStatus={syncStatus}
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenLeadership={() => setIsLeadershipOpen(true)}
        onOpenDataHealth={() => setIsDataHealthOpen(true)}
      />

      {/* KPI Ribbon Strip */}
      <KpiRibbon kpis={kpis} isLoading={isLoadingKpis} />

      {/* Main View: AI Agent or Interactive Explorer */}
      {activeTab === 'agent' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Chat History Sidebar with Editable Titles */}
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* Main Agent Conversational View with Undo & Edit */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              onUndoLastMessage={handleUndoLastMessage}
              onEditMessage={handleEditMessage}
            />
          </main>
        </div>
      ) : (
        <AnalyticsDashboard />
      )}

      {/* Chatbot 1: Application Helper & Navigator Floating Widget */}
      <AppHelperBot
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenLeadership={() => setIsLeadershipOpen(true)}
        onOpenDataHealth={() => setIsDataHealthOpen(true)}
        onTriggerSync={handleSync}
      />

      {/* Leadership Briefing Modal */}
      <LeadershipModal
        isOpen={isLeadershipOpen}
        onClose={() => setIsLeadershipOpen(false)}
      />

      {/* Data Resilience & Governance Drawer */}
      <DataHealthDrawer
        isOpen={isDataHealthOpen}
        onClose={() => setIsDataHealthOpen(false)}
        syncStatus={syncStatus}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
    </div>
  );
}
