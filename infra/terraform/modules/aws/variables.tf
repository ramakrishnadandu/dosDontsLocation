variable "environment" {
  type        = string
  description = "Deployment environment name (e.g. dev, staging, prod)."
}

variable "vpc_id" {
  type        = string
  description = "Existing VPC to deploy into. This module does not create a VPC - use your organization's standard VPC module."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for the database and cache."
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.small"
}

variable "db_allocated_storage_gb" {
  type    = number
  default = 20
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "allowed_security_group_ids" {
  type        = list(string)
  description = "Security groups (e.g. the EKS node group SG) allowed to reach the database and cache."
}

variable "tags" {
  type    = map(string)
  default = {}
}
