output "network_name" {
  description = "Name of the provisioned Docker network"
  value       = docker_network.resiliops_tf_net.name
}

output "demo_container_id" {
  description = "Docker container ID of the provisioned demo app"
  value       = docker_container.demo_app.id
}

output "demo_app_url" {
  description = "Access URL for the Terraform-provisioned microservice"
  value       = "http://localhost:${var.demo_app_external_port}"
}

