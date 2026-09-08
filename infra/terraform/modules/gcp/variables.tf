variable "project_id" {
  type = string
}

variable "environment" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "network_id" {
  type        = string
  description = "Existing VPC network self-link for private services access."
}

variable "db_tier" {
  type    = string
  default = "db-custom-1-3840"
}

variable "redis_memory_gb" {
  type    = number
  default = 1
}
