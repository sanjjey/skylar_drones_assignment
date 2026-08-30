from typing import Dict, Any, List
from datetime import datetime
from app.services.bi_engine import bi_engine
from app.services.monday_service import monday_service

class LeadershipService:
    """
    Generates structured, executive-ready Leadership Updates and Board Memos.
    """

    @staticmethod
    def generate_leadership_briefing(period_title: str = "Executive Leadership Briefing") -> Dict[str, Any]:
        """Synthesizes cross-board metrics into a cohesive leadership memo."""
        kpis = bi_engine.get_executive_kpis()
        sectors = bi_engine.get_pipeline_by_sector()
        ar_data = bi_engine.get_revenue_and_ar_breakdown()
        ops_data = bi_engine.get_operations_analytics()
        cross_board = bi_engine.get_cross_board_correlations()
        sync_status = monday_service.get_sync_status()

        pipeline = kpis["pipeline"]
        financials = kpis["financials"]
        operations = kpis["operations"]

        # Top sector by pipeline
        top_sector = sectors[0]["sector"] if sectors else "Energy & Powerlines"
        top_sector_val = sectors[0]["pipeline_value"] if sectors else 0.0

        # Top AR debtor
        top_debtor = ar_data["top_ar_accounts"][0] if ar_data["top_ar_accounts"] else None

        # Build Structured Executive Briefing
        briefing = {
            "title": period_title,
            "generated_at": datetime.now().strftime("%B %d, %Y - %H:%M UTC"),
            "data_source": "Monday.com Dynamic Live API" if sync_status["is_live_connected"] else "Resilient Cache (Monday.com Synced)",
            "headline_kpis": {
                "active_pipeline": f"₹{pipeline['total_open_value']:,.2f}",
                "weighted_pipeline": f"₹{pipeline['weighted_value']:,.2f}",
                "closed_won_value": f"₹{pipeline['won_deals_value']:,.2f}",
                "contracted_operations": f"₹{financials['contracted_value']:,.2f}",
                "collected_revenue": f"₹{financials['collected_cash']:,.2f}",
                "outstanding_ar": f"₹{financials['outstanding_ar']:,.2f}",
                "collection_efficiency": f"{financials['collection_efficiency_percent']}%",
                "software_attach_rate": f"{operations['software_adoption_percent']}%"
            },
            "executive_summary": (
                f"Active sales pipeline stands at ₹{pipeline['total_open_value']:,.2f} ({pipeline['open_deals_count']} active deals) "
                f"with a probability-weighted value of ₹{pipeline['weighted_value']:,.2f}. "
                f"Total closed-won bookings have reached ₹{pipeline['won_deals_value']:,.2f} across {pipeline['won_deals_count']} deals "
                f"(historical win rate of {pipeline['win_rate_percent']}%). "
                f"In operations, total contracted work is ₹{financials['contracted_value']:,.2f}, with ₹{financials['collected_cash']:,.2f} "
                f"collected in cash ({financials['collection_efficiency_percent']}% collection efficiency). "
                f"Skylark proprietary software platform adoption is attached to {operations['software_adoption_percent']}% of operational projects."
            ),
            "sector_highlights": [
                {
                    "sector": s["sector"],
                    "open_deals": s["open_deals"],
                    "pipeline_value": f"₹{s['pipeline_value']:,.2f}",
                    "weighted_value": f"₹{s['weighted_value']:,.2f}",
                    "avg_win_prob": f"{s['avg_probability']}%"
                } for s in sectors[:5]
            ],
            "operations_and_delivery": {
                "total_work_orders": operations["total_work_orders"],
                "completed": operations["completed_count"],
                "in_progress": operations["in_progress_count"],
                "pending_execution": operations["pending_count"],
                "software_enabled_orders": operations["software_enabled_orders"]
            },
            "cash_flow_and_ar_radar": {
                "total_ar_outstanding": f"₹{ar_data['total_ar']:,.2f}",
                "priority_accounts_ar": f"₹{ar_data['priority_ar_total']:,.2f}",
                "top_ar_risk": {
                    "account": top_debtor["client_code"] if top_debtor else "N/A",
                    "deal_name": top_debtor["deal_name"] if top_debtor else "N/A",
                    "amount": f"₹{top_debtor['amount_receivable']:,.2f}" if top_debtor else "₹0.00",
                    "is_priority": top_debtor["is_priority"] if top_debtor else False
                } if top_debtor else None
            },
            "strategic_risks_and_blockers": [
                f"Accounts Receivable Exposure: ₹{ar_data['total_ar']:,.2f} remains uncollected across {len(ar_data['top_ar_accounts'])} major client accounts.",
                f"Execution Lag: {cross_board['unfulfilled_won_deals_count']} closed-won deals have not yet converted into active work orders on the operations board.",
                f"Unbilled Backlog: ₹{financials['unbilled_pipeline']:,.2f} in contracted project value is pending invoice milestone generation."
            ],
            "recommended_actions": [
                f"Direct Finance & KAMs to focus immediate collections on {top_debtor['client_code'] if top_debtor else 'priority accounts'} (₹{ar_data['priority_ar_total']:,.2f} priority exposure).",
                f"Accelerate operational kick-off for {cross_board['unfulfilled_won_deals_count']} unfulfilled won deals to convert booked revenue into billable milestones.",
                f"Capitalize on strong pipeline momentum in {top_sector} (₹{top_sector_val:,.2f} pipeline) with specialized solution architects."
            ],
            "data_governance_caveats": sync_status.get("deals_caveats", []) + sync_status.get("wo_caveats", [])
        }

        return briefing

leadership_service = LeadershipService()
