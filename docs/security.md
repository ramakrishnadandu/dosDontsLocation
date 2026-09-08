# Security

## Authentication & authorization

- Passwords hashed with bcrypt (12 rounds) - `services/api/src/services/authService.ts`.
- JWT access tokens (short-lived, default 15m) + refresh tokens (30d,
  hashed with SHA-256 before storage so a DB leak doesn't leak usable
  refresh tokens - see `RefreshToken.tokenHash`). Refresh tokens are
  single-use: `refresh()` revokes the presented token and issues a new one.
- RBAC via `Role` enum (`SUPER_ADMIN/ADMIN/MODERATOR/ANALYST/SUPPORT/USER`),
  enforced with `requireRole(...)` middleware
  (`services/api/src/middleware/auth.ts`). Every `/admin/*` route requires
  at least one non-`USER` role; sensitive actions (role changes) require
  `SUPER_ADMIN`.
- Tokens are only ever accepted via the `Authorization: Bearer` header -
  never via query string (avoids leaking tokens into logs/proxies).

## Transport & headers

- `helmet()` is applied globally (CSP, HSTS, X-Content-Type-Options, etc -
  see the response headers in any request).
- CORS is allow-listed via `CORS_ORIGINS`, not wildcarded.
- TLS termination is expected at the ingress/load balancer
  (`infra/kubernetes/ingress.yaml` uses cert-manager); the app itself
  speaks plain HTTP behind that boundary, which is standard for
  Kubernetes ingress-terminated TLS.

## Input validation & injection

- Every request body/query is parsed with a Zod schema
  (`services/api/src/middleware/validate.ts`) before it reaches a route
  handler - invalid input never reaches business logic.
- All database access goes through Prisma's parameterized query builder -
  no raw SQL string concatenation anywhere in the codebase (the one
  `$queryRaw` call, in `health.routes.ts`, is a static `SELECT 1` with no
  interpolated input).
- AI prompts never concatenate raw user input into system instructions -
  see `docs/ai-architecture.md`.

## Rate limiting

- Global: 120 req/min per the default in-memory limiter
  (`services/api/src/middleware/rateLimit.ts`).
- Auth endpoints: 20 req/15min, to slow credential-stuffing.
- **Production note**: the default limiter is in-memory and therefore
  per-instance. For horizontal scaling, swap in a Redis-backed store
  (e.g. `rate-limit-redis`) so the limit is shared across replicas - the
  hook point is documented in that file.

## Secrets

- No API key, database password, or JWT secret is ever hard-coded or
  committed - `.env` is git-ignored, `.env.example` documents every
  variable, and Kubernetes secrets are provided as an example manifest
  only (`infra/kubernetes/secret.example.yaml`) that must be populated out
  of band (vault, sealed-secrets, CI injection, or your cloud secret
  manager - see the Terraform modules' Secrets Manager/Key Vault/Secret
  Manager resources).
- Provider API keys never reach the Flutter client - all provider calls
  are made server-side by `packages/providers`, invoked only from
  `services/api`/`services/worker`.

## Containers

- Multi-stage Docker builds (`infra/docker/*.Dockerfile`), non-root user
  (uid 1001), `HEALTHCHECK` on the API image, minimal `node:20-bookworm-slim`
  base.
- Kubernetes pods run with `runAsNonRoot`, `readOnlyRootFilesystem`,
  `allowPrivilegeEscalation: false`, all capabilities dropped, and a
  default-deny `NetworkPolicy` with explicit allows
  (`infra/kubernetes/networkpolicy.yaml`).

## CI security gates

- `npm audit` (non-blocking today - see "Known advisories" below).
- CodeQL SAST on every push/PR (`.github/workflows/codeql.yml`).
- Trivy container scan of the built API image
  (`.github/workflows/ci.yml`), currently non-blocking (`exit-code: "0"`)
  pending a baseline triage pass - tighten once findings are reviewed.
- DAST is not yet wired into CI (it needs a running deployed target); the
  intended tool is an OWASP ZAP baseline scan against a staging URL post-deploy
  - add this as a follow-up workflow once a staging environment exists.

## Known advisories

- `express@4.22.2` → `body-parser` → `qs` carries a moderate-severity
  advisory (GHSA-x5fp-wj9c-mxmx / GHSA-4mjr-xmp4-gh2g) with no non-breaking
  fix available at the time of writing (`npm audit fix` cannot resolve it
  without a major Express bump). Tracked, not yet remediated - re-run
  `npm audit` before each release.

## Audit logging

Every security-sensitive action (`LOGIN`, `ROLE_CHANGE`, `ADMIN_ACTION`,
`MODERATION_ACTION`, `DATA_DELETION`, `DATA_EXPORT`, ...) is written to
`AuditLog` (`services/api/src/services/auditService.ts`) with
`timestamp/actorId/action/resource/result/requestId/correlationId` -
deliberately no request bodies, tokens, or other sensitive payloads.
