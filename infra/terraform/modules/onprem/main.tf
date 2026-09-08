# On-prem / private-cloud / restricted-network deployment (section 34).
#
# Deliberately NOT a cloud resource module: on-prem environments rarely
# have a Terraform-manageable database/cache provisioning API, and
# enterprise platform teams typically already own their Postgres/Redis
# provisioning process (e.g. via their own Ansible/Terraform-for-vSphere/
# bare-metal tooling). LocaGuide's contract with that infrastructure is
# just DATABASE_URL and REDIS_URL - see infra/kubernetes/ and
# infra/helm/locaguide for the actual on-prem Kubernetes deployment
# (apply directly against your existing cluster with kubectl/helm).
#
# This module exists only so the on-prem path has the same Terraform
# entry point shape as the cloud modules, for teams that DO want to
# manage the on-prem database/cache declaratively - fill in real
# resources for your provider (e.g. the `postgresql`/`vault` providers,
# or a `kubernetes`/`helm` provider pointed at your cluster) as needed.

terraform {
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

variable "environment" {
  type = string
}

variable "database_url" {
  type        = string
  description = "Connection string for the enterprise-managed PostgreSQL instance."
  sensitive   = true
}

variable "redis_url" {
  type        = string
  description = "Connection string for the enterprise-managed Redis instance."
  sensitive   = true
}

resource "null_resource" "record_intent" {
  triggers = {
    environment = var.environment
  }
}

output "database_url" {
  value     = var.database_url
  sensitive = true
}

output "redis_url" {
  value     = var.redis_url
  sensitive = true
}
