# RESILIOPS: CLOUD-NATIVE DEVOPS AUTOMATION AND SELF-HEALING PLATFORM

**A Project Report Submitted in Partial Fulfillment of the Requirements for the Award of the Degree of**  
**BACHELOR OF TECHNOLOGY / COMPUTER SCIENCE & ENGINEERING**

---

### Project Identification
- **Project Title:** ResiliOps – Cloud-Native DevOps Automation and Self-Healing Platform
- **Candidate Name:** [Student Name]
- **Enrollment / Roll Number:** [Enrollment Number]
- **Department:** Department of Computer Science & Engineering
- **Institution / College:** [College / University Name]
- **Project Guide / Supervisor:** [Faculty Guide Name], [Designation]
- **Academic Year:** 2025 – 2026

---

## Certificate

This is to certify that the project report entitled **"ResiliOps – Cloud-Native DevOps Automation and Self-Healing Platform"** submitted by **[Student Name]** (Roll No: **[Enrollment Number]**) in partial fulfillment of the requirements for the internal evaluation in **Computer Science & Engineering** is a bonafide record of the work carried out under my supervision and guidance.

\
\
__________________________  
**[Faculty Guide Name]**  
Project Supervisor / Internal Examiner  
Department of Computer Science & Engineering  
[College / University Name]

---

## Abstract

Modern distributed cloud applications are subject to transient infrastructure failures, unexpected service crashes, resource exhaustion, and faulty deployment releases. In traditional operating environments, responding to these incidents requires manual intervention by Site Reliability Engineers (SREs), leading to elevated Mean Time to Detection (MTTD) and Mean Time to Recovery (MTTR).

**ResiliOps** is an autonomous, cloud-native DevOps automation and self-healing platform engineered specifically to monitor microservices, detect anomalies in real time, and execute corrective recovery actions autonomously. Built with a modular architecture comprising a React dashboard, a FastAPI control plane, an SQLite transactional datastore, Prometheus telemetry scrapers, and Grafana visualizers, ResiliOps bridges observability and automated remediation.

The platform provides end-to-end self-healing capabilities:
1. Continuous health probing and host resource metrics tracking via `psutil`.
2. Rule-based failure detection with duplicate incident suppression.
3. Automated Docker container restarts via daemon socket communication.
4. Deployment rollbacks to previous known-good releases.
5. Autoscaling replica adjustments with boundary guardrails.
6. Declarative Infrastructure as Code (IaC) provisioning using local Terraform providers.

Experimental results across six test scenarios confirm that ResiliOps detects microservice crashes within 5–10 seconds and recovers containerized workloads in under 3 seconds, demonstrating the practical viability of automated self-healing without requiring expensive cloud subscriptions.

---

