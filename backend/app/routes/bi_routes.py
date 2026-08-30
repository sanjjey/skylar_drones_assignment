from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from app.services.bi_engine import bi_engine
from app.services.monday_service import monday_service

router = APIRouter(prefix="/bi", tags=["Business Intelligence"])

@router.get("/kpis")
async def get_kpis():
    """Returns top executive headline KPIs across deals and operations."""
    return bi_engine.get_executive_kpis()

@router.get("/pipeline-by-sector")
async def get_pipeline_by_sector(
    sector: Optional[str] = Query(None, description="Optional sector filter"),
    quarter: Optional[str] = Query(None, description="Optional quarter filter")
):
    """Returns pipeline distribution by canonical sector."""
    return bi_engine.get_pipeline_by_sector(sector_filter=sector, quarter_filter=quarter)

@router.get("/top-deals")
async def get_top_deals(
    limit: int = Query(10, ge=1, le=50),
    sector: Optional[str] = Query(None)
):
    """Returns top open deals by value."""
    return bi_engine.get_top_deals(limit=limit, sector_filter=sector)

@router.get("/revenue-ar")
async def get_revenue_ar(sector: Optional[str] = Query(None)):
    """Returns billing, cash collections, and outstanding AR aging."""
    return bi_engine.get_revenue_and_ar_breakdown(sector_filter=sector)

@router.get("/operations")
async def get_operations(sector: Optional[str] = Query(None)):
    """Returns operational execution velocity and software attach rates."""
    return bi_engine.get_operations_analytics(sector_filter=sector)

@router.get("/cross-board")
async def get_cross_board(sector: Optional[str] = Query(None)):
    """Returns cross-board correlation metrics between Deals and Work Orders."""
    return bi_engine.get_cross_board_correlations(sector_filter=sector)

@router.get("/timeline-trend")
async def get_timeline_trend():
    """Returns chronological timeline trend across sectors and quarters."""
    return bi_engine.get_sector_timeline_trend()

@router.get("/explorer/deals")
async def explore_deals(
    sector: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    quarter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500)
):
    """Provides filtered, searchable records and slice aggregations for Deals Funnel."""
    deals_df, _ = monday_service.get_dataframes()
    df = deals_df.copy()

    if sector and sector != "ALL":
        df = df[df["canonical_sector"].str.lower() == sector.lower()]
    if stage and stage != "ALL":
        df = df[df["deal_stage"].str.lower().str.contains(stage.lower())]
    if owner and owner != "ALL":
        df = df[df["owner_code"].str.lower() == owner.lower()]
    if quarter and quarter != "ALL":
        df = df[df["reporting_quarter"] == quarter]
    if search:
        s = search.lower()
        df = df[df["deal_name"].str.lower().str.contains(s) | df["client_code"].str.lower().str.contains(s)]

    total_count = len(df)
    total_val = float(df["deal_value"].sum())
    weighted_val = float(df["weighted_value"].sum())

    records = df.head(limit).to_dict(orient="records")
    for r in records:
        # clean any NaN values for clean JSON
        for k, v in list(r.items()):
            if isinstance(v, float) and (v != v):  # NaN check
                r[k] = None

    # Filter choices for dropdowns
    available_sectors = sorted(deals_df["canonical_sector"].dropna().unique().tolist())
    available_stages = sorted(deals_df["deal_stage"].dropna().unique().tolist())
    available_owners = sorted(deals_df["owner_code"].dropna().unique().tolist())
    available_quarters = sorted([q for q in deals_df["reporting_quarter"].dropna().unique().tolist() if q != "Unscheduled"])

    return {
        "total_records": total_count,
        "total_value": total_val,
        "weighted_value": weighted_val,
        "records": records,
        "filter_options": {
            "sectors": available_sectors,
            "stages": available_stages,
            "owners": available_owners,
            "quarters": available_quarters
        }
    }

@router.get("/explorer/work-orders")
async def explore_work_orders(
    sector: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority_ar_only: bool = Query(False),
    software_only: bool = Query(False),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500)
):
    """Provides filtered, searchable records and slice aggregations for Work Orders."""
    _, wo_df = monday_service.get_dataframes()
    df = wo_df.copy()

    if sector and sector != "ALL":
        df = df[df["canonical_sector"].str.lower() == sector.lower()]
    if status and status != "ALL":
        df = df[df["execution_status"].str.lower().str.contains(status.lower())]
    if priority_ar_only:
        df = df[df["is_ar_priority"] == True]
    if software_only:
        df = df[df["has_software"] == True]
    if search:
        s = search.lower()
        df = df[df["deal_name"].str.lower().str.contains(s) | df["client_code"].str.lower().str.contains(s) | df["serial_no"].str.lower().str.contains(s)]

    total_count = len(df)
    contract_sum = float(df["contract_amount_incl_gst"].sum())
    billed_sum = float(df["billed_amount_incl_gst"].sum())
    collected_sum = float(df["collected_amount_incl_gst"].sum())
    ar_sum = float(df["amount_receivable"].sum())

    records = df.head(limit).to_dict(orient="records")
    for r in records:
        for k, v in list(r.items()):
            if isinstance(v, float) and (v != v):
                r[k] = None

    available_sectors = sorted(wo_df["canonical_sector"].dropna().unique().tolist())
    available_statuses = sorted(wo_df["execution_status"].dropna().unique().tolist())

    return {
        "total_records": total_count,
        "contracted_total": contract_sum,
        "billed_total": billed_sum,
        "collected_total": collected_sum,
        "outstanding_ar_total": ar_sum,
        "records": records,
        "filter_options": {
            "sectors": available_sectors,
            "statuses": available_statuses
        }
    }
