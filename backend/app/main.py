import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.agent_routes import router as agent_router
from app.routes.bi_routes import router as bi_router
from app.routes.monday_routes import router as monday_router
from app.routes.leadership_routes import router as leadership_router
from app.routes.session_routes import router as session_router
from app.services.monday_service import monday_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("main")

# Auto-initialize local datasets on boot/import
try:
    monday_service.load_local_datasets()
except Exception as e:
    logger.warning(f"Initial dataset load note: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Skylark Drones BI Agent and caching board datasets...")
    try:
        await monday_service.sync_data(force_refresh=False)
    except Exception as e:
        logger.warning(f"Lifespan sync note: {e}")
    logger.info("Initialization complete. BI Engine ready.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-routers with /api prefix
app.include_router(agent_router, prefix=settings.API_PREFIX)
app.include_router(bi_router, prefix=settings.API_PREFIX)
app.include_router(monday_router, prefix=settings.API_PREFIX)
app.include_router(leadership_router, prefix=settings.API_PREFIX)
app.include_router(session_router, prefix=settings.API_PREFIX)

# Also register without prefix so /bi/cross-board or /api/bi/cross-board both work seamlessly
app.include_router(agent_router)
app.include_router(bi_router)
app.include_router(monday_router)
app.include_router(leadership_router)
app.include_router(session_router)

@app.get("/health")
@app.get("/api/health")
async def health_check():
    sync = monday_service.get_sync_status()
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "monday_connected": sync["is_live_connected"],
        "source": sync["source"],
        "deals_count": sync["deals_count"],
        "work_orders_count": sync["work_orders_count"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
