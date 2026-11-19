# ResiliOps – Comprehensive Viva Voce Question & Answer Bank

**Project Name:** ResiliOps – Cloud-Native DevOps Automation and Self-Healing Platform  
**Target:** College Internal Examination & Project Viva Voce Defense  
**Candidate Preparation Guide:** Includes both **Quick Answers (30-second summary)** and **In-Depth Technical Explanations** for every question.

---

## 1. Basic Questions

### Q1. What is ResiliOps?
- **Quick Answer:** ResiliOps is an autonomous cloud-native DevOps automation and self-healing supervisory platform that continuously monitors microservices, detects system failures, automatically executes corrective actions (like container restarts and rollbacks), and visualizes real-time metrics on a dashboard.
- **In-Depth Explanation:** Traditional microservice operations require human SREs to monitor logs, detect crashes, and execute shell commands to restore services. ResiliOps implements a closed-loop control system: it periodically health-checks registered services, evaluates thresholds using a failure detection engine, automatically triggers container restarts via the Docker Engine API or rolls back faulty releases, verifies post-recovery health, and logs complete audit trails to an SQLite database.

### Q2. Why did you choose this project?
- **Quick Answer:** I chose this project to move beyond disconnected academic DevOps tutorials and build an end-to-end, real-world platform where monitoring, automated failure remediation, container orchestration, and Infrastructure as Code work together.
- **In-Depth Explanation:** Most college projects focus only on a web app or basic CI/CD pipeline. ResiliOps solves a genuine industry challenge—unplanned downtime and high Mean Time to Recovery (MTTR). It integrates the major pillars of modern cloud computing—Docker, Kubernetes, Prometheus, Grafana, Terraform, and GitHub Actions—into a single functional system running locally without cloud costs.

### Q3. What problem does ResiliOps solve?
- **Quick Answer:** It eliminates manual human intervention and long service downtime when a microservice crashes or experiences resource exhaustion, reducing MTTR from minutes to under 3 seconds.
- **In-Depth Explanation:** In production microservice environments, transient bugs, memory leaks, and bad deployments cause sudden outages. If monitored manually, detection and recovery take significant time. ResiliOps automates the entire sequence: instant anomaly detection, deduplicated incident generation, automated container reboot or version rollback, and post-recovery health validation.

### Q4. What is DevOps?
- **Quick Answer:** DevOps is a combination of cultural practices, philosophies, and automated tools that integrates software development (Dev) and IT operations (Ops) to deliver applications faster, more reliably, and with continuous quality.
- **In-Depth Explanation:** Historically, developers wrote code and threw it over the wall to operations teams to deploy and maintain, causing friction and slow release cycles. DevOps unifies both roles using automation across building, testing, containerizing, deploying, monitoring, and self-healing, shortening the systems development life cycle while maintaining high software quality.

### Q5. What is CI/CD?
- **Quick Answer:** CI (Continuous Integration) is the practice of automatically building and testing code on every commit. CD (Continuous Delivery/Deployment) is the automated process of releasing validated code into staging or production environments.
- **In-Depth Explanation:** Continuous Integration ensures that multiple developers merging code do not introduce regressions by triggering automated linters and unit tests (like Pytest in our GitHub Actions). Continuous Deployment automates packaging into Docker container images and releasing them to target clusters with automated healthcheck validation and rollback safety.

---

## 2. Frontend Questions

### Q6. Why did you choose React for the frontend?
- **Quick Answer:** React's component-based architecture and reactive virtual DOM make it ideal for building modular, high-performance dashboards that need to update frequently based on incoming telemetry.
- **In-Depth Explanation:** A monitoring platform has multiple dynamic elements: live health badges, CPU/RAM utilization charts, incident counters, and streaming log tables. React allows us to encapsulate each view into reusable components (like `Card.jsx`, `StatusBadge.jsx`) and re-render only the affected UI nodes without reloading the entire page.

### Q7. What is Vite and why is it used instead of Create React App?
- **Quick Answer:** Vite is a next-generation frontend build tool powered by native ES modules (ESM) and Rollup/esbuild that provides near-instant server start and extremely fast Hot Module Replacement (HMR).
- **In-Depth Explanation:** Create React App (CRA) uses Webpack, which bundles the entire application before serving, resulting in slow start times as projects grow. Vite serves source code over native ESM during development and uses Rollup for optimized, tree-shaken production bundles, significantly improving build speeds and developer experience.

