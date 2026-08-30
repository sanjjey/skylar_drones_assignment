from fastapi import APIRouter
from app.services.monday_service import monday_service

router = APIRouter(prefix="/monday", tags=["Monday.com Integration"])

@router.get("/status")
async def get_monday_status():
    """Returns Monday.com sync status, data source mode, and data quality scores."""
    return monday_service.get_sync_status()

@router.post("/sync")
async def trigger_monday_sync():
    """Forces dynamic refresh from Monday.com GraphQL API or local cache."""
    return await monday_service.sync_data(force_refresh=True)
