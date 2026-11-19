import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (importing registers the tables)
from .config import config
from .database import Base, SessionLocal, engine
from .routers import (
    applications,
    deployments,
    incidents,
    infrastructure,
    monitoring,
    overview,
    recovery,
    settings,
    test_app,
)
from .seed import seed_if_empty
from .services.background_runner import background_monitoring_loop
from .services.prometheus_exporter import export_metrics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup: create tables, then add sample data if the DB is empty.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_if_empty(db)

    # Phase 3: Launch the autonomous background monitoring & failure detection loop
    monitoring_task = asyncio.create_task(background_monitoring_loop())

    yield

    # Clean shutdown of background monitoring
    monitoring_task.cancel()
    try:
        await monitoring_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="ResiliOps API", version="0.3.0", lifespan=lifespan)

# CORS: allow frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.frontend_origin, "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register existing and Phase 3 routers
for module in (
    applications,
    deployments,
    incidents,
    recovery,
    overview,
    settings,
    infrastructure,
    monitoring,
    test_app,
):
    app.include_router(module.router)


@app.get("/metrics", tags=["Prometheus"])
def prometheus_metrics():
    """Prometheus scrape endpoint: exposes application, system, and incident metrics."""
    data, content_type = export_metrics()
    return Response(content=data, media_type=content_type)


@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok", "service": "resiliops-api", "version": "0.3.0"}
