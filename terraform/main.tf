# ResiliOps Infrastructure as Code (IaC) Demonstration
# Uses kreuzwerker/docker provider for local academic viva demonstration without cloud charges.

# 1. Dedicated Docker Network for IaC resources
resource "docker_network" "resiliops_tf_net" {
  name   = var.network_name
  driver = "bridge"
}

# 2. Demonstration Microservice Container
resource "docker_container" "demo_app" {
  name  = var.demo_app_container_name
  image = var.demo_app_image

  networks_advanced {
    name = docker_network.resiliops_tf_net.name
  }

  ports {
    internal = 8000
    external = var.demo_app_external_port
  }

  env = [
    "PORT=8000",
    "ENVIRONMENT=terraform-provisioned"
  ]

  restart = "on-failure"
}

