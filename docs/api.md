# API

Base path: `/api/v1`. Interactive docs: `GET /api/docs` (Swagger UI, served
from `services/api/openapi.yaml`). Health: `GET /livez`, `GET /readyz`,
`GET /healthz` (root-level, not under `/api/v1`).

## Error envelope

Every error response has this shape:

```json
{
  "error": {
    "code": "LOCATION_NOT_FOUND",
    "message": "Location could not be identified.",
    "request_id": "req_..."
  }
}
```

`request_id` is also echoed as the `x-request-id` response header, and a
separate `x-correlation-id` header is attached to every response (see
`services/api/src/middleware/requestContext.ts`) so a request can be
traced across API → worker → logs.

## Endpoint groups

| Prefix | Purpose | Auth |
|---|---|---|
| `/auth` | register/login/refresh | none (rate-limited) |
| `/users` | profile, preferences, export, delete | bearer JWT |
| `/locations` | search, details, evidence-based intelligence, review signals, community list | none for reads; optional for intelligence (personalization-ready) |
| `/community` | submit opinion, vote, check-in | bearer JWT |
| `/products` | search, details, active deals | none |
| `/admin` | users, moderation queue, reports, audit logs, feature flags | bearer JWT + RBAC |

Full parameter/response documentation is in `services/api/openapi.yaml`.

## Pagination

List endpoints that support it accept `page`/`pageSize` query params and
return `{ items, pagination: { page, pageSize, total, totalPages } }`
(`packages/contracts/src/api.ts#paginatedResponse`).

## Versioning

The API is versioned via the URL prefix (`/api/v1`). Breaking changes ship
as `/api/v2` rather than mutating v1 in place; see `docs/architecture.md`
for how provider adapters, prompt templates, and the recommendation engine
are independently versioned (`Evidence.promptTemplateVersion`,
`Evidence.modelVersion`).
