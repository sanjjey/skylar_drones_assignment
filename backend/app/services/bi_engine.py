import pandas as pd
import numpy as np
import re
from typing import Dict, Any, List, Optional
from app.services.monday_service import monday_service

def quarter_sort_key(q_str: str) -> tuple:
    """Sorts strings like 'Q3 2025' or 'Q1 2026' chronologically."""
    if not q_str or q_str == "Unscheduled":
        return (9999, 9)
    m = re.search(r"Q(\d)\s+(\d{4})", str(q_str))
    if m:
        return (int(m.group(2)), int(m.group(1)))
    return (9999, 0)

class BusinessIntelligenceEngine:
    """
    High-performance, deterministic calculation engine for Founder-level
    cross-board Business Intelligence across Monday.com Deals and Work Orders.
    """

    def __init__(self):
        pass

    def _get_dfs(self):
        return monday_service.get_dataframes()

    def get_executive_kpis(self) -> Dict[str, Any]:
        """Calculates executive headline metrics across Deals and Work Orders."""
        deals_df, wo_df = self._get_dfs()

        # Pipeline Calculations
        open_deals = deals_df[~deals_df["deal_status"].str.lower().isin(["won", "lost", "dropped", "closed won", "closed lost"])]
        won_deals = deals_df[deals_df["deal_status"].str.lower().isin(["won", "closed won"])]
        lost_deals = deals_df[deals_df["deal_status"].str.lower().isin(["lost", "closed lost"])]
        
        total_pipeline_val = float(open_deals["deal_value"].sum())
        weighted_pipeline_val = float(open_deals["weighted_value"].sum())
        won_deals_val = float(won_deals["deal_value"].sum())
        
        total_closed = len(won_deals) + len(lost_deals)
        win_rate = (len(won_deals) / total_closed * 100.0) if total_closed > 0 else 0.0

        # Work Orders / Operations / Cash Calculations
        total_contract_val = float(wo_df["contract_amount_incl_gst"].sum())
        total_billed_val = float(wo_df["billed_amount_incl_gst"].sum())
        total_collected_val = float(wo_df["collected_amount_incl_gst"].sum())
        total_ar_val = float(wo_df["amount_receivable"].sum())
        total_unbilled_val = float(wo_df["unbilled_amount"].sum())

        collection_rate = (total_collected_val / total_billed_val * 100.0) if total_billed_val > 0 else 0.0
        billing_rate = (total_billed_val / total_contract_val * 100.0) if total_contract_val > 0 else 0.0

        # Execution statuses
        completed_wo = wo_df[wo_df["execution_status"].str.lower().isin(["completed", "delivered", "executed"])]
        in_progress_wo = wo_df[wo_df["execution_status"].str.lower().isin(["in progress", "ongoing", "started"])]
        pending_wo = wo_df[wo_df["execution_status"].str.lower().isin(["pending po", "draft", "pending execution", "planned"])]

        # Software adoption
        software_deals_count = int(wo_df["has_software"].sum())
        software_adoption_rate = (software_deals_count / len(wo_df) * 100.0) if len(wo_df) > 0 else 0.0

        return {
            "pipeline": {
                "total_open_value": total_pipeline_val,
                "weighted_value": weighted_pipeline_val,
                "open_deals_count": len(open_deals),
                "won_deals_value": won_deals_val,
                "won_deals_count": len(won_deals),
                "lost_deals_count": len(lost_deals),
                "win_rate_percent": round(win_rate, 1)
            },
            "financials": {
                "contracted_value": total_contract_val,
                "billed_value": total_billed_val,
                "collected_cash": total_collected_val,
                "outstanding_ar": total_ar_val,
                "unbilled_pipeline": total_unbilled_val,
                "collection_efficiency_percent": round(collection_rate, 1),
                "billing_conversion_percent": round(billing_rate, 1)
            },
            "operations": {
                "total_work_orders": len(wo_df),
                "completed_count": len(completed_wo),
                "in_progress_count": len(in_progress_wo),
                "pending_count": len(pending_wo),
                "software_enabled_orders": software_deals_count,
                "software_adoption_percent": round(software_adoption_rate, 1)
            }
        }

    def get_missing_values_audit(self) -> Dict[str, Any]:
        """Provides an exact audit of missing values, nulls, and resilience handling."""
        deals_df, wo_df = self._get_dfs()
        
        total_deals = len(deals_df)
        missing_deal_values = int((deals_df["deal_value_derivation"] != "Original Verified").sum())
        missing_tentative_dates = int(deals_df["tentative_close_date"].isna().sum())
        missing_actual_dates = int(deals_df["actual_close_date"].isna().sum())
        missing_probability = int((deals_df["probability_derivation"] != "Original CRM Probability").sum())
        uncategorized_sectors = int((deals_df["canonical_sector"] == "Other / Uncategorized").sum())

        total_wos = len(wo_df)
        missing_delivery_dates = int(wo_df["delivery_date"].isna().sum())
        missing_po_dates = int(wo_df["po_date"].isna().sum())
        unbilled_wos = int((wo_df["billed_amount_incl_gst"] == 0).sum())
        uncollected_wos = int((wo_df["collected_amount_incl_gst"] == 0).sum())
        missing_ar_initial = int((wo_df["ar_priority"].isna()).sum())

        deals_stats = [
            {"field": "Deal Monetary Value", "missing_count": missing_deal_values, "total": total_deals, "percentage": round(missing_deal_values / total_deals * 100, 1), "strategy": "Tier 2 Pattern Matching with Work Orders; Tier 3 Sector Median fallback"},
            {"field": "Tentative Close Date", "missing_count": missing_tentative_dates, "total": total_deals, "percentage": round(missing_tentative_dates / total_deals * 100, 1), "strategy": "Tier 1: Derived from Created Date + 60 days standard sales cycle"},
            {"field": "Actual Close Date", "missing_count": missing_actual_dates, "total": total_deals, "percentage": round(missing_actual_dates / total_deals * 100, 1), "strategy": "Expected for active open pipeline deals"},
            {"field": "Closure Probability", "missing_count": missing_probability, "total": total_deals, "percentage": round(missing_probability / total_deals * 100, 1), "strategy": "Tier 2: Derived via Empirical Stage-Based Probability model"},
            {"field": "Sector / Service", "missing_count": uncategorized_sectors, "total": total_deals, "percentage": round(uncategorized_sectors / total_deals * 100, 1), "strategy": "Canonical synonym normalization applied"}
        ]

        wo_stats = [
            {"field": "Data Delivery Date", "missing_count": missing_delivery_dates, "total": total_wos, "percentage": round(missing_delivery_dates / total_wos * 100, 1), "strategy": "Flagged as operational completion backlog"},
            {"field": "Date of PO / LOI", "missing_count": missing_po_dates, "total": total_wos, "percentage": round(missing_po_dates / total_wos * 100, 1), "strategy": "Parsed available date formats; verified active records"},
            {"field": "Amount (Excl. of GST)", "missing_count": int(wo_df["amount_excl_gst_raw"].isna().sum()), "total": total_wos, "percentage": round(int(wo_df["amount_excl_gst_raw"].isna().sum()) / total_wos * 100, 1), "strategy": "Tier 1: Derived mathematically via GST formula (Amount Incl. / 1.18)"},
            {"field": "Billed Invoices (₹0)", "missing_count": unbilled_wos, "total": total_wos, "percentage": round(unbilled_wos / total_wos * 100, 1), "strategy": "Tier 1: Derived unbilled backlog = Contract - Billed"},
            {"field": "Collected Cash (₹0)", "missing_count": uncollected_wos, "total": total_wos, "percentage": round(uncollected_wos / total_wos * 100, 1), "strategy": "Tier 1: Auto-calculated AR = max(0, Billed - Collected)"},
            {"field": "AR Priority Flag", "missing_count": missing_ar_initial, "total": total_wos, "percentage": round(missing_ar_initial / total_wos * 100, 1), "strategy": "Categorized as Normal unless priority specified"}
        ]

        return {
            "deals_missing_audit": deals_stats,
            "work_orders_missing_audit": wo_stats,
            "total_deals": total_deals,
            "total_work_orders": total_wos
        }

    def get_derived_missing_records_table(self, limit: int = 150) -> Dict[str, Any]:
        """
        Returns the detailed, itemized ledger of all records with missing values
        that were derived using the 3-Tier framework.
        """
        deals_df, wo_df = self._get_dfs()
        joint_audit = monday_service.deals_audit or {}
        ledger = joint_audit.get("derivation_ledger", [])

        # If ledger is empty (e.g. initial boot before sync), rebuild from dataframes
        if not ledger:
            ledger = []
            for _, r in deals_df.iterrows():
                if r.get("deal_value_derivation") and r["deal_value_derivation"] != "Original Verified":
                    tier = "Tier 2: Entity Pattern Match" if "Matched Work Order" in r["deal_value_derivation"] else "Tier 3: Statistical Median"
                    ledger.append({
                        "record_name": r["deal_name"],
                        "entity": "Deal",
                        "field": "Deal Value",
                        "raw_state": "Missing / Null",
                        "derived_value": f"₹{r['deal_value']:,.2f}",
                        "tier": tier,
                        "method": r["deal_value_derivation"]
                    })
                if r.get("probability_derivation") and r["probability_derivation"] != "Original CRM Probability":
                    ledger.append({
                        "record_name": r["deal_name"],
                        "entity": "Deal",
                        "field": "Closure Probability",
                        "raw_state": "Unstated in CRM",
                        "derived_value": f"{int(r['closure_probability'] * 100)}%",
                        "tier": "Tier 2: Stage Pattern Match",
                        "method": r["probability_derivation"]
                    })

        tier_1 = len([x for x in ledger if "Tier 1" in x.get("tier", "")])
        tier_2 = len([x for x in ledger if "Tier 2" in x.get("tier", "")])
        tier_3 = len([x for x in ledger if "Tier 3" in x.get("tier", "")])

        # Table data formatted for MultiViewVisualizer / Recharts
        chart_table_data = [
            {
                "Record": x["record_name"],
                "Entity": x["entity"],
                "Field": x["field"],
                "Raw State": x["raw_state"],
                "Derived Value": x["derived_value"],
                "Tier": x["tier"],
                "Method": x["method"]
            }
            for x in ledger[:limit]
        ]

        return {
            "total_imputations": len(ledger),
            "tier_1_math_count": tier_1,
            "tier_2_pattern_count": tier_2,
            "tier_3_statistical_count": tier_3,
            "records": chart_table_data
        }

    def get_sector_timeline_trend(self) -> Dict[str, Any]:
        """
        Calculates chronological timeline trend of tentative close dates / quarters
        across all major business sectors.
        """
        deals_df, _ = self._get_dfs()
        df = deals_df.copy()

        quarters = sorted([q for q in df["reporting_quarter"].unique() if q and q != "Unscheduled"], key=quarter_sort_key)
        top_sectors = df["canonical_sector"].value_counts().head(5).index.tolist()

        trend_records = []
        for q in quarters:
            q_df = df[df["reporting_quarter"] == q]
            rec = {"quarter": q, "Total": round(float(q_df["deal_value"].sum()) / 1e5, 2)}
            for sec in top_sectors:
                short_sec = sec.split("(")[0].split("&")[0].strip()
                s_val = float(q_df[q_df["canonical_sector"] == sec]["deal_value"].sum())
                rec[short_sec] = round(s_val / 1e5, 2)
            trend_records.append(rec)

        sector_summary = []
        for sec in top_sectors:
            sec_df = df[df["canonical_sector"] == sec]
            peak_q = sec_df.groupby("reporting_quarter")["deal_value"].sum().idxmax() if len(sec_df) > 0 else "N/A"
            sector_summary.append({
                "sector": sec,
                "total_pipeline": float(sec_df["deal_value"].sum()),
                "deal_count": len(sec_df),
                "peak_quarter": peak_q
            })

        return {
            "trend_data": trend_records,
            "quarters": quarters,
            "top_sectors": [s.split("(")[0].split("&")[0].strip() for s in top_sectors],
            "sector_summary": sector_summary
        }

    def get_owner_performance(self) -> List[Dict[str, Any]]:
        """Calculates commercial performance across Deal Owners / KAMs."""
        deals_df, _ = self._get_dfs()
        owners = []
        for owner, grp in deals_df.groupby("owner_code"):
            if owner in ["Unassigned", "Unknown", ""]:
                continue
            won_grp = grp[grp["deal_status"].str.lower().isin(["won", "closed won"])]
            open_grp = grp[~grp["deal_status"].str.lower().isin(["won", "lost", "dropped", "closed won", "closed lost"])]
            total_closed = len(won_grp) + len(grp[grp["deal_status"].str.lower().isin(["lost", "closed lost"])])
            win_rate = (len(won_grp) / total_closed * 100.0) if total_closed > 0 else 0.0

            owners.append({
                "owner": owner,
                "total_deals": len(grp),
                "open_deals": len(open_grp),
                "open_pipeline_val": float(open_grp["deal_value"].sum()),
                "won_val": float(won_grp["deal_value"].sum()),
                "win_rate": round(win_rate, 1)
            })
        owners.sort(key=lambda x: x["open_pipeline_val"], reverse=True)
        return owners

    def get_pipeline_by_sector(self, sector_filter: Optional[str] = None, quarter_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Aggregates pipeline health by canonical sector and reporting quarter."""
        deals_df, _ = self._get_dfs()
        df = deals_df.copy()

        if sector_filter:
            df = df[df["canonical_sector"].str.lower().str.contains(sector_filter.lower())]
        if quarter_filter:
            df = df[df["reporting_quarter"].str.lower().str.contains(quarter_filter.lower())]

        sectors = []
        for sector, group in df.groupby("canonical_sector"):
            open_grp = group[~group["deal_status"].str.lower().isin(["won", "lost", "dropped", "closed won", "closed lost"])]
            won_grp = group[group["deal_status"].str.lower().isin(["won", "closed won"])]
            
            sectors.append({
                "sector": sector,
                "total_deals": len(group),
                "open_deals": len(open_grp),
                "pipeline_value": float(open_grp["deal_value"].sum()),
                "weighted_value": float(open_grp["weighted_value"].sum()),
                "won_value": float(won_grp["deal_value"].sum()),
                "avg_deal_size": float(open_grp["deal_value"].mean()) if len(open_grp) > 0 else 0.0,
                "avg_probability": round(float(open_grp["closure_probability"].mean()) * 100, 1) if len(open_grp) > 0 else 0.0
            })

        sectors.sort(key=lambda x: x["pipeline_value"], reverse=True)
        return sectors

    def get_pipeline_by_stage(self, sector_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Calculates funnel stages distribution."""
        deals_df, _ = self._get_dfs()
        df = deals_df.copy()
        if sector_filter:
            df = df[df["canonical_sector"].str.lower().str.contains(sector_filter.lower())]

        stages = []
        for stage, grp in df.groupby("deal_stage"):
            stages.append({
                "stage": stage,
                "count": len(grp),
                "total_value": float(grp["deal_value"].sum()),
                "weighted_value": float(grp["weighted_value"].sum())
            })
        stages.sort(key=lambda x: x["total_value"], reverse=True)
        return stages

    def get_top_deals(self, limit: int = 10, sector_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns top open deals by value."""
        deals_df, _ = self._get_dfs()
        df = deals_df[~deals_df["deal_status"].str.lower().isin(["won", "lost", "dropped", "closed won", "closed lost"])].copy()
        if sector_filter:
            df = df[df["canonical_sector"].str.lower().str.contains(sector_filter.lower())]

        top = df.sort_values(by="deal_value", ascending=False).head(limit)
        results = []
        for _, row in top.iterrows():
            results.append({
                "deal_name": row["deal_name"],
                "client_code": row["client_code"],
                "owner": row["owner_code"],
                "sector": row["canonical_sector"],
                "stage": row["deal_stage"],
                "value": float(row["deal_value"]),
                "probability": round(float(row["closure_probability"]) * 100, 1),
                "weighted_value": float(row["weighted_value"]),
                "tentative_close": row["tentative_close_date"] or row["reporting_date"] or "Unscheduled"
            })
        return results

    def get_revenue_and_ar_breakdown(self, sector_filter: Optional[str] = None) -> Dict[str, Any]:
        """Provides deep financial analytics: Billing, Collections, and Accounts Receivable."""
        _, wo_df = self._get_dfs()
        df = wo_df.copy()
        if sector_filter:
            df = df[df["canonical_sector"].str.lower().str.contains(sector_filter.lower())]

        sector_financials = []
        for sector, grp in df.groupby("canonical_sector"):
            c_val = float(grp["contract_amount_incl_gst"].sum())
            b_val = float(grp["billed_amount_incl_gst"].sum())
            col_val = float(grp["collected_amount_incl_gst"].sum())
            ar_val = float(grp["amount_receivable"].sum())
            
            sector_financials.append({
                "sector": sector,
                "work_orders_count": len(grp),
                "contracted": c_val,
                "billed": b_val,
                "collected": col_val,
                "outstanding_ar": ar_val,
                "collection_efficiency": round((col_val / b_val * 100.0), 1) if b_val > 0 else 0.0
            })
        sector_financials.sort(key=lambda x: x["outstanding_ar"], reverse=True)

        # Top Debtors / Priority AR Accounts
        ar_records = df[df["amount_receivable"] > 0].copy()
        top_ar = ar_records.sort_values(by=["is_ar_priority", "amount_receivable"], ascending=[False, False]).head(10)
        
        ar_list = []
        for _, row in top_ar.iterrows():
            ar_list.append({
                "deal_name": row["deal_name"],
                "client_code": row["client_code"],
                "serial_no": row["serial_no"],
                "sector": row["canonical_sector"],
                "amount_receivable": float(row["amount_receivable"]),
                "billed_amount": float(row["billed_amount_incl_gst"]),
                "collected_amount": float(row["collected_amount_incl_gst"]),
                "is_priority": bool(row["is_ar_priority"]),
                "status": row["execution_status"]
            })

        return {
            "sector_breakdown": sector_financials,
            "top_ar_accounts": ar_list,
            "total_ar": float(df["amount_receivable"].sum()),
            "priority_ar_total": float(df[df["is_ar_priority"]]["amount_receivable"].sum())
        }

    def get_operations_analytics(self, sector_filter: Optional[str] = None) -> Dict[str, Any]:
        """Analyzes execution velocity, bottlenecks, and software platform adoption."""
        _, wo_df = self._get_dfs()
        df = wo_df.copy()
        if sector_filter:
            df = df[df["canonical_sector"].str.lower().str.contains(sector_filter.lower())]

        status_counts = []
        for status, grp in df.groupby("execution_status"):
            status_counts.append({
                "status": status,
                "count": len(grp),
                "contract_value": float(grp["contract_amount_incl_gst"].sum())
            })
        status_counts.sort(key=lambda x: x["count"], reverse=True)

        # Software adoption by sector
        software_by_sector = []
        for sector, grp in df.groupby("canonical_sector"):
            sw_count = int(grp["has_software"].sum())
            software_by_sector.append({
                "sector": sector,
                "total_orders": len(grp),
                "software_orders": sw_count,
                "adoption_percent": round((sw_count / len(grp) * 100.0), 1) if len(grp) > 0 else 0.0
            })
        software_by_sector.sort(key=lambda x: x["software_orders"], reverse=True)

        return {
            "status_distribution": status_counts,
            "software_adoption": software_by_sector,
            "total_work_orders": len(df)
        }

    def get_cross_board_correlations(self, sector_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Cross-correlates Sales Won Deals with Operational Work Orders.
        """
        deals_df, wo_df = self._get_dfs()
        
        won_deals = deals_df[deals_df["deal_status"].str.lower().isin(["won", "closed won"])].copy()
        if sector_filter:
            won_deals = won_deals[won_deals["canonical_sector"].str.lower().str.contains(sector_filter.lower())]
            wo_df = wo_df[wo_df["canonical_sector"].str.lower().str.contains(sector_filter.lower())]

        won_names = set(won_deals["deal_name"].str.lower())
        wo_names = set(wo_df["deal_name"].str.lower())

        matched_names = won_names.intersection(wo_names)
        unfulfilled_wins = won_deals[~won_deals["deal_name"].str.lower().isin(wo_names)]
        unmapped_wos = wo_df[~wo_df["deal_name"].str.lower().isin(won_names)]

        won_deal_total_value = float(won_deals["deal_value"].sum())
        matched_wo_contract_value = float(wo_df[wo_df["deal_name"].str.lower().isin(matched_names)]["contract_amount_incl_gst"].sum())
        matched_wo_collected_value = float(wo_df[wo_df["deal_name"].str.lower().isin(matched_names)]["collected_amount_incl_gst"].sum())

        unfulfilled_list = []
        for _, row in unfulfilled_wins.head(10).iterrows():
            unfulfilled_list.append({
                "deal_name": row["deal_name"],
                "client_code": row["client_code"],
                "sector": row["canonical_sector"],
                "deal_value": float(row["deal_value"]),
                "actual_close_date": row["actual_close_date"] or "Unspecified"
            })

        return {
            "total_won_deals_count": len(won_deals),
            "matched_deals_in_execution": len(matched_names),
            "unfulfilled_won_deals_count": len(unfulfilled_wins),
            "unmapped_work_orders_count": len(unmapped_wos),
            "won_deals_booked_value": won_deal_total_value,
            "matched_wo_contract_value": matched_wo_contract_value,
            "matched_wo_collected_cash": matched_wo_collected_value,
            "deal_to_cash_realization_rate": round((matched_wo_collected_value / won_deal_total_value * 100.0), 1) if won_deal_total_value > 0 else 0.0,
            "unfulfilled_high_value_wins": unfulfilled_list
        }

bi_engine = BusinessIntelligenceEngine()