### Q8. How does the dashboard communicate with the backend?
- **Quick Answer:** The React frontend makes asynchronous HTTP requests using a custom `useApi` hook that calls the Axios/Fetch API client. In production, Nginx reverse-proxies `/api/*` requests to the FastAPI backend on port 8000.
- **In-Depth Explanation:** The frontend utilizes `frontend/src/api/useApi.js`, which encapsulates polling intervals (every 5 seconds) and handles loading and error states. When running in Docker Compose, the frontend container listens on port 80 (mapped to 5173). Nginx intercepts requests matching `/api/` and forwards them internally over the Docker network to `http://backend:8000/api/`, eliminating CORS issues in production.

### Q9. How are charts and real-time metrics updated?
- **Quick Answer:** The React dashboard periodically polls the backend `/api/monitoring/overview` and `/api/monitoring/metrics` endpoints every 5 seconds, updating component state and dynamically re-rendering the SVG/canvas telemetry charts.
- **In-Depth Explanation:** The backend maintains a rolling window of recent time-series samples (`MetricPoint`). Every polling interval, the frontend fetches the latest 20 metric points and updates its internal state. The charts use reactive data bindings to smoothly adjust SVG paths and bar heights without UI stutter.

---

## 3. Backend Questions

### Q10. Why did you choose FastAPI for the backend?
- **Quick Answer:** FastAPI is modern, extremely fast (on par with NodeJS and Go), supports native asynchronous concurrency (`async/await`), and automatically generates OpenAPI/Swagger interactive documentation.
- **In-Depth Explanation:** FastAPI is built on Starlette and Pydantic. It allows our background monitoring loops and parallel HTTP health probes (`httpx.AsyncClient`) to run concurrently on an `asyncio` event loop without blocking API endpoints that serve frontend requests. Additionally, type hinting ensures strict runtime payload validation.

### Q11. What are REST APIs?
- **Quick Answer:** REST (Representational State Transfer) is an architectural style for designing networked applications using standard HTTP methods (GET, POST, PUT, PATCH, DELETE) to manage stateless resource representations.
- **In-Depth Explanation:** In ResiliOps, each entity is a resource with standard URL conventions:
  - `GET /api/applications`: List applications.
  - `POST /api/applications`: Create an application.
  - `PATCH /api/applications/{id}/monitoring`: Toggle monitoring state.
  - `POST /api/recovery/execute`: Trigger recovery action.
  The server is stateless; every request contains all necessary data for execution.

### Q12. Why SQLite for this project instead of PostgreSQL or MySQL?
- **Quick Answer:** SQLite is a serverless, zero-configuration, single-file relational database that eliminates the operational overhead of running a separate database server, making it perfect for college examination demonstrations.
- **In-Depth Explanation:** A separate PostgreSQL or MySQL container would consume unnecessary RAM and introduce connection-management overhead. SQLite runs in-process with the FastAPI backend, supports full ACID transactions, and with WAL (Write-Ahead Logging) enabled, easily supports concurrent reads and writes. In Docker Compose, the database file is persisted via a named volume (`sqlite_data:/data`).

### Q13. How is the database structured?
- **Quick Answer:** It contains 6 relational tables managed via SQLAlchemy ORM: Applications, Incidents, Recovery Actions, Deployments, Activities, and Metric Points.
- **In-Depth Explanation:**
  - `applications`: Stores app metadata, health status, consecutive failures, container name, and replica count.
  - `incidents`: Records generated incidents (`INC-XXX`), foreign key to application, severity, status (`open`/`resolved`), and root cause.
  - `recovery_actions`: Logs executed recovery operations (`REC-XXX`), action type (`Container Restart`, `Rollback`), target, and verification status (`SUCCESS`/`FAILED`).
  - `deployments`: Tracks release version tags and deployment timestamps.
  - `detection_settings`: Configures dynamic thresholds (failure count, CPU %, interval).

---

## 4. Monitoring & Telemetry Questions

### Q14. What is Prometheus and how does it integrate with ResiliOps?
- **Quick Answer:** Prometheus is an open-source time-series monitoring system that scrapes metrics from instrumented endpoints over HTTP and stores them for querying via PromQL.
- **In-Depth Explanation:** The FastAPI backend uses `prometheus_client` to expose custom application and system metrics on `/metrics`. A Prometheus container runs in Docker Compose, configured via `prometheus/prometheus.yml` to scrape `backend:8000/metrics` and `sample-app:8000/health` every 5 seconds. Metrics include `resiliops_application_status`, `resiliops_system_cpu_usage_percent`, and `resiliops_healthcheck_failures_total`.

