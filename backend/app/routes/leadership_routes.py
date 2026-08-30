from fastapi import APIRouter
from app.services.leadership_service import leadership_service

router = APIRouter(prefix="/leadership", tags=["Leadership Updates"])

@router.get("/briefing")
async def get_leadership_briefing():
    """Generates structured executive leadership briefing with KPIs, risk radar, and actions."""
    return leadership_service.generate_leadership_briefing()
