import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Edit2,
  Check,
  X
} from 'lucide-react';

export default function ChatSidebar({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession,
  onRenameSession,
  isOpen,
  onToggleOpen
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (sess, e) => {
    e.stopPropagation();
    setEditingId(sess.id);
    setEditTitle(sess.title);
  };

  const handleSaveRename = (sessId, e) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(sessId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  return (
    <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-20 ${
      isOpen ? 'w-72' : 'w-0 sm:w-16'
    } overflow-hidden shrink-0`}>
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60">
        {isOpen ? (
          <>
            <button
              onClick={onNewSession}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
            <button
              onClick={onToggleOpen}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleOpen}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isOpen && sessions.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-500">
            No saved sessions yet. Start a new conversation!
          </div>
        )}

        {sessions.map((sess) => {
          const isActive = sess.id === activeSessionId;
          const isEditing = editingId === sess.id;

          return (
            <div
              key={sess.id}
              onClick={() => !isEditing && onSelectSession(sess.id)}
              className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-600/15 border border-blue-500/30 text-blue-300 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {isOpen && (
                  <div className="truncate flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(sess.id, e);
                            if (e.key === 'Escape') handleCancelRename(e);
                          }}
                          autoFocus
                          className="w-full bg-slate-950 text-slate-100 text-xs px-2 py-1 rounded border border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={(e) => handleSaveRename(sess.id, e)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                          title="Save Title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-1 text-slate-500 hover:text-slate-300"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="truncate text-slate-200 font-medium">{sess.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{sess.updated_at ? new Date(sess.updated_at).toLocaleDateString() : 'Just now'}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isOpen && !isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => startEditing(sess, e)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
                    title="Rename Conversation"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sess.id);
                    }}
                    className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Supabase Storage Indicator Footer */}
      {isOpen && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Cloud Sync</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Active
          </span>
        </div>
      )}
    </aside>
  );
}
