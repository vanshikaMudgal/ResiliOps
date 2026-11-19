import asyncio
from fastapi import APIRouter, Response

from .monitoring import demo_target_state

router = APIRouter(prefix="/api/test", tags=["Demo Target Applications"])


@router.get("/sample-app/health")
async def sample_app_health():
    """
    Simulated target application endpoint whose behavior can be toggled
    between healthy (200), failing (500), and slow (>500ms) for viva demonstration.
    """
    state = demo_target_state["status"]
    code = demo_target_state["status_code"]
    latency = demo_target_state["latency_ms"]

    if state == "slow":
        await asyncio.sleep(latency / 1000.0)

    payload = f'{{"app": "Sample App", "status": "{state}", "statusCode": {code}, "simulatedLatency": {latency}}}'
    return Response(content=payload, status_code=code, media_type="application/json")


@router.get("/healthy-service/health")
def healthy_service():
    """Consistently healthy microservice mock endpoint."""
    return {"status": "ok", "service": "healthy-service", "code": 200}


@router.get("/failing-service/health")
def failing_service():
    """Consistently failing microservice mock endpoint (returns 500 Internal Server Error)."""
    return Response(
        content='{"status": "error", "service": "failing-service", "code": 500, "message": "Database connection failed"}',
        status_code=500,
        media_type="application/json",
    )

