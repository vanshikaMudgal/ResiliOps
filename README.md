# ResiliOps – Cloud-Native DevOps Automation & Self-Healing Platform

[![Build & Test](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)]()
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-5_Services-2496ED.svg?logo=docker&logoColor=white)]()
[![Prometheus](https://img.shields.io/badge/Prometheus-v3.x-E6522C.svg?logo=prometheus&logoColor=white)]()
[![Grafana](https://img.shields.io/badge/Grafana-v11.x-F46800.svg?logo=grafana&logoColor=white)]()
[![Terraform](https://img.shields.io/badge/Terraform-Local_Docker-7B42BC.svg?logo=terraform&logoColor=white)]()
[![License](https://img.shields.io/badge/License-Academic_Evaluation-blue.svg)]()

> **College Internal Examination & Viva Voce Project**  
> Department of Computer Science & Engineering  
> Academic Year: 2025 – 2026

---

## 1. Project Title
**ResiliOps – Cloud-Native DevOps Automation and Self-Healing Platform**

---

## 2. Project Introduction
**ResiliOps** is an autonomous, cloud-native DevOps automation and self-healing supervisory platform. Designed as a complete, practical implementation of Site Reliability Engineering (SRE) and closed-loop autonomic computing, ResiliOps continuously monitors microservices, detects anomalies in real-time, automatically executes infrastructure recovery operations (such as container reboots, version rollbacks, and horizontal autoscaling), and exports open-standard telemetry to Prometheus and Grafana.

---

## 3. Problem Statement
In microservice architectures, transient infrastructure glitches, memory leaks, and bad deployments frequently cause unexpected outages. In traditional environments:
- Incidents remain undetected until customers file bug reports, resulting in elevated Mean Time to Detection (MTTD).
- Remediation requires manual triage and shell command execution by SRE engineers, causing long Mean Time to Recovery (MTTR).
- Operators attempting manual restarts risk typographical errors and command thrashing.
- Existing enterprise SRE tools (Datadog, Dynatrace, PagerDuty) are closed-source and require expensive cloud subscriptions not feasible for academic labs.

---

## 4. Proposed Solution
ResiliOps bridges observability and automated remediation by implementing a closed-loop control system:
$$\text{Sense (Probing)} \longrightarrow \text{Analyze (Failure Detection)} \longrightarrow \text{Decide (Policy Engine)} \longrightarrow \text{Act (Self-Healing)} \longrightarrow \text{Verify (Health Validation)}$$

- Continuous asynchronous health probing and host CPU/RAM tracking via `psutil`.
- Intelligent failure detection with automated severity assignment and duplicate incident suppression.
- Non-blocking container self-healing via the local Docker daemon socket in **< 3 seconds**.
- Deployment rollbacks to previous known-good version tags.
- Guardrailed autoscaling enforcing minimum and maximum replica limits.
- Zero-cost, 100% local operation using Docker Compose, Minikube manifests, and local Terraform providers.

---

## 5. Objectives
1. **Automated Health Monitoring:** Continuously ping registered microservices, track response latency, and monitor host resources.
2. **Intelligent Failure Detection:** Identify application downtime, consecutive HTTP errors, high CPU load, and memory saturation using configurable thresholds without generating duplicate incidents.
3. **Autonomous Remediation:** Execute automated container restarts, Kubernetes pod evictions, deployment rollbacks, and horizontal replica scaling.
4. **Unified Telemetry:** Expose standard OpenMetrics format endpoints for Prometheus and render dynamic visual panels in Grafana.
5. **Zero-Cloud Dependency:** Orchestrate the entire platform locally using Docker Compose, Minikube, and local Terraform providers without incurring financial cloud expenses.

---

## 6. Main Features

- **Multi-Container SRE Dashboard:** Modern React 19 SPA served via production Nginx with dynamic auto-refresh.
- **Asynchronous Health Probing:** Non-blocking parallel HTTP checks using `httpx.AsyncClient`.
- **System Telemetry:** Real-time host CPU %, RAM %, memory buffers, and control plane process metrics via `psutil`.
- **Duplicate Incident Suppression:** Evaluates existing open incidents before generating alerts to prevent incident flooding.
- **Autonomous Docker Restart:** Whitelisted container restarts via `/var/run/docker.sock` using Python Docker SDK.
- **Deployment Rollback:** Instant restoration of prior stable version tags with post-rollback health checks.
- **Autoscaling Guardrails:** Safe horizontal scaling between lower bounds (min: 1) and upper bounds (max: 6).
- **Time-Series Observability:** Native Prometheus scraping and auto-provisioned Grafana dashboards.
- **Infrastructure as Code (IaC):** Modular Terraform Docker provider scripts and 7 Kubernetes declarative manifests.
- **Continuous Integration:** GitHub Actions pipelines validating Pytest suites and Docker image builds.

---

## 7. Technology Stack

| Domain | Technologies Used |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Nginx Alpine (Reverse Proxy) |
| **Backend** | Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2.0 ORM, Pydantic Settings |
| **Database** | SQLite 3 with Write-Ahead Logging (WAL mode enabled) |
| **Metrics & Telemetry** | Prometheus v3.x, Grafana v11.x, `psutil`, `prometheus_client` |
| **Containers & Orchestration** | Docker Engine 24+, Docker Compose v2+, Kubernetes / Minikube |
| **Infrastructure as Code** | Terraform v1.5+ with `kreuzwerker/docker` provider v3.0.2 |
| **Testing & CI/CD** | Pytest 8.x, GitHub Actions (`ci.yml`, `docker-build.yml`, `deploy.yml`) |

---

## 8. System Architecture

```mermaid
flowchart TD
    User([Examiner / Student Browser]) -->|Port 5173| FE[Nginx React Frontend]
    User -->|Port 3000| GRAF[Grafana Telemetry Dashboard]
    User -->|Port 9090| PROM[Prometheus Scraper UI]

    subgraph ResiliOps Platform Network (resiliops-network)
        FE -->|Reverse Proxy /api/ and /metrics| BE[FastAPI Backend Control Plane]
        BE -->|ACID Transactions| DB[(Persistent SQLite Volume)]
        BE -->|UNIX Socket| SOCK[/var/run/docker.sock/]
        
        subgraph Engine Subsystems
            PROBER[Health Prober]
            DETECTOR[Failure Detector]
            RECOVERY[Self-Healing Engine]
        end

        BE --- PROBER
        BE --- DETECTOR
        BE --- RECOVERY
    end

    subgraph Managed Infrastructure
        SOCK -.->|Restart Container| TARGET[resiliops-sample-app :8001]
        SOCK -.->|Terraform IaC| TF_APP[resiliops_tf_demo_app :8085]
    end

    PROM -->|Scrape /metrics every 5s| BE
    PROM -->|Scrape /health| TARGET
    GRAF -->|PromQL Queries| PROM
```

---

## 9. Project Folder Structure

```text
ResiliOps/
├── .dockerignore                    # Docker build context exclusions
├── .env.example                     # Environment configuration template
├── .gitignore                       # Git exclusions (caches, db, terraform state)
├── docker-compose.yml               # Unified orchestrator (5 services)
├── pytest.ini                       # Pytest test discovery configuration
├── README.md                        # Master project documentation
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Automated Pytest and Node build workflow
│       ├── docker-build.yml         # Container build verification workflow
│       └── deploy.yml               # CD automated release simulation workflow
├── backend/
│   ├── Dockerfile                   # Python 3.12-slim control plane container
│   ├── requirements.txt             # FastAPI, Docker SDK, K8s client, Pytest
│   ├── app/
│   │   ├── main.py                  # Application entry point & router registration
│   │   ├── config.py                # Pydantic environment configuration
│   │   ├── database.py              # SQLite session factory & WAL mode
│   │   ├── models.py                # SQLAlchemy ORM entities
│   │   ├── seed.py                  # Initial seed data for apps & deployments
│   │   ├── routers/                 # Modular REST API endpoints
│   │   └── services/                # Health monitoring, failure detection, recovery
│   └── tests/
│       └── test_api.py              # 6 automated Pytest unit/integration tests
├── frontend/
│   ├── Dockerfile                   # Multi-stage build (Node 22 -> Nginx Alpine)
│   ├── nginx.conf                   # SPA fallback + /api/ & /metrics reverse proxy
│   ├── package.json                 # React dependencies
│   └── src/                         # React components, pages, hooks
├── sample_app/
│   ├── Dockerfile                   # Python 3.12-alpine target microservice
│   └── main.py                      # Failure injection endpoints (/crash, /recover)
├── prometheus/
│   └── prometheus.yml               # Prometheus scrape targets configuration
├── grafana/
│   ├── dashboards/
│   │   └── resiliops-dashboard.json # Provisioned visual telemetry dashboard
│   └── provisioning/
│       ├── dashboards/dashboards.yaml
│       └── datasources/prometheus.yaml
├── k8s/                             # Declarative Kubernetes Manifests
│   ├── 00-namespace.yaml            # 'resiliops' namespace
│   ├── 01-configmap.yaml            # Centralized environment parameters
│   ├── 02-backend.yaml              # Backend Deployment + ClusterIP Service
│   ├── 03-frontend.yaml             # Frontend Deployment + NodePort 30081 Service
│   ├── 04-sample-app.yaml           # Microservice Deployment + NodePort 30080 Service
│   ├── 05-prometheus.yaml           # Prometheus Deployment + NodePort 30090 Service
│   └── 06-grafana.yaml              # Grafana Deployment + NodePort 30300 Service
├── terraform/                       # Infrastructure as Code (IaC)
│   ├── versions.tf                  # kreuzwerker/docker provider requirement
│   ├── variables.tf                 # Configurable network and container variables
│   ├── main.tf                      # Docker network and demo container definition
│   └── outputs.tf                   # Provisioned container ID and access URL
└── docs/                            # Examination Deliverables
    ├── AUDIT_AND_TEST_RESULTS.md    # End-to-end verification report (Tests A–J)
    ├── PROJECT_REPORT.md            # Full academic project report (Chapters 1–8)
    ├── PRESENTATION.md              # 20-slide college examination presentation deck
    ├── VIVA_PREPARATION.md          # 35 comprehensive viva questions & answers
    ├── DEMONSTRATION_SCRIPT.md      # Step-by-step viva demonstration script
    └── screenshots/                 # Real live screenshots captured from running app
```

---

## 10. Software and Hardware Requirements

### Hardware Requirements
- **Processor:** Quad-Core Intel Core i5 / AMD Ryzen 5 or equivalent.
- **RAM:** Minimum 8 GB (16 GB recommended for concurrent Docker Compose + Minikube).
- **Storage:** Minimum 10 GB free disk space for Docker base images and caches.

### Software Requirements
- **OS:** Linux (Ubuntu 22.04+, Debian 12+) or Windows 10/11 with WSL2.
- **Docker:** Docker Engine v24.0+ and Docker Compose v2.20+.
- **Language Runtimes:** Python 3.12+ and Node.js v20+ / npm v10+.
- **IaC & Cluster Tools:** Terraform v1.5+, `kubectl` v1.28+, Minikube (optional).

---

## 11. Installation Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/[Your-Username]/ResiliOps.git
   cd ResiliOps
   ```
2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
3. **Set Up Python Virtual Environment (Optional for local testing):**
   ```bash
   python3 -m venv backend/venv
   source backend/venv/bin/activate
   pip install -r backend/requirements.txt
   ```
4. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

## 12. Environment Setup

Copy `.env.example` to `.env`:
```env
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite:///./resiliops.db
FRONTEND_ORIGIN=http://localhost:5173
DOCKER_HOST=unix:///var/run/docker.sock
```

---

## 13. Running the Project with Docker Compose (Recommended)

### One-Click Interactive Examination Menu (Zero Commands to Remember!)
We provide an interactive terminal menu so you can run the entire demonstration without memorizing any CLI syntax:
```bash
./menu.sh
```
This opens a clean, numbered menu where you simply press a number:
- `1` to Start the entire multi-container platform
- `2` to Check status & live URLs
- `3` to Run automated Pytest unit tests
- `4` to Simulate microservice failure
- `5` to Trigger autonomous self-healing container recovery
- `6` to Demonstrate deployment rollback
- `7` to Run local Terraform IaC (apply & clean teardown)
- `8` to Open the dashboard in your browser
- `9` to Stop the platform gracefully

---

### Manual Docker Compose Execution
Start all 5 containers directly:
```bash
docker compose up -d --build
```

Verify service status:
```bash
docker compose ps
```

### Access URLs
| Service | Host URL | Description |
|---|---|---|
| **React Dashboard** | [http://localhost:5173](http://localhost:5173) | Primary SRE Web Interface |
| **FastAPI Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive REST API Documentation |
| **Prometheus Web UI** | [http://localhost:9090](http://localhost:9090) | Scrape Targets & PromQL Query Engine |
| **Grafana Dashboard** | [http://localhost:3000](http://localhost:3000) | Visual Telemetry (Login: `admin` / `admin`) |
| **Sample Microservice** | [http://localhost:8001/health](http://localhost:8001/health) | Target Microservice Endpoint |

---

## 14. Stopping the Platform
```bash
# Graceful stop, preserving persistent volumes
docker compose down

# Stop and clear volumes (clears test database)
docker compose down -v
```

---

## 15. Kubernetes Deployment (Minikube)

Deploy ResiliOps to a local Kubernetes cluster:
```bash
# 1. Start Minikube
minikube start

# 2. Apply all declarative manifests
kubectl apply -f k8s/

# 3. Verify pods and services
kubectl get pods -n resiliops
kubectl get svc -n resiliops
```

---

## 16. Terraform Infrastructure as Code (IaC)

Provision and teardown local container infrastructure using the `kreuzwerker/docker` provider:
```bash
cd terraform

# Initialize provider
terraform init

# Validate syntax
terraform validate

# Review plan
terraform plan

# Apply infrastructure (provisions demo container on port 8085)
terraform apply -auto-approve

# Test provisioned container
curl -s http://localhost:8085/health

# Clean teardown
terraform destroy -auto-approve
cd ..
```

---

## 17. Prometheus and Grafana Observability

- **Prometheus Scraper:** Configured in `prometheus/prometheus.yml` to scrape `backend:8000/metrics` and `sample-app:8000/health` every 5 seconds.
- **Grafana Provisioning:** Automatically binds Prometheus datasource and loads the pre-configured `ResiliOps Platform Monitoring & Health` dashboard (`resiliops-main`).

---

## 18. API Documentation Summary

The FastAPI backend exposes 28 REST endpoints:
- `GET /api/health`: Health status of the control plane API.
- `GET /metrics`: OpenMetrics telemetry for Prometheus.
- `GET /api/applications`: List registered microservices.
- `POST /api/applications`: Register a new microservice.
- `PATCH /api/applications/{id}/monitoring`: Enable/disable health monitoring.
- `GET /api/monitoring/overview`: Aggregated telemetry, health score, and CPU/RAM metrics.
- `POST /api/monitoring/check-now`: Trigger immediate health check cycle.
- `GET /api/incidents`: List all active and resolved incidents.
- `POST /api/recovery/execute`: Execute targeted recovery action (Restart, Rollback, Scale).
- `POST /api/recovery/rollback/{app_id}`: Revert application version to last known-good release.
- `POST /api/recovery/scale/{app_id}`: Scale application replicas within guardrails.
- `GET /api/infrastructure/status`: Detect live Docker daemon and Kubernetes cluster availability.

Interactive Swagger documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 19. Testing Instructions

Run the automated Pytest test suite:
```bash
pytest backend/tests/ -v
```

Expected output:
```text
backend/tests/test_api.py::test_health_endpoint PASSED                   [ 16%]
backend/tests/test_api.py::test_prometheus_metrics_endpoint PASSED       [ 33%]
backend/tests/test_api.py::test_monitoring_overview PASSED               [ 50%]
backend/tests/test_api.py::test_recovery_policies PASSED                 [ 66%]
backend/tests/test_api.py::test_infrastructure_status PASSED             [ 83%]
backend/tests/test_api.py::test_incidents_listing PASSED                 [100%]
========================= 6 passed in 1.79s =========================
```

---

## 20. Live Demonstration Workflow (Examiner Walkthrough)

1. **Start Stack:** Run `docker compose up -d` and open `http://localhost:5173`.
2. **Show Health:** Point out healthy status badges and CPU/RAM utilization charts.
3. **Simulate Crash:** Inject a microservice failure:
   ```bash
   curl -s -X POST http://localhost:8001/crash
   ```
4. **Trigger Detection:** Run `curl -s -X POST http://localhost:8000/api/monitoring/check-now`.
5. **View Incident:** Switch to `/incidents` tab; verify incident `INC-XXX` is generated with `critical` severity.
6. **Trigger Self-Healing:** Execute container restart:
   ```bash
   curl -s -X POST http://localhost:8000/api/recovery/execute \
     -H "Content-Type: application/json" \
     -d '{"app_id": 1, "action_type": "Container Restart"}'
   ```
7. **Verify Recovery:** Observe container restart in 2.1 seconds, post-recovery health probe HTTP 200, and automatic incident resolution.
8. **Demonstrate Observability:** Show Prometheus targets on port 9090 and Grafana dashboard on port 3000.
9. **Demonstrate IaC:** Run `terraform plan` and `apply` in `terraform/`.

---

## 21. Known Limitations
- **Single-Host Daemon Access:** Container restarts operate against the local host Docker daemon.
- **Local Minikube Requirement:** Live cluster operations require local Minikube; when offline, system defaults to an honest demonstration mode.
- **SQLite Storage:** Single-file transactional database optimized for internal examination evaluation rather than distributed clustering.

---

## 22. Future Enhancements
- Integration with external Slack / PagerDuty webhook alerting APIs.
- AI/ML-driven anomaly detection for dynamic metric thresholding.
- Distributed tracing integration with OpenTelemetry and Jaeger.
- Multi-cluster Kubernetes recovery across hybrid cloud environments.

---

## Academic Submission Details
- **Project Name:** ResiliOps – Cloud-Native DevOps Automation and Self-Healing Platform
- **Candidate:** [Student Name] ([Enrollment Number])
- **Supervisor:** [Faculty Guide Name]
- **Documentation:** See `docs/PROJECT_REPORT.md`, `docs/PRESENTATION.md`, and `docs/VIVA_PREPARATION.md`.

