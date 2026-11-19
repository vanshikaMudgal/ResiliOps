from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (importing registers the tables)
from .config import config
from .database import Base, SessionLocal, engine
from .routers import applications, deployments, incidents, infrastructure, overview, recovery, settings
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup: create tables, then add sample data if the DB is empty.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


app = FastAPI(title="ResiliOps API", version="0.2.0", lifespan=lifespan)

# CORS: browsers block a page on :5173 from calling an API on :8000 unless the API allows it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.frontend_origin, "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (applications, deployments, incidents, recovery, overview, settings, infrastructure):
    app.include_router(module.router)


@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok", "service": "resiliops-api"}