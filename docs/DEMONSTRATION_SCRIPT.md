# ResiliOps – Live Examination Demonstration Script

**Project Title:** ResiliOps – Cloud-Native DevOps Automation and Self-Healing Platform  
**Target Audience:** Internal Examination Committee, External Examiners, and Faculty Guides  
**Demonstration Duration:** ~10 to 12 Minutes  
**Prepared by:** [Student Name] ([Enrollment Number])

---

## 1. Pre-Examination Checklist (Run 5 Minutes Before Faculty Arrives)

Open your terminal in the project directory:
```bash
cd /home/blaze/vs-code/ResiliOps
```

1. **Verify Docker Daemon is Running:**
   ```bash
   DOCKER_HOST=unix:///var/run/docker.sock docker ps
   ```
2. **Start the Complete Platform:**
   ```bash
   DOCKER_HOST=unix:///var/run/docker.sock docker compose up -d
   ```
3. **Open Browser Tabs in Order:**
   - **Tab 1 (Main Dashboard):** `http://localhost:5173`
   - **Tab 2 (Incidents & Healing):** `http://localhost:5173/incidents` and `http://localhost:5173/self-healing`
   - **Tab 3 (FastAPI Swagger API):** `http://localhost:8000/docs`
   - **Tab 4 (Prometheus Targets):** `http://localhost:9090/targets`
   - **Tab 5 (Grafana Dashboards):** `http://localhost:3000` (User: `admin`, Password: `admin`)
   - **Tab 6 (Sample App Direct):** `http://localhost:8001/health`

---

## 2. Step-by-Step Live Demonstration Walkthrough

### Step 1: Introduction & Architecture Overview (1.5 Minutes)
- **Spoken Script:**
  > *"Good morning respected faculty and examiners. Today I am demonstrating **ResiliOps**, a Cloud-Native DevOps Automation and Self-Healing Platform. In distributed microservice environments, applications crash unexpectedly, leading to downtime and high Mean Time to Recovery. ResiliOps solves this by continuously monitoring microservices, detecting failures, and executing automated container restarts and rollbacks autonomously."*
- **Action:**
  - Show the terminal: `docker compose ps`. Point out all 5 running containers:
    1. `resiliops-frontend` (Nginx + React SPA)
    2. `resiliops-backend` (FastAPI Control Plane)
    3. `resiliops-sample-app` (Target Microservice)
    4. `resiliops-prometheus` (Metrics Scraper)
    5. `resiliops-grafana` (Telemetry Visualizer)

---

### Step 2: Live React Dashboard & Health Probing (2 Minutes)
- **Action:** Switch to **Tab 1** (`http://localhost:5173`).
- **Spoken Script:**
  > *"Here is the ResiliOps React Dashboard served through production Nginx. It shows our System Health Score (currently healthy), registered microservices, and live host CPU and RAM metrics collected via psutil. Notice that the frontend polls the backend asynchronously every 5 seconds without full page refreshes."*
- **Action:** Click **Applications** in the left sidebar (`/applications`).
- **Spoken Script:**
  > *"Each registered application displays its live status code, response time in milliseconds, replica count, and associated Docker container. The sample application is currently healthy and responding in under 15ms."*

---

### Step 3: Injecting a Live Failure & Failure Detection (2.5 Minutes)
- **Spoken Script:**
  > *"Now, let's simulate a sudden microservice failure. I will send an HTTP POST request to crash our sample microservice."*
- **Action:** Open terminal and run:
  ```bash
  curl -s -X POST http://localhost:8001/crash
  ```
- **Spoken Script:**
  > *"The sample microservice is now failing with HTTP 500. Let's trigger a monitoring cycle to see how ResiliOps detects the outage."*
- **Action:** In terminal (or wait for the automatic background loop):
  ```bash
  curl -s -X POST http://localhost:8000/api/monitoring/check-now
  ```
- **Action:** Switch to **Tab 2** (`http://localhost:5173/incidents`).
- **Spoken Script:**
  > *"Notice what happened:
  > 1. Consecutive failures incremented from 0 to 3.
  > 2. The Failure Detection Engine identified consecutive HTTP 500 errors.
  > 3. An incident was automatically generated with severity CRITICAL.
  > 4. Notice that even if the failure persists, ResiliOps suppresses duplicate alerts so the SRE team is not spammed."*

---

### Step 4: Autonomous Self-Healing & Container Recovery (2.5 Minutes)
- **Spoken Script:**
  > *"Now let's demonstrate autonomous self-healing. ResiliOps maps the unhealthy application to its Docker container (`resiliops-sample-app`) and restarts it using the Docker daemon socket."*
