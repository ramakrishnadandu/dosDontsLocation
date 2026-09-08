# On-Premises / Private-Cloud Deployment

The same container images used in cloud deployments (`infra/docker/*`)
run unmodified on an enterprise's own Kubernetes cluster, private cloud,
or restricted-network data center - there is nothing cloud-specific baked
into the API/worker images.

## What changes on-prem

1. **Database/cache**: use `infra/kubernetes/postgres-statefulset.yaml` +
   `redis-deployment.yaml` (or the Helm chart with
   `postgres.enabled=true`/`redis.enabled=true`) if the enterprise has no
   existing managed Postgres/Redis, or point `DATABASE_URL`/`REDIS_URL` at
   whatever they already run. `infra/terraform/modules/onprem` is a
   pass-through module for teams that want to manage that declaratively.
2. **External providers**: an on-prem/restricted-network deployment
   typically cannot reach `googleapis.com`/`api.openai.com`/
   `api.anthropic.com`. Set `config/policies.yaml`'s `providers.*`
   allow-lists to `["mock"]` (and `["mock", "community"]` for reviews) to
   guarantee no outbound call to a disallowed provider is ever attempted,
   regardless of whether a credential happens to be configured - this is
   enforced in `packages/runtime/src/registry.ts`, not just documented.
3. **Local AI models**: implemented, not just an integration point -
   `OllamaProvider` (`packages/providers/src/ai/OllamaProvider.ts`) calls
   a local [Ollama](https://ollama.com) server, verified working end-to-
   end against `llama3.2:3b` (see `docs/ai-architecture.md#local-open-
   source-model-ollama`). It's already the default AI provider in
   `config/ai.yaml`. For an enterprise network where even Ollama's own
   model registry is unreachable, pre-download the model file and point
   `OLLAMA_BASE_URL` at an internal Ollama/vLLM endpoint - no code change
   needed either way, since the recommendation engine only depends on the
   `AIGenerator` interface (`generate(request)`), never a specific vendor.
4. **Image registry**: push `infra/docker/*.Dockerfile` builds to the
   enterprise's own private registry and update `image.api.repository`/
   `image.worker.repository` in the Helm values.
5. **TLS/ingress**: swap `cert-manager` + a public `ClusterIssuer` for
   whatever internal CA/ingress controller the enterprise already runs -
   `infra/kubernetes/ingress.yaml` and the Helm ingress template are both
   parameterized (`ingressClassName`, `clusterIssuer`) for this.

## What does NOT change

- Application code, database schema, and the API contract are identical
  to the cloud deployment - there is no "on-prem build."
- Security posture (non-root containers, read-only root filesystem,
  default-deny NetworkPolicy, RBAC, audit logging) is the same.
- Demo/mock mode works identically on-prem, which is useful for an
  enterprise's initial evaluation before granting any external network
  egress at all.
