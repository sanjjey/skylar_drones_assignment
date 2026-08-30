import os
import httpx
import logging
import pandas as pd
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from app.config import Settings
from app.services.data_normalizer import DataResiliencePipeline

logger = logging.getLogger("monday_service")

class MondayService:
    """
    Manages communication with Monday.com GraphQL API v2,
    including authentication, dynamic board discovery, query execution,
    and automatic fallback to local sanitized cache.
    """

    def __init__(self):
        self._load_config()
        
        # State
        self.last_sync_time: Optional[datetime] = None
        self.sync_source: str = "LOCAL_FALLBACK" # 'LIVE_MONDAY_API' or 'LOCAL_FALLBACK'
        self.deals_df: Optional[pd.DataFrame] = None
        self.work_orders_df: Optional[pd.DataFrame] = None
        self.deals_audit: Dict[str, Any] = {}
        self.work_orders_audit: Dict[str, Any] = {}
        self.last_error_message: Optional[str] = None

    def _load_config(self):
        """Reloads settings from environment or .env file."""
        self.settings = Settings()
        self.api_key = self.settings.MONDAY_API_KEY.strip()
        self.api_url = self.settings.MONDAY_API_URL.strip()
        self.deals_board_id = str(self.settings.MONDAY_DEALS_BOARD_ID).strip()
        self.work_orders_board_id = str(self.settings.MONDAY_WORK_ORDERS_BOARD_ID).strip()

    def is_live_configured(self) -> bool:
        """Checks if valid Monday.com API credentials and board IDs are populated."""
        self._load_config()
        is_valid_key = bool(self.api_key and self.api_key not in ["your_monday_api_token_here", ""])
        is_valid_deals = bool(self.deals_board_id and self.deals_board_id not in ["your_deals_board_id_here", ""])
        is_valid_wo = bool(self.work_orders_board_id and self.work_orders_board_id not in ["your_work_orders_board_id_here", ""])
        return is_valid_key and is_valid_deals and is_valid_wo

    async def execute_graphql_query(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Sends a GraphQL request to Monday.com API."""
        self._load_config()
        if not self.api_key:
            raise ValueError("Monday.com API Key is not configured.")
        
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
            "API-Version": "2024-01"
        }
        
        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(self.api_url, json=payload, headers=headers)
            if resp.status_code != 200:
                raise RuntimeError(f"Monday.com HTTP Error {resp.status_code}: {resp.text}")
            
            data = resp.json()
            if "errors" in data and data["errors"]:
                err_msg = data["errors"][0].get("message", str(data["errors"]))
                raise RuntimeError(f"Monday.com GraphQL: {err_msg}")
            return data.get("data", {})

    async def fetch_board_items_live(self, board_id: str) -> pd.DataFrame:
        """
        Dynamically fetches items and column values for a Monday.com board using GraphQL.
        """
        query = """
        query GetBoardData($boardId: [ID!]) {
            boards(ids: $boardId) {
                id
                name
                columns {
                    id
                    title
                    type
                }
                items_page(limit: 500) {
                    cursor
                    items {
                        id
                        name
                        column_values {
                            id
                            text
                            value
                            type
                        }
                    }
                }
            }
        }
        """
        data = await self.execute_graphql_query(query, {"boardId": [board_id]})
        boards = data.get("boards", [])
        if not boards:
            raise ValueError(f"Board with ID '{board_id}' was not found on Monday.com.")
        
        board = boards[0]
        columns = {col["id"]: col["title"] for col in board.get("columns", [])}
        items = board.get("items_page", {}).get("items", [])

        rows = []
        for item in items:
            row_dict = {"Deal Name": item.get("name"), "Name": item.get("name")}
            for cv in item.get("column_values", []):
                col_title = columns.get(cv["id"], cv["id"])
                val = cv.get("text")
                if val is None or val == "":
                    val = cv.get("value")
                row_dict[col_title] = val
            rows.append(row_dict)
            
        return pd.DataFrame(rows)

    def load_local_datasets(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Loads and normalizes sample datasets from the local data directory."""
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        deals_path = os.path.join(data_dir, "deal_funnel_sample.csv")
        wo_path = os.path.join(data_dir, "work_order_sample.csv")

        if not os.path.exists(deals_path) or not os.path.exists(wo_path):
            raise FileNotFoundError(f"Local sample data files not found in {data_dir}")

        raw_deals = pd.read_csv(deals_path)
        try:
            raw_wo = pd.read_csv(wo_path, header=1)
            if "Deal name masked" not in raw_wo.columns and "Customer Name Code" not in raw_wo.columns:
                raw_wo = pd.read_csv(wo_path, header=0)
        except Exception:
            raw_wo = pd.read_csv(wo_path, header=0)

        clean_deals, clean_wo, joint_audit = DataResiliencePipeline.process_and_impute_datasets(raw_deals, raw_wo)

        self.deals_df = clean_deals
        self.work_orders_df = clean_wo
        self.deals_audit = joint_audit
        self.work_orders_audit = joint_audit
        self.last_sync_time = datetime.now()
        self.sync_source = "LOCAL_FALLBACK"

        logger.info("Successfully loaded and normalized local sample datasets with cross-board derivations.")
        return clean_deals, clean_wo

    async def sync_data(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Synchronizes data from Monday.com Live API if configured;
        otherwise falls back to local normalized dataset.
        """
        self._load_config()

        if self.deals_df is not None and self.work_orders_df is not None and not force_refresh:
            return self.get_sync_status()

        if self.is_live_configured():
            try:
                logger.info(f"Connecting to Monday.com Live API for Boards Deals:{self.deals_board_id}, WO:{self.work_orders_board_id}...")
                live_deals_raw = await self.fetch_board_items_live(self.deals_board_id)
                live_wo_raw = await self.fetch_board_items_live(self.work_orders_board_id)
                
                clean_deals, clean_wo, joint_audit = DataResiliencePipeline.process_and_impute_datasets(live_deals_raw, live_wo_raw)

                self.deals_df = clean_deals
                self.work_orders_df = clean_wo
                self.deals_audit = joint_audit
                self.work_orders_audit = joint_audit
                self.last_sync_time = datetime.now()
                self.sync_source = "LIVE_MONDAY_API"
                self.last_error_message = None
                
                logger.info("Successfully synced live data from Monday.com with cross-board derivations!")
                return self.get_sync_status()
            except Exception as e:
                err_str = str(e)
                logger.warning(f"Live Monday.com sync failed: {err_str}. Falling back to local data.")
                self.load_local_datasets()
                self.last_error_message = err_str
                status = self.get_sync_status()
                status["warning"] = f"Live sync failed ({err_str}). Active in resilient Fallback Cache mode."
                return status
        else:
            logger.info("Monday.com credentials not yet set. Operating in Local Fallback mode.")
            self.load_local_datasets()
            return self.get_sync_status()

    def get_sync_status(self) -> Dict[str, Any]:
        """Returns the current data source and synchronization details."""
        return {
            "source": self.sync_source,
            "is_live_connected": (self.sync_source == "LIVE_MONDAY_API"),
            "last_sync": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "deals_count": len(self.deals_df) if self.deals_df is not None else 0,
            "work_orders_count": len(self.work_orders_df) if self.work_orders_df is not None else 0,
            "deals_quality_score": self.deals_audit.get("quality_score", 0),
            "wo_quality_score": self.work_orders_audit.get("quality_score", 0),
            "deals_caveats": self.deals_audit.get("caveats", []),
            "wo_caveats": self.work_orders_audit.get("caveats", []),
            "last_error": self.last_error_message,
        }

    def get_dataframes(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Retrieves active cached DataFrames, initializing if needed."""
        if self.deals_df is None or self.work_orders_df is None:
            self.load_local_datasets()
        return self.deals_df, self.work_orders_df

# Global Singleton Service
monday_service = MondayService()