### Q15. What is Grafana?
- **Quick Answer:** Grafana is an open-source visual analytics and dashboard platform that queries time-series data from data sources like Prometheus and renders interactive graphs.
- **In-Depth Explanation:** In ResiliOps, Grafana is auto-provisioned via configuration files (`grafana/provisioning/`). Upon container boot, it automatically links to `http://prometheus:9090` as its default datasource and imports our pre-configured dashboard (`resiliops-dashboard.json`), providing immediate zero-touch visualization of CPU, RAM, and application status.

### Q16. What is `psutil` and what metrics does it collect?
- **Quick Answer:** `psutil` (Python system and process utilities) is a cross-platform Python library used to retrieve real-time hardware and process utilization statistics.
- **In-Depth Explanation:** Our backend service `metrics_collector.py` uses `psutil` to collect:
  - System-wide CPU utilization percentage (`psutil.cpu_percent()`).
  - Total, used, and available physical RAM (`psutil.virtual_memory()`).
  - Control plane process statistics: process ID, resident memory set (RSS in MB), and thread count (`psutil.Process()`).

### Q17. How does health monitoring work in the background?
- **Quick Answer:** An asynchronous background task (`background_monitoring_loop`) runs periodically, querying all registered applications and sending parallel HTTP GET requests to their `/health` endpoints.
- **In-Depth Explanation:** The worker uses `asyncio.gather()` with `httpx.AsyncClient` to check multiple endpoints concurrently without latency bottlenecks. It records the response HTTP status code, measures round-trip time in milliseconds, updates the database, and feeds the results into the failure detection engine.

### Q18. How does failure detection happen?
- **Quick Answer:** The `FailureDetector` compares health check results and system metrics against configured thresholds (e.g., 3 consecutive failures, CPU > 80%, RAM > 85%). If violated, an incident is generated.
- **In-Depth Explanation:** When an endpoint returns a non-200 code or times out, its `consecutive_failures` counter increments. If this reaches the threshold configured in `DetectionSettings` (default: 3), the app status transitions to `down`, and `IncidentManager.create_incident()` generates a structured incident (`INC-XXX`) with `severity: critical`.

---

## 5. Self-Healing & Recovery Questions

### Q19. What is self-healing in cloud-native systems?
- **Quick Answer:** Self-healing is the automated ability of an infrastructure platform to detect operational anomalies, diagnose the failing component, execute corrective recovery actions, and verify health without human intervention.
- **In-Depth Explanation:** In traditional setups, humans must triage alerts and run remediation commands. In self-healing systems, the supervisory control plane detects drift from the desired healthy state and applies pre-authorized remediation policies (e.g., container restart, version rollback, autoscaling) to restore service availability autonomously.

### Q20. How does Docker container restart work in ResiliOps?
- **Quick Answer:** The backend mounts the host Docker socket (`/var/run/docker.sock`) and uses the Python Docker SDK to find and restart the associated container by name.
- **In-Depth Explanation:** When an application is registered, it is mapped to a specific container identifier (e.g., `resiliops-sample-app`). When the failure detector marks the service `down`, `RecoveryEngine.execute_container_restart()` queries Docker via the socket, issues a restart call, waits 2 seconds for boot, and invokes `RecoveryVerifier` to confirm that `/health` returns HTTP 200 before marking recovery as `SUCCESS`.

### Q21. How does Kubernetes pod recovery work?
- **Quick Answer:** In Kubernetes, self-healing is achieved by deleting the unhealthy pod. The parent Deployment controller immediately detects the replica deficit and schedules a new replacement pod on an available node.
- **In-Depth Explanation:** Pods in Kubernetes are ephemeral. Rather than restarting an unhealthy container inside a damaged pod, the SRE practice is to call the Kubernetes CoreV1 API to delete the pod. The ReplicaSet controller notices that `observedReplicas < desiredReplicas` and spawns a fresh pod according to the Deployment's pod template.

### Q22. How does deployment rollback work?
- **Quick Answer:** Rollback identifies the last known-good version tag from the deployment history, reverts the application's active version, records a rollback audit event, and verifies health.
- **In-Depth Explanation:** If a newly deployed version (e.g., `v2.4.1`) causes continuous crashes, `RollbackManager` inspects the `deployments` table, retrieves the previous successful release tag (e.g., `v1.0.0`), updates the application record, and triggers a container reboot with the stable image tag.

