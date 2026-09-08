# LocaGuide Admin Console

## Current status: API-only, no dedicated frontend yet

The admin **backend** is fully implemented and protected by RBAC:
`services/api/src/routes/admin.routes.ts`, mounted at `/api/v1/admin/*`.
It covers everything section 20 of the product spec lists as admin
capabilities that have a corresponding data model today:

- `GET /admin/users`, `PUT /admin/users/:id/role`
- `GET /admin/moderation/cases`, `POST /admin/moderation/cases/:id/resolve`
- `GET /admin/reports`
- `GET /admin/audit-logs`
- `GET /admin/feature-flags`, `PUT /admin/feature-flags/:key`

All of it requires a bearer token for a non-`USER` role (`SUPER_ADMIN`,
`ADMIN`, `MODERATOR`, `ANALYST`, or `SUPPORT`, depending on the endpoint -
see the `requireRole(...)` call on each route). Every mutating action is
audit-logged.

## What's not built

A dedicated admin web UI. This directory is a placeholder for one - the
natural choice given the rest of the stack is TypeScript would be a
Vite + React (or Next.js) app that calls the same `/api/v1/admin/*`
endpoints documented in `services/api/openapi.yaml`. It was not built in
this pass to keep scope focused on the core product loop (location
search → intelligence → community opinions) end-to-end; the backend is
ready for it whenever it's prioritized.

In the meantime, `services/api/openapi.yaml`'s Swagger UI (`/api/docs`)
or any REST client (Postman, `curl`, HTTPie) is a fully functional way to
exercise every admin capability, including in demo/mock mode - see
`packages/db/prisma/seed.ts` for the seeded `SUPER_ADMIN` demo account.
