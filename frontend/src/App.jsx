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
        showErrorToast('Backend API not reachable. Please ensure backend server is running.');
      } finally {
        setIsLoadingKpis(false);
      }
    };

    loadInitialData();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/monday/sync`, { method: 'POST' });
      const data = await res.json();
      setSyncStatus(data);
      
      const kpisRes = await fetch(`${API_BASE}/api/bi/kpis`);
      const kpisData = await kpisRes.json();
      setKpis(kpisData);

      if (data.is_live_connected) {
        showSuccessToast('✅ Live Monday.com boards successfully synchronized!');
      } else if (data.warning) {
        showToast(`ℹ️ ${data.warning}`, 'info');
      } else {
        showSuccessToast('✅ Datasets refreshed (Local Fallback Mode: 346 deals, 176 work orders).');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      showErrorToast('⚠️ Could not reach backend server at ' + (API_BASE || 'localhost:8000'));
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
