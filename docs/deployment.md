# Deployment

## Local / Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Brings up Postgres, Redis, the API (`:4000`), and the worker. Run
migrations once against the compose Postgres:
`DATABASE_URL=postgresql://locaguide:locaguide@localhost:5432/locaguide npm run prisma:migrate:deploy`.

## Kubernetes (raw manifests)

```bash
kubectl apply -k infra/kubernetes/
# then, out of band (never commit real secrets):
kubectl create secret generic locaguide-secrets -n locaguide \
  --from-literal=DATABASE_URL=... --from-literal=REDIS_URL=... \
  --from-literal=JWT_SECRET=... --from-literal=POSTGRES_PASSWORD=...
```

The `kustomization.yaml` wires together namespace, config, service
accounts, the self-managed Postgres/Redis (suitable for on-prem/dev -
see below for cloud), the API/worker Deployments (with HPA + PDB), the
Ingress, and default-deny `NetworkPolicy` with explicit allows.

## Kubernetes via Helm

```bash
helm upgrade --install locaguide infra/helm/locaguide \
  --namespace locaguide --create-namespace \
  --set image.api.tag=<git-sha> --set image.worker.tag=<git-sha> \
  --set ingress.host=api.yourdomain.com
```

Set `postgres.enabled=false` and `redis.enabled=false` plus
`externalDatabaseUrl`/`externalRedisUrl` once you have managed instances
(see Terraform below) - the chart was linted and its templates verified
to render correctly (`helm lint` / `helm template`) as part of this build.

## Cloud database/cache (Terraform)

`infra/terraform/modules/{aws,azure,gcp}` each provision a managed
Postgres + Redis and a secret-manager entry for the connection string;
`infra/terraform/modules/onprem` is a pass-through for an
enterprise-managed database. See `infra/terraform/README.md`. None of
these were applied against a real cloud account in this environment
(no credentials available) - all four were verified with
`terraform validate`, which does not require credentials.

Kubernetes cluster provisioning (EKS/AKS/GKE) is intentionally not
included - use your organization's standard cluster module, then deploy
LocaGuide onto it with the Helm chart above.

## Build & push images manually

```bash
docker build -f infra/docker/api.Dockerfile    -t <registry>/locaguide-api:<tag>    .
docker build -f infra/docker/worker.Dockerfile -t <registry>/locaguide-worker:<tag> .
docker push <registry>/locaguide-api:<tag>
docker push <registry>/locaguide-worker:<tag>
```

Build context must be the repo root (npm workspaces) - both Dockerfiles
assume this.

## Observability in production

- `/livez` (liveness) and `/readyz` (readiness, checks Postgres + Redis)
  are already wired into both the raw manifests and the Helm chart's
  probes.
- Structured JSON logs (`pino`) go to stdout - point your log
  aggregator (CloudWatch/Stackdriver/Loki/etc) at container stdout as
  usual; nothing app-specific is required.
- OpenTelemetry tracing/metrics export is not yet wired in - the
  structured logs already carry `requestId`/`correlationId` on every line
  (`pino-http`), which is enough to correlate today; adding an OTel SDK
  exporter is a natural next step (see `docs/architecture.md`).

## On-prem / restricted-network deployment

See `docs/on-prem.md`.
