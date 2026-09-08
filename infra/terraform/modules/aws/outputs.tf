output "database_endpoint" {
  value = aws_db_instance.locaguide.address
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.locaguide.cache_nodes[0].address
}

output "database_url_secret_arn" {
  value       = aws_secretsmanager_secret.database_url.arn
  description = "Reference this from your EKS pods via the AWS Secrets Store CSI driver or External Secrets Operator - never copy the value into Terraform state consumers outside this module."
}
