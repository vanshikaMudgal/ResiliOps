variable "network_name" {
  description = "Docker network name for Terraform-managed ResiliOps infrastructure"
  type        = string
  default     = "resiliops_tf_network"
}

variable "demo_app_container_name" {
  description = "Name of the demonstration application container"
  type        = string
  default     = "resiliops_tf_demo_app"
}

variable "demo_app_image" {
  description = "Docker image for the demonstration application"
  type        = string
  default     = "resiliops-sample-app:latest"
}

variable "demo_app_external_port" {
  description = "External host port to expose the demonstration application"
  type        = number
  default     = 8085
}

