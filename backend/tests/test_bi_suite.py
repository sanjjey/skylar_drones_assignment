import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.services.monday_service import monday_service
from app.services.bi_engine import bi_engine
from app.services.agent_service import agent_service
from app.services.leadership_service import leadership_service

def test_data_loading_and_normalization():
    deals_df, wo_df = monday_service.load_local_datasets()
    assert len(deals_df) > 0, "Deals dataset should not be empty"
    assert len(wo_df) > 0, "Work orders dataset should not be empty"
    
    # Check normalized columns
    assert "deal_value" in deals_df.columns
    assert "canonical_sector" in deals_df.columns
    assert "amount_receivable" in wo_df.columns
    assert "contract_amount_incl_gst" in wo_df.columns

def test_missing_values_audit():
    audit = bi_engine.get_missing_values_audit()
    assert "deals_missing_audit" in audit
    assert "work_orders_missing_audit" in audit
    assert audit["total_deals"] > 0
    assert audit["total_work_orders"] > 0

def test_agent_missing_values_query():
    res = agent_service.process_query("how are the missing values handled?")
    assert "reply" in res
    assert "Missing" in res["reply"] or "Resilience" in res["reply"]
    assert "Deals" in res["reply"] or "Work Order" in res["reply"]
    assert res["chart"] is not None

def test_agent_pie_chart_query():
    res = agent_service.process_query("generate pie chart of execution status")
    assert res["chart"] is not None
    assert res["chart"]["type"] == "pie" or res["chart"]["defaultView"] == "pie"

def test_agent_energy_query():
    res = agent_service.process_query("How's our pipeline looking for energy sector this quarter?")
    assert "reply" in res
    assert "Energy" in res["reply"] or "Powerlines" in res["reply"]
    assert res["chart"] is not None
    assert len(res["suggested_followups"]) > 0

def test_leadership_briefing():
    briefing = leadership_service.generate_leadership_briefing()
    assert "headline_kpis" in briefing
    assert "executive_summary" in briefing
    assert "strategic_risks_and_blockers" in briefing
    assert len(briefing["strategic_risks_and_blockers"]) > 0
