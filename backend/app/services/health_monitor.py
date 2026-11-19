import time
from datetime import datetime
import httpx
from sqlalchemy.orm import Session

from ..models import Application, DetectionSettings, MonitoringLog
from .prometheus_exporter import (
    APP_STATUS,
    HEALTHCHECK_FAILURES_TOTAL,
    APP_RESPONSE_TIME_SECONDS,
)


class HealthMonitor:
    """
    Performs asynchronous and synchronous HTTP health checks on registered applications.
    Tracks status, latency, timestamps, and consecutive failure counts.
    """

    @staticmethod
    async def check_application(
        app: Application, client: httpx.AsyncClient, settings: DetectionSettings
    ) -> dict:
        """
        Sends an HTTP GET request to app.url, measures roundtrip latency,
        and computes new health parameters.
        """
        start = time.perf_counter()
        now = datetime.now()
        is_success = False
        status_code = None
        error_msg = None
        latency_ms = 0

        try:
            # 3 second timeout for health check requests
            response = await client.get(app.url, timeout=3.0)
            latency_ms = int((time.perf_counter() - start) * 1000)
            status_code = response.status_code

            # HTTP 200..299 counts as healthy response
            if 200 <= response.status_code < 300:
                is_success = True
            else:
                error_msg = f"HTTP {response.status_code}: {response.reason_phrase}"
        except httpx.ConnectError:
            latency_ms = int((time.perf_counter() - start) * 1000)
            status_code = 503
            error_msg = "Connection refused / host unreachable"
        except httpx.TimeoutException:
            latency_ms = 3000
            status_code = 504
            error_msg = "Health check timed out (>3000ms)"
        except Exception as ex:
            latency_ms = int((time.perf_counter() - start) * 1000)
            status_code = 500
            error_msg = f"Network error: {str(ex)[:100]}"

        return {
            "app_id": app.id,
            "app_name": app.name,
            "url": app.url,
            "is_success": is_success,
            "status_code": status_code,
            "response_ms": latency_ms,
            "error_msg": error_msg,
            "checked_at": now,
        }

    @staticmethod
    def apply_check_result(
        db: Session,
        app: Application,
        result: dict,
        settings: DetectionSettings,
    ) -> None:
        """
        Updates application database fields and Prometheus metrics according to check results.
        """
        prev_status = app.status
        app.last_check_at = result["checked_at"]
        app.status_code = result["status_code"]
        app.response_ms = result["response_ms"]
        app.error_message = result["error_msg"]

        # Update Prometheus latency metric
        APP_RESPONSE_TIME_SECONDS.labels(app_name=app.name).set(result["response_ms"] / 1000.0)

        failure_threshold = settings.failure_threshold if settings else 3
        response_threshold = getattr(settings, "response_threshold", 500)

        if result["is_success"]:
            app.consecutive_failures = 0
            app.last_success_at = result["checked_at"]

            # If response time exceeds threshold, mark degraded
            if app.response_ms > response_threshold:
                app.status = "degraded"
            else:
                app.status = "healthy"

            # Set Prometheus UP gauge
            APP_STATUS.labels(app_name=app.name, app_id=str(app.id), url=app.url).set(1.0)

            # Log recovery if it was down previously
            if prev_status == "down":
                db.add(
                    MonitoringLog(
                        level="INFO",
                        source="health_check",
                        message=f"{app.name} is now UP and responding",
                        details=f"Status: {result['status_code']} | Latency: {app.response_ms}ms",
                        created_at=result["checked_at"],
                    )
                )
        else:
            app.consecutive_failures = (app.consecutive_failures or 0) + 1
            HEALTHCHECK_FAILURES_TOTAL.labels(app_name=app.name).inc()

            # If consecutive failures >= threshold, mark down, else degraded
            if app.consecutive_failures >= failure_threshold:
                app.status = "down"
                APP_STATUS.labels(app_name=app.name, app_id=str(app.id), url=app.url).set(0.0)
            else:
                app.status = "degraded"

            # Log check failure
            db.add(
                MonitoringLog(
                    level="WARN" if app.consecutive_failures < failure_threshold else "ERROR",
                    source="health_check",
                    message=f"Health check failed for {app.name} ({app.consecutive_failures}/{failure_threshold})",
                    details=f"Code: {result['status_code']} | Error: {result['error_msg']}",
                    created_at=result["checked_at"],
                )
            )

        db.commit()