### Q23. What is autoscaling and how do guardrails work?
- **Quick Answer:** Autoscaling adjusts the number of microservice replicas based on CPU demand. Guardrails enforce minimum (1) and maximum (6) boundaries to prevent resource exhaustion or runaway costs.
- **In-Depth Explanation:** When host or application CPU load exceeds configured limits, `ScalingManager` increments the replica count. If an operator or automated policy attempts to scale beyond 6 replicas, the request is safely rejected with `status: SKIPPED` and message `"Scaling limit reached"`.

### Q24. How do recovery cooldowns and retry limits prevent thrashing?
- **Quick Answer:** Cooldown timers require a waiting period between restart attempts, and retry limits stop restarting after 3 consecutive failures to prevent infinite reboot loops.
- **In-Depth Explanation:** If an application has a fatal bug in its startup code (e.g., bad database credential), restarting it repeatedly in an infinite loop (crash-loop backoff) consumes CPU and floods logs. ResiliOps enforces a 60-second cooldown and a maximum of 3 recovery attempts per incident. Once exceeded, it escalates the incident for manual review.

---

## 6. DevOps & Infrastructure Questions

### Q25. What is Docker and what is a container?
- **Quick Answer:** Docker is a platform that packages applications and all their dependencies into a standardized, isolated unit called a container that runs consistently across any Linux or Windows environment.
- **In-Depth Explanation:** Unlike virtual machines (VMs) which emulate full hardware and run a separate guest OS, containers share the host Linux kernel and isolate processes using kernel `namespaces` (for process, network, and mount isolation) and `cgroups` (for CPU and memory limits), making them lightweight, fast to boot, and resource-efficient.

### Q26. What is Docker Compose?
- **Quick Answer:** Docker Compose is a tool for defining and running multi-container Docker applications using a declarative YAML configuration file (`docker-compose.yml`).
- **In-Depth Explanation:** It allows spinning up our entire 5-tier architecture (Frontend, Backend, Sample App, Prometheus, Grafana) with a single command: `docker compose up -d --build`. It handles bridge network creation, port publishing, named volume mounting, service dependencies (`depends_on`), and container healthchecks.

### Q27. What is Kubernetes?
- **Quick Answer:** Kubernetes (K8s) is an open-source container orchestration platform designed to automate the deployment, scaling, networking, and management of containerized applications across a cluster of nodes.
- **In-Depth Explanation:** While Docker runs containers on a single host, Kubernetes manages distributed clusters. It introduces abstractions like `Pods` (smallest deployable unit), `Deployments` (declarative replica controllers), `Services` (stable internal/external networking), `ConfigMaps` (configuration injection), and `Namespaces` (virtual cluster isolation).

### Q28. What is Infrastructure as Code (IaC) and what is Terraform?
- **Quick Answer:** Infrastructure as Code is the practice of managing and provisioning computing infrastructure through machine-readable definition files rather than manual interactive configuration. Terraform is an open-source declarative IaC tool developed by HashiCorp.
- **In-Depth Explanation:** In Terraform, infrastructure is defined in HashiCorp Configuration Language (HCL). Terraform uses a state file (`terraform.tfstate`) to map real-world resources to your configuration. When you run `terraform plan`, it calculates the delta between desired state and actual state; running `terraform apply` executes only the required creates, updates, or destroys. In ResiliOps, we use the local `kreuzwerker/docker` provider to provision Docker resources without external cloud accounts.

### Q29. What are GitHub Actions?
- **Quick Answer:** GitHub Actions is a continuous integration and continuous delivery (CI/CD) platform that automates build, test, and deployment workflows directly within a GitHub repository.
- **In-Depth Explanation:** Workflows are written in YAML under `.github/workflows/`. In ResiliOps:
  - `ci.yml`: Triggers on push/PR, installs Python 3.12, runs 6 Pytest tests, and tests the React build on Node 22.
  - `docker-build.yml`: Validates Docker Compose files and builds container images.
  - `deploy.yml`: Simulates automated deployment rollouts.

---

## 7. Project-Specific Viva Questions

