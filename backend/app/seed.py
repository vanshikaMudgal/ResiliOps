import math
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (
    Activity, Application, DetectionSettings, Deployment,
    Incident, MetricPoint, RecoveryAction,
)


def ago(minutes: int) -> datetime:
    return datetime.now() - timedelta(minutes=minutes)


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(func.count(Application.id))) > 0:
        return  # already seeded

    # (name, url, status, cpu, memory, uptime, version, replicas, monitoring, deployed_min_ago, response_ms)
    apps_data = [
        ("Payment Service", "http://payment-svc:8000/health", "healthy", 42, 61, 99.98, "v2.4.1", 3, True, 120, 118),
        ("Order API", "http://order-api:8000/health", "degraded", 87, 74, 98.9, "v1.9.0", 4, True, 35, 640),
        ("Auth Service", "http://auth-svc:8000/health", "healthy", 28, 45, 99.99, "v3.0.2", 2, True, 1440, 74),
        ("Notification Worker", "http://notify:8000/health", "down", 0, 0, 94.2, "v1.2.5", 0, True, 180, 0),
        ("Inventory Service", "http://inventory:8000/health", "healthy", 36, 52, 99.95, "v2.1.0", 2, False, 2880, 96),
        ("Web Frontend", "http://frontend:80/", "healthy", 18, 33, 100, "v5.4.0", 3, True, 300, 45),
    ]
    apps = {}
    for n, url, st, cpu, mem, up, ver, rep, mon, dep_ago, resp in apps_data:
        a = Application(name=n, url=url, status=st, cpu=cpu, memory=mem, uptime=up, version=ver,
                        replicas=rep, monitoring=mon, last_deploy_at=ago(dep_ago), response_ms=resp)
        db.add(a)
        apps[n] = a
    db.flush()  # assigns ids

    # Deployments, oldest first (code, app, version, status, branch, commit, by, minutes_ago, duration, logs)
    deployments = [
        ("DEP-1038", "Order API", "v1.8.9", "rolled_back", "main", "41d2c90", "self-healing", 1440, "0m 40s",
         ["[monitor] Error rate 38% after deploy", "[heal] Rollback triggered",
          "[k8s] kubectl rollout undo deployment/order-api", "[done] Rolled back to v1.8.8"]),
        ("DEP-1039", "Payment Service", "v2.4.1", "success", "release", "77ab3f4", "github-actions", 120, "1m 31s",
         ["[ci] Tests passed", "[docker] Image built", "[k8s] Rollout complete", "[done] Deployment successful"]),
        ("DEP-1040", "Web Frontend", "v5.4.0", "success", "main", "9c0d1ee", "priya", 300, "2m 05s",
         ["[ci] npm ci", "[ci] npm run build", "[docker] Building image frontend:v5.4.0",
          "[k8s] Rollout complete", "[done] Deployment successful"]),
        ("DEP-1041", "Notification Worker", "v1.2.5", "failed", "main", "be71d08", "github-actions", 180, "0m 52s",
         ["[ci] Checkout repository", "[ci] Running unit tests... 22 passed, 2 failed",
          "[ERROR] test_queue_connection failed", "[done] Pipeline aborted"]),
        ("DEP-1042", "Order API", "v1.9.0", "success", "main", "a3f9c21", "github-actions", 35, "1m 48s",
         ["[ci] Checkout repository", "[ci] Running unit tests... 24 passed",
          "[docker] Building image order-api:v1.9.0", "[docker] Pushing image",
          "[k8s] kubectl apply -f deployment.yaml", "[k8s] Rollout complete", "[done] Deployment successful"]),
    ]
    for code, app, ver, st, br, commit, by, m, dur, logs in deployments:
        db.add(Deployment(code=code, app_id=apps[app].id, version=ver, status=st, branch=br,
                          commit=commit, triggered_by=by, created_at=ago(m), duration=dur, logs=logs))

    # Incidents, oldest first (code, title, app, severity, status, detected_min_ago, resolved_after_min, cause)
    incidents = [
        ("INC-299", "Repeated failures: Auth Service", "Auth Service", "low", "resolved", 2880, 5, "3 failed health checks"),
        ("INC-300", "Failed deployment: Order API v1.8.9", "Order API", "high", "resolved", 1100, 2, "Error rate spike after deployment"),
        ("INC-301", "High memory usage: Payment Service", "Payment Service", "medium", "resolved", 660, 3, "Memory above 80% threshold"),
        ("INC-302", "Slow response time: Order API", "Order API", "medium", "investigating", 102, None, "Response time above 500 ms"),
        ("INC-303", "High CPU utilization: Order API", "Order API", "high", "investigating", 95, None, "CPU above 85% threshold for 3 minutes"),
        ("INC-304", "Application down: Notification Worker", "Notification Worker", "critical", "open", 70, None, "Health check failed 5 times in a row"),
    ]
    inc = {}
    for code, title, app, sev, st, m, res, cause in incidents:
        detected = ago(m)
        i = Incident(code=code, title=title, app_id=apps[app].id, severity=sev, status=st,
                     detected_at=detected, resolved_at=detected + timedelta(minutes=res) if res else None, cause=cause)
        db.add(i)
        inc[code] = i
    db.flush()

    # Recovery actions (code, incident, app, action, result, minutes_ago, details)
    actions = [
        ("REC-84", "INC-299", "Auth Service", "Container Restart", "success", 2877, "Container auth-svc restarted"),
        ("REC-85", "INC-300", "Order API", "Rollback", "success", 1097, "Rolled back v1.8.9 → v1.8.8"),
        ("REC-86", "INC-301", "Payment Service", "Pod Restart", "success", 657, "Pod payment-svc-7d9f restarted"),
        ("REC-87", "INC-303", "Order API", "Autoscale", "success", 93, "Replicas scaled 2 → 4"),
        ("REC-88", "INC-304", "Notification Worker", "Container Restart", "failed", 69, "Restart attempted, container exited with code 1"),
    ]
    for code, i, app, action, res, m, details in actions:
        db.add(RecoveryAction(code=code, incident_id=inc[i].id, app_id=apps[app].id, action=action,
                              result=res, created_at=ago(m), details=details))

    # Activity feed (type, message, minutes_ago)
    for t, msg, m in [
        ("incident", "Incident INC-301 resolved automatically", 657),
        ("deploy", "Payment Service v2.4.1 deployed successfully", 120),
        ("deploy", "Order API v1.9.0 deployed successfully", 35),
        ("heal", "Order API autoscaled from 2 to 4 replicas", 93),
        ("heal", "Container restart failed for Notification Worker", 69),
        ("incident", "Incident INC-304 opened for Notification Worker", 70),
    ]:
        db.add(Activity(type=t, message=msg, created_at=ago(m)))

    # Sample metric time-series (same formula as the Phase 1 chart)
    for i in range(20):
        db.add(MetricPoint(
            label=f"{9 + (i * 3) // 60:02d}:{(i * 3) % 60:02d}",
            cpu=45 + 15 * math.sin(i / 2.2) + (22 if i > 13 else 0),
            memory=55 + 8 * math.cos(i / 3) + i * 0.6,
            response=130 + 40 * math.sin(i / 1.7) + (320 if i > 13 else 0),
        ))

    db.add(DetectionSettings(id=1, cpu_threshold=80, memory_threshold=85, failure_threshold=3, interval_seconds=30))
    db.commit()