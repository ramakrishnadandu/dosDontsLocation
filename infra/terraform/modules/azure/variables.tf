variable "environment" {
  type = string
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group. This module does not create networking - use your organization's standard VNet module."
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID for the delegated database subnet."
}

variable "db_sku_name" {
  type    = string
  default = "B_Standard_B1ms"
}

variable "redis_sku_name" {
  type    = string
  default = "Basic"
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "key_vault_id" {
  type        = string
  description = "Existing Key Vault to store the generated database URL in."
}
