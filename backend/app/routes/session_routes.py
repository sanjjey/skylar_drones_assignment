from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/sessions", tags=["Chat Sessions"])

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Executive Inquiry"

class UpdateSessionTitleRequest(BaseModel):
    title: str

class TruncateSessionRequest(BaseModel):
    from_index: int

class SaveMessageRequest(BaseModel):
    sender: str
    text: str
    chart_data: Optional[Dict[str, Any]] = None
    caveats: Optional[List[str]] = None
    clarification: Optional[Dict[str, Any]] = None
    suggested_followups: Optional[List[str]] = None

@router.get("")
async def get_sessions():
    """Lists all saved chat sessions."""
    return await supabase_service.list_sessions()

@router.post("")
async def create_session(req: CreateSessionRequest):
    """Creates a new chat session."""
    return await supabase_service.create_session(title=req.title or "New Executive Inquiry")

@router.patch("/{session_id}")
async def update_session_title(session_id: str, req: UpdateSessionTitleRequest):
    """Updates / renames the title of a chat session."""
    return await supabase_service.update_session_title(session_id, req.title)

@router.get("/{session_id}")
async def get_session_messages(session_id: str):
    """Retrieves all chat messages for a specific session."""
    return await supabase_service.get_session_messages(session_id)

@router.post("/{session_id}/messages")
async def save_message(session_id: str, req: SaveMessageRequest):
    """Saves a user or assistant message to a session."""
    return await supabase_service.save_message(
        session_id=session_id,
        sender=req.sender,
        text=req.text,
        chart=req.chart_data,
        caveats=req.caveats,
        clarification=req.clarification,
        suggested_followups=req.suggested_followups
    )

@router.post("/{session_id}/truncate")
async def truncate_session_messages(session_id: str, req: TruncateSessionRequest):
    """Truncates messages in a session from a specific index (for undo or message editing)."""
    await supabase_service.truncate_messages_from_index(session_id, req.from_index)
    return {"status": "truncated", "session_id": session_id, "from_index": req.from_index}

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Deletes a chat session."""
    await supabase_service.delete_session(session_id)
    return {"status": "deleted", "id": session_id}
