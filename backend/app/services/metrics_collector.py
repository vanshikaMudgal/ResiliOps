import os
import time
from datetime import datetime
import psutil
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from ..models import MetricPoint
from .prometheus_exporter import (
    SYSTEM_CPU_PERCENT,
    SYSTEM_MEMORY_PERCENT,
    SYSTEM_MEMORY_AVAILABLE_BYTES,
)

# Cache initial CPU check to avoid blocking
psutil.cpu_percent(interval=None)


class MetricsCollector:
    """
    Collects real-time host and process metrics via psutil.
    Maintains a rolling time-series window in SQLite for React dashboard charts.
    """

    @staticmethod
    def get_system_metrics() -> dict:
        """
        Gathers genuine host system CPU and RAM metrics via psutil.
        Distinguishes actual host machine metrics from application-level metrics.
        """
        # Non-blocking CPU reading
        cpu_total = psutil.cpu_percent(interval=None)
        cpu_cores = psutil.cpu_percent(percpu=True, interval=None)

        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()

        # Update Prometheus system gauges
        SYSTEM_CPU_PERCENT.labels(type="host").set(cpu_total)
        SYSTEM_MEMORY_PERCENT.labels(type="host").set(mem.percent)
        SYSTEM_MEMORY_AVAILABLE_BYTES.set(mem.available)

        return {
            "source": "psutil_host",
            "cpu": {
                "percent": round(cpu_total, 1),
                "core_count": psutil.cpu_count(logical=True),
                "physical_cores": psutil.cpu_count(logical=False) or 1,
                "per_core": [round(c, 1) for c in cpu_cores],
            },
            "memory": {
                "percent": round(mem.percent, 1),
                "total_mb": round(mem.total / (1024 * 1024), 1),
                "available_mb": round(mem.available / (1024 * 1024), 1),
                "used_mb": round(mem.used / (1024 * 1024), 1),
                "free_mb": round(mem.free / (1024 * 1024), 1),
                "total_gb": round(mem.total / (1024**3), 2),
                "used_gb": round(mem.used / (1024**3), 2),
            },
            "swap": {
                "percent": round(swap.percent, 1),
                "total_mb": round(swap.total / (1024 * 1024), 1),
                "used_mb": round(swap.used / (1024 * 1024), 1),
            },
            "timestamp": datetime.now().isoformat(),
        }

    @staticmethod
    def get_process_metrics() -> dict:
        """Collects process-level metrics for the running ResiliOps backend process."""
        proc = psutil.Process(os.getpid())
        with proc.oneshot():
            cpu = proc.cpu_percent(interval=None)
            mem_info = proc.memory_info()
            num_threads = proc.num_threads()
            create_time = proc.create_time()

        uptime_seconds = int(time.time() - create_time)

        return {
            "pid": proc.pid,
            "cpu_percent": round(cpu, 1),
            "memory_rss_mb": round(mem_info.rss / (1024 * 1024), 2),
            "memory_percent": round(proc.memory_percent(), 2),
            "threads": num_threads,
            "uptime_seconds": uptime_seconds,
        }

    @staticmethod
    def record_metric_point(db: Session, avg_response_ms: float = 0.0) -> MetricPoint:
        """
        Inserts a live data point into MetricPoint and caps table at 30 rows
        to ensure live dashboard charts render smooth, real-time telemetry.
        """
        metrics = MetricsCollector.get_system_metrics()
        now = datetime.now()
        time_label = now.strftime("%H:%M:%S")

        point = MetricPoint(
            label=time_label,
            cpu=metrics["cpu"]["percent"],
            memory=metrics["memory"]["percent"],
            response=round(avg_response_ms, 1),
            created_at=now,
        )
        db.add(point)
        db.flush()

        # Prune old points keeping the most recent 30
        total_points = db.scalar(select(func.count(MetricPoint.id)))
        if total_points > 30:
            excess = total_points - 30
            old_ids = db.scalars(
                select(MetricPoint.id).order_by(MetricPoint.id.asc()).limit(excess)
            ).all()
            for old_id in old_ids:
                row = db.get(MetricPoint, old_id)
                if row:
                    db.delete(row)

        db.commit()
        return point

