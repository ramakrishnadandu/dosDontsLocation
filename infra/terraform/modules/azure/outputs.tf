output "database_fqdn" {
  value = azurerm_postgresql_flexible_server.locaguide.fqdn
}

output "redis_hostname" {
  value = azurerm_redis_cache.locaguide.hostname
}