## Table of Contents
1. [Chapter 1: Introduction](#chapter-1-introduction)
2. [Chapter 2: Existing System and Proposed System](#chapter-2-existing-system-and-proposed-system)
3. [Chapter 3: Requirements Analysis](#chapter-3-requirements-analysis)
4. [Chapter 4: System Design](#chapter-4-system-design)
5. [Chapter 5: Implementation](#chapter-5-implementation)
6. [Chapter 6: Testing and Quality Assurance](#chapter-6-testing-and-quality-assurance)
7. [Chapter 7: Results and Visual Screenshots](#chapter-7-results-and-visual-screenshots)
8. [Chapter 8: Conclusion and Future Scope](#chapter-8-conclusion-and-future-scope)
9. [References](#references)

---

## Chapter 1: Introduction

### 1.1 Introduction to DevOps and Cloud-Native Resilience
DevOps combines cultural philosophies, practices, and tools that enhance an organization's ability to deliver applications and services at high velocity. In cloud-native paradigms, services are decoupled into microservices deployed inside lightweight containers. While this architecture provides horizontal scalability, it multiplies the failure surface. 

Resilience is the ability of an application to withstand disruptions and recover automatically without human intervention. Self-healing systems introduce closed-loop feedback: they monitor state, detect discrepancies against a desired healthy baseline, execute automated corrective measures, and verify that the system has returned to steady state.

### 1.2 Background of ResiliOps
Academic curricula in computer science and cloud computing typically introduce Docker, Kubernetes, and Prometheus as disconnected, isolated CLI tools. Students rarely see how telemetry, alerting, and automated infrastructure remediation interact in a cohesive control plane. ResiliOps was developed to fill this gap, offering a working, tangible implementation of automated self-healing and DevOps automation designed to run cleanly on a standard workstation.

### 1.3 Problem Statement
When a microservice fails due to an uncaught runtime exception, memory leak, or deployment regression:
1. Operational teams often discover the issue long after downtime occurs due to fragmented monitoring tools.
2. Generating incident reports and diagnosing root causes requires tedious log inspection.
3. Remediation actions (such as restarting containers or rolling back releases) are executed manually via shell commands, increasing outage duration and human error risk.
4. Existing enterprise platforms (e.g., Datadog, PagerDuty, AWS Systems Manager) are proprietary, subscription-based, and too complex for academic examination and local demonstration.

### 1.4 Objectives
- **Automated Health Monitoring:** Continuously ping registered microservices, track response latency, and monitor host CPU/RAM utilization.
- **Intelligent Failure Detection:** Identify application downtime, consecutive HTTP errors, high CPU load, and memory saturation using configurable thresholds without generating duplicate incidents.
- **Autonomous Remediation:** Execute automated container restarts, Kubernetes pod evictions, deployment rollbacks, and horizontal replica scaling.
- **Unified Telemetry:** Expose standard OpenMetrics format endpoints for Prometheus and render dynamic visual panels in Grafana.
- **Zero-Cloud Dependency:** Orchestrate the entire platform locally using Docker Compose, Minikube, and local Terraform providers without incurring financial cloud expenses.

### 1.5 Scope of the Project
ResiliOps encompasses the full lifecycle of DevOps automation:
- Monitoring control plane with interactive web dashboard.
- RESTful backend API managing application inventories, incident lifecycles, and recovery audit trails.
- Background asynchronous worker executing periodic health loops.
- Standardized container images and multi-container orchestration.
- Declarative Kubernetes specifications and Infrastructure as Code configurations.

---

## Chapter 2: Existing System and Proposed System

### 2.1 Existing System
In typical microservice infrastructures:
- Developers deploy applications using disconnected Docker commands or simple shell scripts.
- Monitoring is performed by periodically refreshing a webpage or checking terminal logs after users complain.
- When an outage occurs, a system administrator must log in via SSH, locate the offending process ID or container ID, and execute `docker restart <container>` manually.
- If a new deployment fails, rolling back requires manually pulling older image tags or rewriting configuration files.

### 2.2 Limitations of the Existing System
- **High Mean Time to Detect (MTTD):** Incidents go unnoticed until an end-user files a bug report.
- **High Mean Time to Recover (MTTR):** Remediation is constrained by human availability and manual triage speed.
- **Human Error Vulnerability:** Operators executing hasty manual commands during an outage risk stopping the wrong production container.
- **Lack of Centralized Auditability:** Past incidents, restart attempts, and deployment histories are scattered across disparate host log files.

### 2.3 Proposed System (ResiliOps)
ResiliOps introduces an automated supervisory control plane that:
1. Actively scans registered endpoints at configurable intervals.
2. Automatically generates incidents with severity ratings (`low`, `medium`, `high`, `critical`) upon 3 consecutive failures.
3. Automatically triggers targeted container restarts via the Docker Engine API.
4. Performs post-recovery validation to ensure the application has returned to HTTP 200 before resolving the incident.
5. Displays real-time operational status on an intuitive React dashboard with Grafana telemetry.

### 2.4 Advantages of ResiliOps
- **Autonomous Healing:** Microservices self-recover in under 3 seconds without operator intervention.
- **De-duplication Protection:** Active incidents prevent alert floods for persistent issues.
- **Safety Boundaries:** Recovery cooldown timers and maximum retry limits prevent restart thrashing.
- **Complete Audit Trail:** Every detection, recovery attempt, rollback, and replica scaling event is persistently logged to SQLite with timestamps and outcomes.
- **Cost-Free Academic Architecture:** Built entirely on open-source standards running locally on any standard computer.

---

## Chapter 3: Requirements Analysis

### 3.1 Functional Requirements
- **FR-1 (Application Inventory):** The system shall allow registering, listing, viewing, and toggling monitoring for microservices.
- **FR-2 (Health Probing):** The system shall send asynchronous HTTP GET requests to `/health` endpoints and record status code and response latency.
- **FR-3 (System Resource Tracking):** The platform shall capture host CPU %, RAM %, and backend process memory using `psutil`.
- **FR-4 (Failure Detection):** The engine shall detect failures when an endpoint is unreachable, returns 5xx errors, or exceeds resource thresholds.
- **FR-5 (Incident Lifecycle):** The platform shall generate unique incidents (`INC-XXX`), update status to `open` / `investigating`, and resolve them upon verified recovery.
- **FR-6 (Container Self-Healing):** The system shall issue container restart calls to `/var/run/docker.sock` for unhealthy containers.
- **FR-7 (Deployment Rollback):** The system shall allow rolling back a failed deployment to the prior known-good version tag.
- **FR-8 (Autoscaling Guardrails):** The system shall adjust replica counts while respecting configured minimum (1) and maximum (6) limits.
- **FR-9 (Metrics Export):** The backend shall expose custom gauges and counters on `/metrics` in OpenMetrics format.

### 3.2 Non-Functional Requirements
- **NFR-1 (Performance):** Health check cycles must execute asynchronously in parallel without blocking API request threads.
- **NFR-2 (Reliability):** Transient connection timeouts must not trigger catastrophic failure; consecutive failure thresholds must prevent false positives.
- **NFR-3 (Usability):** The web dashboard must provide instant status recognition through standardized color-coded badges and responsive charts.
- **NFR-4 (Portability):** The platform must spin up on any Linux, macOS, or Windows system with Docker installed via `docker compose up -d`.

### 3.3 Hardware Requirements
- **Processor:** Quad-Core Intel Core i5 / AMD Ryzen 5 or higher.
- **RAM:** Minimum 8 GB (16 GB recommended for running Docker Compose + Minikube concurrently).
- **Disk Space:** 10 GB free disk space for Docker base images, build cache, and SQLite datastore.

### 3.4 Software Requirements
- **Operating System:** Linux (Ubuntu 22.04+ / Debian 12+) or Windows 10/11 with WSL2.
- **Container Engine:** Docker Engine v24.0+ and Docker Compose v2.20+.
- **Language Runtimes:** Python 3.12+ and Node.js v20+ / npm v10+.
- **Infrastructure Tools:** Terraform CLI v1.5+, `kubectl` v1.28+, Minikube (optional for live cluster test).
- **Web Browser:** Google Chrome, Mozilla Firefox, or Chromium.

---

## Chapter 4: System Design

### 4.1 System Architecture
ResiliOps adopts a multi-tiered microservices architecture:
1. **Presentation Layer:** React 19 SPA served via Nginx reverse proxy on port 5173.
2. **Control Plane Layer:** FastAPI backend running asynchronous event loops on port 8000.
3. **Data Layer:** SQLite relational datastore mapped to persistent Docker volumes.
4. **Target Layer:** Standalone Docker microservice simulating realistic workloads on port 8001.
5. **Observability Layer:** Prometheus time-series database on port 9090 and Grafana on port 3000.

```mermaid
flowchart TD
    User([User / Examiner]) -->|Port 5173| NGINX[Nginx Web Server]
    User -->|Port 3000| GRAFANA[Grafana Dashboard]
    User -->|Port 9090| PROM[Prometheus Server]

    subgraph ResiliOps Platform
        NGINX -->|Reverse Proxy /api| FASTAPI[FastAPI Control Plane]
        FASTAPI -->|Read / Write| SQLITE[(SQLite Datastore)]
        FASTAPI -->|Docker SDK| SOCK[/var/run/docker.sock/]
        
        subgraph Engine Services
            MONITOR[Health Prober]
            DETECTOR[Failure Detector]
            HEALER[Self-Healing Engine]
        end

        FASTAPI --- MONITOR
        FASTAPI --- DETECTOR
        FASTAPI --- HEALER
    end

    subgraph Managed Infrastructure
        SOCK -.->|Restart / Inspect| DOCKER_CONTAINER[resiliops-sample-app]
        SOCK -.->|Terraform IaC| TF_CONTAINER[resiliops_tf_demo_app]
    end

    PROM -->|Scrape /metrics| FASTAPI
    PROM -->|Scrape /health| DOCKER_CONTAINER
    GRAFANA -->|PromQL Queries| PROM
```

### 4.2 Data Flow Diagram (DFD - Level 1)
```mermaid
flowchart LR
    A[Target Application] -->|HTTP 200/500 Response| B(Health Monitor Service)
    B -->|Check Result| C(Failure Detection Engine)
    C -->|Threshold Exceeded?| D{Create Incident?}
    D -- Yes --> E[Incident Manager]
    E -->|Write Incident| F[(SQLite Database)]
    D -- No --> G[Update Health Record]
    E -->|Trigger Healing| H(Self-Healing Engine)
    H -->|Issue Container Restart| I[Docker Engine Daemon]
    I -->|Container Rebooted| A
    H -->|Verify 200 OK| J(Recovery Verifier)
    J -->|Resolve Incident| E
```

### 4.3 Database Schema Design
The persistent SQLite datastore manages the following key entities:

```mermaid
erDiagram
    APPLICATION ||--o{ INCIDENT : generates
    APPLICATION ||--o{ RECOVERY_ACTION : targets
    APPLICATION ||--o{ DEPLOYMENT : receives
    INCIDENT ||--o| RECOVERY_ACTION : triggers

    APPLICATION {
        int id PK
        string name
        string url
        string status
        float cpu
        float memory
        string version
        int replicas
        boolean monitoring
        int consecutive_failures
        string container_name
        boolean recovery_enabled
    }

    INCIDENT {
        string id PK
        int app_id FK
        string title
        string incident_type
        string severity
        string status
        datetime detected_at
        datetime resolved_at
        string cause
    }

    RECOVERY_ACTION {
        string id PK
        int app_id FK
        string incident_id FK
        string action_type
        string target
        string status
        string details
        datetime started_at
        datetime completed_at
    }

    DEPLOYMENT {
        string id PK
        int app_id FK
        string version
        string status
        string environment
        datetime deployed_at
    }
```

---

## Chapter 5: Implementation

### 5.1 Phase 1: React Frontend Dashboard
The user interface was constructed using React 19, Vite, and Tailwind CSS. A unified layout (`Layout.jsx`) provides responsive navigation across 8 operational pages. Components leverage an asynchronous data-fetching hook (`useApi.js`) that automatically polls backend endpoints every 5 seconds, ensuring charts and tables reflect dynamic platform events in real time.

### 5.2 Phase 2: FastAPI Backend & REST API
The control plane was implemented in Python using FastAPI. A centralized application factory in `backend/app/main.py` binds modular APIRouters:
- `applications.py`: Manages microservice CRUD operations and monitoring toggles.
- `monitoring.py`: Exposes system health overviews, rolling metric windows, and manual check triggers.
- `incidents.py`: Manages incident lifecycle transitions (`open` -> `investigating` -> `resolved`).
- `recovery.py`: Exposes recovery execution, rollbacks, and autoscaling endpoints.
- `infrastructure.py`: Exposes live Docker container lists and Kubernetes pod statuses.

### 5.3 Phase 3: Monitoring & Failure Detection Engine
- **Health Probing:** Asynchronous HTTP client `httpx.AsyncClient` probes target `/health` endpoints in parallel.
- **Resource Monitoring:** Python's native `psutil` captures host CPU load, available RAM, and backend process memory.
- **Failure Detection:** `FailureDetector` checks metrics against `DetectionSettings` (CPU > 80%, RAM > 85%, Failures >= 3). When violations occur, `IncidentManager` generates an incident (`INC-XXX`) with appropriate severity while suppressing duplicates.
- **Prometheus Exporter:** Uses `prometheus_client` to export metrics on `/metrics`.

### 5.4 Phase 4: Self-Healing & Automated Recovery
- **Docker Container Recovery (`docker_recovery.py`):** Uses the Python Docker SDK to inspect and restart containers via `/var/run/docker.sock`. Application-to-container mappings are strictly whitelisted to prevent unauthorized execution.
- **Deployment Rollback (`rollback_manager.py`):** Reverts a failed microservice version string back to its last known-good tag, registers a deployment record, and verifies health.
- **Autoscaling Guardrails (`scaling_manager.py`):** Dynamically scales replicas up or down while enforcing boundary limits (min: 1, max: 6).
- **Post-Recovery Verification (`recovery_verifier.py`):** Probes the microservice post-restart to confirm HTTP 200 before marking recovery as successful and closing incidents.

### 5.5 Phase 5: DevOps Integration
- **Dockerization:** Slim Python 3.12 backend container and multi-stage Nginx frontend container.
- **Docker Compose:** Root `docker-compose.yml` orchestrating Frontend, Backend, Sample App, Prometheus, and Grafana on a shared bridge network.
- **GitHub Actions Workflows:** Modular CI/CD pipelines in `.github/workflows/` (`ci.yml`, `docker-build.yml`, `deploy.yml`).
- **Kubernetes Manifests:** 7 production-style manifests in `k8s/` deploying pods, services, and configmaps into a dedicated `resiliops` namespace.
- **Terraform IaC:** Declarative local container infrastructure provisioning using the `kreuzwerker/docker` provider.

---

## Chapter 6: Testing and Quality Assurance

### 6.1 Automated Pytest Unit Test Suite
The automated test suite in `backend/tests/test_api.py` was executed using Pytest:

| Test Name | Test Objective | Assertion | Result |
|---|---|---|---|
| `test_health_endpoint` | Verify control plane liveness | Status 200, service: `resiliops-api` | **PASSED** |
| `test_prometheus_metrics_endpoint` | Verify OpenMetrics format | Status 200, contains `resiliops_` | **PASSED** |
| `test_monitoring_overview` | Verify telemetry aggregation | Health score, CPU %, RAM % present | **PASSED** |
| `test_recovery_policies` | Verify self-healing policies | Allow restart, cooldown, max retries | **PASSED** |
| `test_infrastructure_status` | Verify Docker & K8s status | Docker available, version string present | **PASSED** |
| `test_incidents_listing` | Verify incident datastore retrieval | List returned, correct field schema | **PASSED** |

### 6.2 Failure Simulation and Self-Healing Verification
1. **Crash Injection:** Executed `POST http://localhost:8001/crash`. Target microservice returned HTTP 500.
2. **Consecutive Failure Tracking:** Probing cycles incremented consecutive failure counter from 0 to 3.
3. **Incident Creation:** Incident `INC-307` generated with severity `critical`.
4. **Autonomous Container Restart:** Self-healing engine restarted container `resiliops-sample-app` via Docker socket in 2.1 seconds.
5. **Post-Recovery Verification:** Verifier confirmed HTTP 200 in 10ms.
6. **Incident Resolution:** Incident `INC-307` automatically transitioned from `open` to `resolved`.

---

## Chapter 7: Results and Visual Screenshots

All visual captures were taken directly from the live running ResiliOps platform:

### 7.1 Real-Time System Dashboard
The primary overview screen renders real-time health score gauges, monitored application counters, active incident alerts, host resource utilization charts, and recent audit logs.

![ResiliOps Dashboard](screenshots/dashboard.png)

### 7.2 Applications Inventory & Health Probing
Displays registered microservices, live status badges, replica counts, response latencies, and last deployment timestamps.

![Applications Page](screenshots/applications.png)

### 7.3 Detailed System Monitoring & Telemetry
Presents real-time CPU and RAM utilization graphs, response time tracking, and chronological monitoring log streams.

![Monitoring Page](screenshots/monitoring.png)

### 7.4 Automatic Incident Management & Audit Log
Chronicles automatically detected infrastructure incidents, severity levels, root causes, and resolution timestamps.

![Incidents Page](screenshots/incidents.png)

### 7.5 Self-Healing Engine & Recovery History
Displays autonomous recovery actions, execution outcomes (`SUCCESS`), target container identifiers, and policy controls.

![Self-Healing Page](screenshots/self_healing.png)

### 7.6 Infrastructure & Container Orchestration
Displays Docker container status, container IDs, images, ports, and Kubernetes cluster workload specs.

![Infrastructure Page](screenshots/infrastructure.png)

### 7.7 Prometheus Scrape Targets & Health Status
Displays active scrape targets (`resiliops-backend`, `resiliops-sample-app`) in the official Prometheus Web UI.

![Prometheus Targets](screenshots/prometheus.png)

### 7.8 Grafana Visual Telemetry Dashboard
Pre-provisioned visual dashboard rendering live PromQL metrics for host resource load and microservice availability.

![Grafana Dashboard](screenshots/grafana.png)

---

## Chapter 8: Conclusion and Future Scope

### 8.1 Conclusion
The ResiliOps project successfully demonstrates a fully functional, cloud-native DevOps automation and self-healing platform. By unifying microservice health probing, rule-based failure detection, automated container remediation, Prometheus telemetry, and local Infrastructure as Code, the project proves that high-availability operations can be automated reliably on standard development workstations. All objectives established for the college internal examination have been met and verified.

### 8.2 Key Achievements
- Engineered a full-stack platform with zero external paid cloud dependencies.
- Achieved sub-3-second automated container recovery upon simulated service crashes.
- Implemented duplicate incident suppression and safety boundaries against recovery thrashing.
- Provisioned Prometheus and Grafana dashboards with zero manual configuration steps.
- Delivered complete Infrastructure as Code templates with local Terraform and Kubernetes manifests.

### 8.3 Limitations
- **Single-Node Execution:** Docker container recovery operates against the local host Docker daemon.
- **Kubernetes Live Testing:** Requires local Minikube cluster; defaults to demonstration mode when offline.
- **Relational Datastore:** SQLite is optimized for local demonstration rather than multi-master distributed clustering.

### 8.4 Future Enhancements
- Integration with external Slack / PagerDuty webhook alerting APIs.
- AI/ML-driven anomaly detection for dynamic metric thresholding.
- Distributed tracing integration with OpenTelemetry and Jaeger.
- Multi-cluster Kubernetes recovery across hybrid cloud environments.

---

## References

1. **FastAPI Documentation:** Tiangolo, "FastAPI Framework, High Performance, Easy to Learn," https://fastapi.tiangolo.com/
2. **React Documentation:** Meta Open Source, "React – The library for web and native user interfaces," https://react.dev/
3. **Docker Engine API:** Docker Inc., "Develop with Docker Engine SDK and API," https://docs.docker.com/engine/api/
4. **Prometheus Monitoring:** Linux Foundation / CNCF, "Prometheus – Monitoring system & time series database," https://prometheus.io/docs/
5. **Grafana Dashboards:** Grafana Labs, "Grafana Dashboards and Provisioning Documentation," https://grafana.com/docs/grafana/latest/
6. **Terraform Docker Provider:** Kreuzwerker, "Terraform Provider for Docker Engine," https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs
7. **Kubernetes Architecture:** Cloud Native Computing Foundation, "Kubernetes Concepts and Workloads," https://kubernetes.io/docs/concepts/

