from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.agent_service import agent_service

router = APIRouter(prefix="/agent", tags=["Agent"])

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    reply: str
    chart: Optional[Dict[str, Any]] = None
    caveats: Optional[List[str]] = None
    suggested_followups: Optional[List[str]] = None
    clarification: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(req: ChatRequest):
    """Processes user query and returns structured narrative, charts, caveats, and follow-ups."""
    result = agent_service.process_query(req.message, req.conversation_history)
    return result
