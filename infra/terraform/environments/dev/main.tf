# Example dev environment wiring for AWS. Copy this directory per
# cloud/environment and adjust the module source (../../modules/azure,
# ../../modules/gcp, ../../modules/onprem) and variables as needed - see
# infra/terraform/README.md.

terraform {
  required_version = ">= 1.5"
  backend "local" {}
}

provider "aws" {
  region = var.region
}

module "data_plane" {
  source                     = "../../modules/aws"
  environment                = "dev"
  vpc_id                     = var.vpc_id
  private_subnet_ids         = var.private_subnet_ids
  allowed_security_group_ids = var.allowed_security_group_ids
  tags = {
    Project     = "locaguide"
    Environment = "dev"
  }
}
