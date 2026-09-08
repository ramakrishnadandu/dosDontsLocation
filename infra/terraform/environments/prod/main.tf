# Prod environment wiring for AWS. Same shape as environments/dev - see
# infra/terraform/README.md for how to adapt this to Azure/GCP/on-prem.

terraform {
  required_version = ">= 1.5"
  backend "local" {}
}

provider "aws" {
  region = var.region
}

module "data_plane" {
  source                     = "../../modules/aws"
  environment                = "prod"
  vpc_id                     = var.vpc_id
  private_subnet_ids         = var.private_subnet_ids
  allowed_security_group_ids = var.allowed_security_group_ids
  db_instance_class          = "db.r6g.large"
  redis_node_type            = "cache.r6g.large"
  tags = {
    Project     = "locaguide"
    Environment = "prod"
  }
}
