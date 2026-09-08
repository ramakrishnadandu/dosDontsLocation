# GCP data-plane module: Cloud SQL for PostgreSQL + Memorystore for Redis.
# Does NOT provision a VPC or GKE cluster - see the note in
# modules/aws/main.tf; the same rationale applies here.

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "google_sql_database_instance" "locaguide" {
  name             = "locaguide-${var.environment}"
  project          = var.project_id
  region           = var.region
  database_version = "POSTGRES_16"

  settings {
    tier = var.db_tier
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_id
    }
    backup_configuration {
      enabled = true
    }
  }

  deletion_protection = var.environment == "prod"
}

resource "google_sql_database" "locaguide" {
  name     = "locaguide"
  project  = var.project_id
  instance = google_sql_database_instance.locaguide.name
}

resource "google_sql_user" "locaguide" {
  name     = "locaguide"
  project  = var.project_id
  instance = google_sql_database_instance.locaguide.name
  password = random_password.db.result
}

resource "google_redis_instance" "locaguide" {
  name           = "locaguide-${var.environment}"
  project        = var.project_id
  region         = var.region
  tier           = "BASIC"
  memory_size_gb = var.redis_memory_gb
  authorized_network = var.network_id
}

resource "google_secret_manager_secret" "database_url" {
  secret_id = "locaguide-${var.environment}-database-url"
  project   = var.project_id
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://locaguide:${random_password.db.result}@${google_sql_database_instance.locaguide.private_ip_address}:5432/locaguide"
}
