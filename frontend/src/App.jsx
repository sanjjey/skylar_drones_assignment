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

export default function App() {
  const [activeTab, setActiveTab] = useState('agent'); // 'agent' | 'explorer'
  const [syncStatus, setSyncStatus] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Session / Chat State
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Failure Alerts & Toast State
  const [errorToast, setErrorToast] = useState(null);

  // Modals
  const [isLeadershipOpen, setIsLeadershipOpen] = useState(false);
  const [isDataHealthOpen, setIsDataHealthOpen] = useState(false);

  // 1. Initial Load: Status, KPIs & Saved Sessions
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [statusRes, kpisRes, sessRes] = await Promise.all([
          fetch(`${API_BASE}/api/monday/status`),
          fetch(`${API_BASE}/api/bi/kpis`),
          fetch(`${API_BASE}/api/sessions`)
        ]);
        const statusData = await statusRes.json();
        const kpisData = await kpisRes.json();
        const sessData = await sessRes.json();

        setSyncStatus(statusData);
        setKpis(kpisData);
        setSessions(sessData);

        if (sessData && sessData.length > 0) {
          setActiveSessionId(sessData[0].id);
          loadSessionMessages(sessData[0].id);
        } else {
          handleNewSession();
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        showErrorToast('Failed to connect to backend server. Running in offline resilient mode.');
      } finally {
        setIsLoadingKpis(false);
      }
    };

    loadInitialData();
  }, []);

  const showErrorToast = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 6000);
  };

  const loadSessionMessages = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
      const data = await res.json();
      const formatted = data.map(m => ({
        sender: m.sender,
        text: m.text,
        chart: m.chart_data,
        caveats: m.caveats,
        clarification: m.clarification,
        suggested_followups: m.suggested_followups
      }));
      setMessages(formatted);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    loadSessionMessages(sessionId);
    setActiveTab('agent');
  };

  const handleNewSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      });
      const newSess = await res.json();
      setSessions((prev) => [newSess, ...prev]);
      setActiveSessionId(newSess.id);
      setMessages([]);
      setActiveTab('agent');
    } catch (err) {
      console.error('Failed to create session:', err);
      showErrorToast('Supabase storage unavailable. Started session in memory.');
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      setSessions((prev) => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    } catch (err) {
      console.error('Failed to rename session:', err);
      showErrorToast('Failed to rename session on server.');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await fetch(`${API_BASE}/api/sessions/${sessionId}`, { method: 'DELETE' });
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
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleUndoLastMessage = async () => {
    if (messages.length === 0) return;
    const newLen = Math.max(0, messages.length - 2);
    setMessages(prev => prev.slice(0, newLen));

    if (activeSessionId) {
      fetch(`${API_BASE}/api/sessions/${activeSessionId}/truncate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_index: newLen })
      }).catch(console.error);
    }
  };

  const handleEditMessage = async (messageIndex) => {
    setMessages(prev => prev.slice(0, messageIndex));

    if (activeSessionId) {
      fetch(`${API_BASE}/api/sessions/${activeSessionId}/truncate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_index: messageIndex })
      }).catch(console.error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/monday/sync`, { method: 'POST' });
      const data = await res.json();
      setSyncStatus(data);
      const kpisRes = await fetch(`${API_BASE}/api/bi/kpis`);
      const kpisData = await kpisRes.json();
      setKpis(kpisData);
    } catch (err) {
      console.error('Sync failed:', err);
      showErrorToast('Monday.com sync encountered rate-limiting or network error.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    let currSessionId = activeSessionId;
    if (!currSessionId) {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: text.substring(0, 30) + '...' })
      });
      const newSess = await res.json();
      currSessionId = newSess.id;
      setActiveSessionId(currSessionId);
      setSessions(prev => [newSess, ...prev]);
    }

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    // Save user message to Supabase
    fetch(`${API_BASE}/api/sessions/${currSessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMsg)
    }).catch(console.error);

    try {
      const res = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (res.status === 429) {
        showErrorToast('AI rate-limit encountered (Too Many Requests). Activated deterministic BI fallback.');
      }

      const data = await res.json();

      const assistantMsg = {
        sender: 'assistant',
        text: data.reply,
        chart: data.chart,
        caveats: data.caveats,
        suggested_followups: data.suggested_followups,
        clarification: data.clarification
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message to Supabase
      fetch(`${API_BASE}/api/sessions/${currSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'assistant',
          text: data.reply,
          chart_data: data.chart,
          caveats: data.caveats,
          clarification: data.clarification,
          suggested_followups: data.suggested_followups
        })
      }).catch(console.error);

    } catch (err) {
      console.error('Chat error:', err);
      showErrorToast('Network error while querying AI service. Falling back to local data.');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: '⚠️ An error occurred while processing your query. Active in offline fallback mode.'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Top Error / Resilience Notification Banner */}
      {errorToast && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-300 flex items-center justify-between z-50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="p-1 hover:text-white cursor-pointer">
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
