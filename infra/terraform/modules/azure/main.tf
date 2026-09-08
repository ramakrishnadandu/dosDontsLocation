# Azure data-plane module: Azure Database for PostgreSQL Flexible Server +
# Azure Cache for Redis. Does NOT provision a VNet or AKS cluster - see the
# note in modules/aws/main.tf; the same rationale applies here.

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
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

resource "azurerm_postgresql_flexible_server" "locaguide" {
  name                   = "locaguide-${var.environment}"
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "16"
  administrator_login    = "locaguide"
  administrator_password = random_password.db.result
  sku_name               = var.db_sku_name
  storage_mb             = 32768
  delegated_subnet_id    = var.subnet_id
  backup_retention_days  = 7
  tags                   = var.tags
}

resource "azurerm_postgresql_flexible_server_database" "locaguide" {
  name      = "locaguide"
  server_id = azurerm_postgresql_flexible_server.locaguide.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "azurerm_redis_cache" "locaguide" {
  name                = "locaguide-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = 0
  family              = "C"
  sku_name            = var.redis_sku_name
  tags                = var.tags
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "locaguide-${var.environment}-database-url"
  value        = "postgresql://locaguide:${random_password.db.result}@${azurerm_postgresql_flexible_server.locaguide.fqdn}:5432/locaguide"
  key_vault_id = var.key_vault_id
}