- **Action:** Run the container restart recovery via API or click the restart button on the Self-Healing page:
  ```bash
  curl -s -X POST http://localhost:8000/api/recovery/execute \
    -H "Content-Type: application/json" \
    -d '{"app_id": 1, "action_type": "Container Restart"}'
  ```
- **Spoken Script:**
  > *"Observe the output. ResiliOps issued a restart call to Docker, waited for container initialization, and then sent a health check probe to verify recovery. The container responded with HTTP 200 in 10ms, and the recovery status is marked SUCCESS."*
- **Action:** Refresh or view **Tab 2** (`/self-healing` and `/incidents`).
- **Spoken Script:**
  > *"The recovery action is permanently recorded in the SQLite audit log with timestamp, target container, and latency. The open incident has now automatically transitioned to RESOLVED."*

---

### Step 5: Deployment Rollback & Autoscaling Guardrails (1.5 Minutes)
- **Spoken Script:**
  > *"ResiliOps also protects against faulty software deployments. If a new version causes regressions, we can trigger an automated rollback."*
- **Action:** Run in terminal:
  ```bash
  curl -s -X POST http://localhost:8000/api/recovery/rollback/1
  ```
- **Spoken Script:**
  > *"Notice that Payment Service version was rolled back from v2.4.1 to stable release v1.0.0 and verified healthy."*
- **Action:** Demonstrate autoscaling guardrails:
  ```bash
  curl -s -X POST http://localhost:8000/api/recovery/scale/1 -H "Content-Type: application/json" -d '{"direction": "up"}'
  ```
- **Spoken Script:**
  > *"The replica set scales dynamically. If we attempt to scale beyond the configured maximum limit of 6 replicas, ResiliOps rejects the request with status SKIPPED to prevent resource exhaustion."*

---

### Step 6: Observability with Prometheus & Grafana (1.5 Minutes)
- **Action:** Switch to **Tab 4** (`http://localhost:9090/targets`).
- **Spoken Script:**
  > *"Here is Prometheus. Notice that both `resiliops-backend` and `resiliops-sample-app` are active scrape targets in `UP` status. The backend exposes custom OpenMetrics telemetry on `/metrics`."*
- **Action:** Switch to **Tab 5** (`http://localhost:3000`).
- **Spoken Script:**
  > *"In Grafana, our pre-provisioned dashboard automatically loads from configuration files without any manual setup, rendering real-time CPU, RAM, and application uptime graphs using PromQL queries."*

---

### Step 7: Infrastructure as Code with Local Terraform (1.5 Minutes)
- **Spoken Script:**
  > *"Finally, we demonstrate Infrastructure as Code. To avoid external cloud expenses, we use the local `kreuzwerker/docker` provider in Terraform."*
- **Action:** In terminal:
  ```bash
  cd terraform
  terraform plan
  ```
- **Spoken Script:**
  > *"Terraform generates an execution plan declaring a dedicated Docker network and a microservice container. We can apply it with `terraform apply -auto-approve` and destroy it with `terraform destroy -auto-approve` cleanly."*
- **Action:** Return to project root: `cd ..`.

---

## 3. Emergency Contingency & Backup Plans

### Backup Plan A: "What if Docker is stopped or ports are busy?"
If Docker throws a daemon connection error:
```bash
# Restart Docker service
sudo systemctl restart docker

# Ensure DOCKER_HOST points to standard unix socket
export DOCKER_HOST=unix:///var/run/docker.sock

# Restart ResiliOps stack
docker compose up -d
```

### Backup Plan B: "What if the examiner asks about Kubernetes?"
- **If Minikube is not running:**
  > *"In our testing, we verified that when Minikube is offline, ResiliOps detects cluster unavailability gracefully. The Infrastructure page displays an honest demonstration mode banner and explains that Minikube is not reachable, rather than pretending a cluster operation succeeded."*
- **If the examiner insists on seeing Kubernetes:**
  ```bash
  minikube start
  kubectl apply -f k8s/
  kubectl get pods -n resiliops
  ```

### Backup Plan C: "What if port 5173 or 8000 fails to bind?"
```bash
# Check what process is occupying port 8000 or 5173
lsof -i :8000
lsof -i :5173

# Gracefully down and recreate containers
docker compose down
docker compose up -d
```

---

## 4. Quick Summary for Final Closing Statement

> *"In conclusion, ResiliOps provides an autonomous, full-cycle DevOps automation and self-healing platform. It reduces Mean Time to Recovery (MTTR) from minutes to under 3 seconds, prevents alert fatigue through duplicate incident suppression, enforces safety limits on autoscaling, and demonstrates modern cloud-native practices using Docker, Kubernetes, Terraform, Prometheus, and Grafana on local hardware without paid cloud subscriptions. Thank you, and I am now open to your questions."*
