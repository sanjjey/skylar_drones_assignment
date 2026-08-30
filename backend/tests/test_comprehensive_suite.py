import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import asyncio
from app.services.monday_service import monday_service
from app.services.bi_engine import bi_engine
from app.services.agent_service import agent_service
from app.services.leadership_service import leadership_service
from app.services.supabase_service import supabase_service

class TestSkylarkBIAgentComprehensive:
    """
    Comprehensive test suite verifying query understanding, deterministic calculations,
    chart type selection, missing value imputation, timeline trends, session renaming, undo,
    and derived values scrollable table.
    """

    @classmethod
    def setup_class(cls):
        cls.deals_df, cls.wo_df = monday_service.load_local_datasets()

    def test_1_dataset_integrity_and_imputation(self):
        """Verifies dataset rows, columns, and derivation flags."""
        assert len(self.deals_df) == 346
        assert len(self.wo_df) == 176
        assert "deal_value_derivation" in self.deals_df.columns
        assert "probability_derivation" in self.deals_df.columns
        assert "amount_receivable" in self.wo_df.columns
        assert (self.deals_df["deal_value"] >= 0).all()
        assert (self.deals_df["closure_probability"] >= 0).all()

    def test_2_derived_missing_values_scrollable_table_query(self):
        """Tests: 'What are the derived values that are missing in a scrollable table'"""
        res = agent_service.process_query("What are the derived values that are missing in a scrollable table")
        assert res["reply"] is not None
        assert "3-Tier" in res["reply"] or "Derivation" in res["reply"]
        assert res["chart"] is not None
        assert res["chart"]["type"] == "table" or res["chart"]["defaultView"] == "table"
        assert len(res["chart"]["data"]) > 0
        assert "Record" in res["chart"]["data"][0]
        assert "Derived Value" in res["chart"]["data"][0]
        assert "Tier" in res["chart"]["data"][0]

    def test_3_missing_values_audit_query(self):
        """Tests: 'how are the missing values handled?'"""
        res = agent_service.process_query("how are the missing values handled?")
        assert res["reply"] is not None
        assert "Deals Funnel" in res["reply"] or "Work Order" in res["reply"]
        assert res["chart"] is not None
        assert len(res["chart"]["data"]) > 0

    def test_4_tentative_dates_trend_query(self):
        """Tests: 'can you show the tentative dates for different sectors using trend'"""
        res = agent_service.process_query("can you show the tentative dates for different sectors using trend")
        assert res["reply"] is not None
        assert "Pipeline Forecast" in res["reply"] or "Tentative" in res["reply"]
        assert res["chart"] is not None
        assert res["chart"]["type"] == "area" or res["chart"]["defaultView"] == "area"
        assert len(res["chart"]["data"]) > 0
        assert "quarter" in res["chart"]["data"][0]

    def test_5_pie_chart_execution_status(self):
        """Tests: 'generate pie chart of work orders by execution status'"""
        res = agent_service.process_query("generate pie chart of work orders by execution status")
        assert res["chart"] is not None
        assert res["chart"]["type"] == "pie" or res["chart"]["defaultView"] == "pie"
        assert len(res["chart"]["data"]) > 0

    def test_6_pie_chart_pipeline_sectors(self):
        """Tests: 'generate pie chart of active pipeline by sector'"""
        res = agent_service.process_query("generate pie chart of active pipeline by sector")
        assert res["chart"] is not None
        assert res["chart"]["type"] == "pie" or res["chart"]["defaultView"] == "pie"

    def test_7_energy_sector_pipeline(self):
        """Tests: 'How's our pipeline looking for the energy sector this quarter?'"""
        res = agent_service.process_query("How's our pipeline looking for the energy sector this quarter?")
        assert "Energy" in res["reply"] or "Powerlines" in res["reply"]
        assert res["chart"] is not None

    def test_8_revenue_and_outstanding_ar(self):
        """Tests: 'What is our total outstanding AR and priority accounts?'"""
        res = agent_service.process_query("What is our total outstanding AR and priority accounts?")
        assert "Accounts Receivable" in res["reply"] or "AR" in res["reply"]
        assert res["chart"] is not None

    def test_9_cross_board_reconciliation(self):
        """Tests: 'Correlate our closed-won deals with work order execution status'"""
        res = agent_service.process_query("Correlate our closed-won deals with work order execution status")
        assert "Closed-Won" in res["reply"] or "Cross-Board" in res["reply"]

    def test_10_operations_and_software_attach(self):
        """Tests: 'Show operational execution bottlenecks and software platform attach rate'"""
        res = agent_service.process_query("Show operational execution bottlenecks and software platform attach rate")
        assert "Work Orders" in res["reply"] or "Software" in res["reply"]
        assert res["chart"] is not None

    def test_11_leadership_briefing_generation(self):
        """Tests: 'Prepare data for leadership update briefing'"""
        res = agent_service.process_query("Prepare data for leadership update briefing")
        assert "Leadership" in res["reply"] or "Executive" in res["reply"]
        assert res["chart"] is not None
        assert len(res["suggested_followups"]) > 0

    @pytest.mark.asyncio
    async def test_12_session_rename_and_undo(self):
        """Tests session creation, title renaming, message truncation for undo."""
        sess = await supabase_service.create_session("Initial Title")
        sid = sess["id"]
        
        # Rename
        updated = await supabase_service.update_session_title(sid, "Renamed Executive Inquiry")
        assert updated["title"] == "Renamed Executive Inquiry"

        # Save messages
        await supabase_service.save_message(sid, "user", "Hello")
        await supabase_service.save_message(sid, "assistant", "Hi there")
        
        msgs = await supabase_service.get_session_messages(sid)
        assert len(msgs) == 2

        # Truncate / Undo
        await supabase_service.truncate_messages_from_index(sid, 1)
        msgs_after = await supabase_service.get_session_messages(sid)
        assert len(msgs_after) == 1
