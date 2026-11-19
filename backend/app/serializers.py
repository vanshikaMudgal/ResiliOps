from datetime import datetime


def time_ago(dt: datetime | None) -> str:
    """Turn a datetime into text like '35 min ago'."""
    if dt is None:
        return "never"
    seconds = int((datetime.now() - dt).total_seconds())
    if seconds < 60:
        return "just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'' if hours == 1 else 's'} ago"
    days = hours // 24
    return f"{days} day{'' if days == 1 else 's'} ago"


def fmt(dt: datetime | None) -> str | None:
    return dt.strftime("%Y-%m-%d %H:%M") if dt else None


def app_out(a):
    return {
        "id": a.id,
        "name": a.name,
        "url": a.url,
        "status": a.status,
        "cpu": round(a.cpu),
        "memory": round(a.memory),
        "uptime": a.uptime,
        "version": a.version,
        "replicas": a.replicas,
        "monitoring": a.monitoring,
        "lastDeploy": time_ago(a.last_deploy_at),
        "responseMs": a.response_ms,
    }


def deployment_out(d):
    return {
        "id": d.code,
        "app": d.app.name,
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
        "app": i.app.name,
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
        "app": r.app.name,
        "action": r.action,
        "result": r.result,
        "time": time_ago(r.created_at),
        "details": r.details,
    }


def activity_out(a):
    return {"type": a.type, "message": a.message, "time": time_ago(a.created_at)}


def metric_out(m):
    return {"time": m.label, "cpu": round(m.cpu), "memory": round(m.memory), "response": round(m.response)}


def settings_out(s):
    return {
        "cpu": s.cpu_threshold,
        "memory": s.memory_threshold,
        "failures": s.failure_threshold,
        "interval": s.interval_seconds,
    }