### Q30. Explain the complete failure detection and recovery workflow in ResiliOps.
- **Quick Answer:** 
  1. The prober sends HTTP requests to `/health`.
  2. If 3 consecutive failures occur, `FailureDetector` generates an incident (`INC-XXX`).
  3. `RecoveryEngine` checks the policy and cooldown, then restarts the target container via Docker socket.
  4. `RecoveryVerifier` confirms HTTP 200 post-restart.
  5. The incident is marked `resolved`, and an audit record (`REC-XXX`) is saved.
- **In-Depth Explanation:** 
  The process runs in `background_runner.py`:
  - `HealthMonitor.check_application()` executes async GET request.
  - Upon receiving HTTP 500, `app.consecutive_failures` reaches 3.
  - `FailureDetector.evaluate_application()` calls `IncidentManager.create_incident()`, creating `INC-307` with `severity: critical`.
  - The engine checks `policy.allow_restart`, verifies that the app is outside the 60s cooldown window, and calls `DockerRecoveryService.restart_container("resiliops-sample-app")`.
  - The engine pauses 2 seconds for container startup, probes `http://localhost:8001/health`, verifies HTTP 200, sets `recovery_action.status = SUCCESS`, and resolves `INC-307` with `resolved_at` timestamp.

### Q31. What happens when an application crashes? How do you prevent duplicate incidents?
- **Quick Answer:** When an application crashes, consecutive failures increment until reaching 3, generating a critical incident. Duplicate incidents are prevented by querying the database for open or investigating incidents on that application before creating a new one.
- **In-Depth Explanation:** In `incident_manager.py`:
  ```python
  existing = db.scalar(
      select(Incident).where(
          Incident.app_id == app.id,
          Incident.incident_type == incident_type,
          Incident.status.in_(["open", "investigating"])
      )
  )
  if existing:
      return existing  # Do not generate duplicate incident!
  ```
  If an outage persists across 50 monitoring cycles, only one single incident remains open until the service is restored and verified.

### Q32. How do you verify that recovery succeeded?
- **Quick Answer:** We probe the application's `/health` endpoint after the recovery action. Only if it responds with HTTP 200 within a timeout is recovery marked as `SUCCESS`.
- **In-Depth Explanation:** In `recovery_verifier.py`, the verifier executes up to 3 polling attempts with exponential backoff against the service's health URL. If the endpoint returns HTTP 200, the recovery record is saved with `status: SUCCESS` and `result: success`. If the endpoint still fails or times out, the recovery record is marked `status: FAILED`, the container is not flagged as healthy, and the incident remains open for operator escalation.

### Q33. Why is mounting the Docker socket in the backend safe for this project?
- **Quick Answer:** Mounting `/var/run/docker.sock` gives container management access to the backend. In our project, it is safe because container names are strictly whitelisted in the database, avoiding arbitrary shell execution.
- **In-Depth Explanation:** Mounting the Docker socket gives root-equivalent control over the host Docker daemon. In commercial enterprise systems, this is restricted via a mutual-TLS Docker socket proxy or Kubernetes RBAC ServiceAccounts. For our academic demonstration on a local workstation, we maintain an explicit whitelist mapping between registered applications and allowed container names (`resiliops-sample-app`), completely disallowing arbitrary shell execution or unrecognized container identifiers.

### Q34. What are your project's limitations?
- **Quick Answer:** It operates on a single-node Docker daemon, uses SQLite which is not suited for multi-server clusters, and requires Minikube running locally for live Kubernetes cluster operations.
- **In-Depth Explanation:** ResiliOps was engineered as a college-level academic project. It does not implement multi-cluster failover across distributed cloud regions. When Minikube is offline, Kubernetes features run in an honest demonstration mode. SQLite is serverless and fast for local testing but lacks distributed write consensus (like Raft in etcd).

### Q35. What would you add if you had 3 more months to work on this?
- **Quick Answer:** I would integrate webhook alerting (Slack/PagerDuty), implement machine-learning anomaly detection for dynamic metric thresholds, add OpenTelemetry distributed tracing, and support multi-cluster Kubernetes deployments.
- **In-Depth Explanation:** 
  1. *Alerting:* Send instant notifications to mobile/Slack channels via webhooks.
  2. *AIOps:* Use Holt-Winters or Prophet models to detect abnormal latency spikes without relying on static thresholds.
  3. *Distributed Tracing:* Trace request spans across microservice boundaries using OpenTelemetry and Jaeger to pinpoint the exact failing function.
  4. *Multi-Cluster Cloud Mesh:* Connect to managed cloud clusters (EKS/GKE) using safe ServiceAccount credentials.
