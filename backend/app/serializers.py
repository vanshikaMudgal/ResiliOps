from datetime import datetime


def time_ago(dt: datetime | None) -> str:
    """Turn a datetime into text like '35 min ago'."""
    if dt is None:
        return "never"
    seconds = int((datetime.now() - dt).total_seconds())
    if seconds < 0:
        return "just now"
    if seconds < 60:
        return f"{seconds}s ago" if seconds > 5 else "just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'' if hours == 1 else 's'} ago"
    days = hours // 24
    return f"{days} day{'' if days == 1 else 's'} ago"


def fmt(dt: datetime | None) -> str | None:
    return dt.strftime("%Y-%m-%d %H:%M:%S") if dt else None


def app_out(a):
    return {
        "id": a.id,
        "name": a.name,
        "url": a.url,
        "status": a.status,
        "cpu": round(a.cpu, 1) if a.cpu is not None else 0,
        "memory": round(a.memory, 1) if a.memory is not None else 0,
        "uptime": round(a.uptime, 2) if a.uptime is not None else 100.0,
        "version": a.version,
        "replicas": a.replicas,
        "monitoring": a.monitoring,
        "lastDeploy": time_ago(a.last_deploy_at),
        "responseMs": a.response_ms,
        "lastCheck": time_ago(a.last_check_at),
        "lastSuccess": time_ago(a.last_success_at),
        "consecutiveFailures": a.consecutive_failures or 0,
        "statusCode": a.status_code,
        "errorMessage": a.error_message,
        "containerName": getattr(a, "container_name", None),
        "recoveryEnabled": getattr(a, "recovery_enabled", True),
    }


def deployment_out(d):
    return {
        "id": d.code,
        "app": d.app.name if d.app else "Unknown",
        "appId": d.app_id,
        "version": d.version,
        "status": d.status,
        "branch": d.branch,
        "commit": d.commit,
        "by": d.triggered_by,
        "time": time_ago(d.created_at),
        "duration": d.duration,
        "logs": d.logs,
    }


def incident_out(i):
    return {
        "id": i.code,
        "title": i.title,
        "app": i.app.name if i.app else "System",
        "appId": i.app_id,
        "type": getattr(i, "incident_type", "unknown"),
        "severity": i.severity,
        "status": i.status,
        "detectedAt": fmt(i.detected_at),
        "resolvedAt": fmt(i.resolved_at),
        "cause": i.cause,
    }


def recovery_out(r):
    return {
        "id": r.code,
        "incident": r.incident.code if r.incident else None,
        "incidentId": r.incident_id,
        "app": r.app.name if r.app else "Unknown",
        "appId": r.app_id,
        "action": r.action,
        "result": r.result,
        "target": getattr(r, "target", None),
        "status": getattr(r, "execution_status", "SUCCESS"),
        "startedAt": fmt(getattr(r, "started_at", r.created_at)),
        "completedAt": fmt(getattr(r, "completed_at", None)),
        "errorMessage": getattr(r, "error_message", None),
        "attempts": getattr(r, "attempts", 1),
        "time": time_ago(r.created_at),
        "details": r.details,
    }


def policy_out(p):
    if not p:
        return {
            "autoRecoveryEnabled": True,
            "allowRestart": True,
            "allowRollback": True,
            "allowScaling": True,
            "maxAttempts": 3,
            "cooldownSeconds": 60,
        }
    return {
        "autoRecoveryEnabled": p.auto_recovery_enabled,
        "allowRestart": p.allow_restart,
        "allowRollback": p.allow_rollback,
        "allowScaling": p.allow_scaling,
        "maxAttempts": p.max_attempts,
        "cooldownSeconds": p.cooldown_seconds,
    }


def activity_out(a):
    return {"type": a.type, "message": a.message, "time": time_ago(a.created_at)}


def metric_out(m):
    return {
        "time": m.label,
        "cpu": round(m.cpu, 1),
        "memory": round(m.memory, 1),
        "response": round(m.response, 1),
    }


def log_out(l):
    return {
        "id": l.id,
        "level": l.level,
        "source": l.source,
        "message": l.message,
        "details": l.details,
        "time": time_ago(l.created_at),
        "timestamp": fmt(l.created_at),
    }


def settings_out(s):
    if s is None:
        return {"cpu": 80, "memory": 85, "failures": 3, "interval": 30, "response": 500}
    return {
        "cpu": s.cpu_threshold,
        "memory": s.memory_threshold,
        "failures": s.failure_threshold,
        "interval": s.interval_seconds,
        "response": getattr(s, "response_threshold", 500),
    }
