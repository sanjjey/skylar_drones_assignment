import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger("supabase_service")

# Try initializing Supabase Python Client
try:
    from supabase import create_client, Client
    supabase_lib_available = True
except ImportError:
    supabase_lib_available = False

class SupabaseService:
    """
    Manages session persistence and chat history in Supabase,
    with automatic in-memory fallback if Supabase credentials are not set
    or if Supabase is under maintenance / unreachable.
    """

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY", "") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.client: Optional[Any] = None
        self.in_memory_sessions: Dict[str, Dict[str, Any]] = {}
        self.in_memory_messages: Dict[str, List[Dict[str, Any]]] = {}

        if supabase_lib_available and self.supabase_url and self.supabase_key and "your_project" not in self.supabase_url:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
                logger.info("Connected to Supabase for persistent chat sessions.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}. Active in-memory session mode.")

    def is_connected(self) -> bool:
        return self.client is not None

    async def list_sessions(self) -> List[Dict[str, Any]]:
        """Returns all chat sessions ordered by latest updated."""
        if self.client:
            try:
                res = self.client.table("chat_sessions").select("*").order("updated_at", desc=True).execute()
                return res.data or []
            except Exception as e:
                logger.warning(f"Supabase list_sessions failed (maintenance/network): {e}. Falling back to memory.")

        sessions = list(self.in_memory_sessions.values())
        sessions.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return sessions

    async def create_session(self, title: str = "New Executive Inquiry") -> Dict[str, Any]:
        """Creates a new conversation session."""
        session_id = f"sess_{int(datetime.now().timestamp() * 1000)}"
        now_iso = datetime.utcnow().isoformat() + "Z"
        session_obj = {
            "id": session_id,
            "title": title,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        if self.client:
            try:
                res = self.client.table("chat_sessions").insert({"title": title}).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase create_session failed: {e}")

        self.in_memory_sessions[session_id] = session_obj
        self.in_memory_messages[session_id] = []
        return session_obj

    async def update_session_title(self, session_id: str, new_title: str) -> Dict[str, Any]:
        """Renames an existing chat session."""
        now_iso = datetime.utcnow().isoformat() + "Z"
        if self.client:
            try:
                res = self.client.table("chat_sessions").update({"title": new_title, "updated_at": now_iso}).eq("id", session_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase update_session_title failed: {e}")

        if session_id in self.in_memory_sessions:
            self.in_memory_sessions[session_id]["title"] = new_title
            self.in_memory_sessions[session_id]["updated_at"] = now_iso
            return self.in_memory_sessions[session_id]
        
        return {"id": session_id, "title": new_title, "updated_at": now_iso}

    async def get_session_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Fetches all messages for a given session."""
        if self.client:
            try:
                res = self.client.table("chat_messages").select("*").eq("session_id", session_id).order("created_at", desc=False).execute()
                return res.data or []
            except Exception as e:
                logger.warning(f"Supabase get_session_messages failed: {e}")

        return self.in_memory_messages.get(session_id, [])

    async def save_message(
        self,
        session_id: str,
        sender: str,
        text: str,
        chart: Optional[Dict[str, Any]] = None,
        caveats: Optional[List[str]] = None,
        clarification: Optional[Dict[str, Any]] = None,
        suggested_followups: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Saves a message to the specified session."""
        now_iso = datetime.utcnow().isoformat() + "Z"
        msg_obj = {
            "session_id": session_id,
            "sender": sender,
            "text": text,
            "chart_data": chart,
            "caveats": caveats,
            "clarification": clarification,
            "suggested_followups": suggested_followups,
            "created_at": now_iso
        }

        if self.client:
            try:
                res = self.client.table("chat_messages").insert(msg_obj).execute()
                self.client.table("chat_sessions").update({"updated_at": now_iso}).eq("id", session_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase save_message failed: {e}")

        if session_id not in self.in_memory_messages:
            self.in_memory_messages[session_id] = []
        self.in_memory_messages[session_id].append(msg_obj)
        if session_id in self.in_memory_sessions:
            self.in_memory_sessions[session_id]["updated_at"] = now_iso
        return msg_obj

    async def truncate_messages_from_index(self, session_id: str, from_index: int) -> bool:
        """Removes messages from a specific index onwards (for undo/editing)."""
        if self.client:
            try:
                # Fetch all messages ordered by created_at
                res = self.client.table("chat_messages").select("id").eq("session_id", session_id).order("created_at", desc=False).execute()
                if res.data and len(res.data) > from_index:
                    ids_to_delete = [m["id"] for m in res.data[from_index:]]
                    for mid in ids_to_delete:
                        self.client.table("chat_messages").delete().eq("id", mid).execute()
            except Exception as e:
                logger.warning(f"Supabase truncate failed: {e}")

        if session_id in self.in_memory_messages:
            self.in_memory_messages[session_id] = self.in_memory_messages[session_id][:from_index]
        return True

    async def delete_session(self, session_id: str) -> bool:
        """Deletes a session and associated messages."""
        if self.client:
            try:
                self.client.table("chat_sessions").delete().eq("id", session_id).execute()
                return True
            except Exception as e:
                logger.warning(f"Supabase delete_session failed: {e}")

        self.in_memory_sessions.pop(session_id, None)
        self.in_memory_messages.pop(session_id, None)
        return True

supabase_service = SupabaseService()
