# LocaGuide Terraform

Cloud-agnostic infrastructure for LocaGuide's stateful data plane
(PostgreSQL + Redis). Kubernetes cluster provisioning is intentionally
**out of scope** here - use your cloud's standard cluster module
(`terraform-aws-modules/eks`, `Azure/aks`, `terraform-google-modules/kubernetes-engine`)
or an existing on-prem cluster, then deploy LocaGuide onto it with
`infra/helm/locaguide` (see `docs/deployment.md`).

```
infra/terraform/
├── modules/
│   ├── aws/      # RDS Postgres + ElastiCache Redis + Secrets Manager entry
│   ├── azure/    # Postgres Flexible Server + Azure Cache for Redis + Key Vault entry
│   ├── gcp/      # Cloud SQL Postgres + Memorystore Redis + Secret Manager entry
│   └── onprem/   # Pass-through module for enterprise-managed Postgres/Redis
└── environments/
    ├── dev/
    └── prod/
```

All four modules were validated with `terraform validate` (no cloud
credentials required for that). None have been applied against a real
account in this environment - review resource sizing/naming/tags for your
organization before running `terraform apply`.

## Usage

```bash
cd infra/terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars   # fill in your VPC/subnet/SG ids
terraform init
terraform plan
terraform apply
```

Swap the `module "data_plane" { source = ... }` line to point at
`../../modules/azure`, `../../modules/gcp`, or `../../modules/onprem` to
target a different environment - the variable shapes differ per cloud
(see each module's `variables.tf`) because each cloud's managed-database
API differs; the output contract (a connection string / secret reference)
is what the Kubernetes Secret (`infra/kubernetes/secret.example.yaml`)
ultimately consumes.
