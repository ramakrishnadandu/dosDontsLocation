# AWS data-plane module: managed PostgreSQL (RDS) + managed Redis
# (ElastiCache) for LocaGuide. Deliberately does NOT provision a VPC or an
# EKS cluster - use your organization's standard VPC module and the
# official terraform-aws-modules/eks module for those, then pass this
# module their outputs (vpc_id, private_subnet_ids, node group security
# group). This keeps LocaGuide's Terraform cloud-agnostic and avoids
# duplicating infrastructure your platform team likely already owns.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

resource "aws_db_subnet_group" "locaguide" {
  name       = "locaguide-${var.environment}"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

resource "aws_security_group" "db" {
  name_prefix = "locaguide-db-${var.environment}-"
  vpc_id      = var.vpc_id
  tags        = var.tags

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "locaguide" {
  identifier              = "locaguide-${var.environment}"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage_gb
  storage_encrypted       = true
  db_name                 = "locaguide"
  username                = "locaguide"
  password                = random_password.db.result
  db_subnet_group_name    = aws_db_subnet_group.locaguide.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  backup_retention_period = 7
  deletion_protection     = var.environment == "prod"
  skip_final_snapshot     = var.environment != "prod"
  tags                    = var.tags
}

resource "aws_elasticache_subnet_group" "locaguide" {
  name       = "locaguide-${var.environment}"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "redis" {
  name_prefix = "locaguide-redis-${var.environment}-"
  vpc_id      = var.vpc_id
  tags        = var.tags

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_cluster" "locaguide" {
  cluster_id           = "locaguide-${var.environment}"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.locaguide.name
  security_group_ids   = [aws_security_group.redis.id]
  tags                 = var.tags
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "locaguide-${var.environment}-database-url"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql://locaguide:${random_password.db.result}@${aws_db_instance.locaguide.address}:5432/locaguide"
}
