# Development

## Prerequisites

- Node.js 20+, npm 10+
- Docker Desktop (or another Docker engine) for Postgres/Redis locally
- Optional: the Flutter SDK, if you're working on `apps/mobile` (not
  required for backend work)

## First-time setup

```bash
git clone <this-repo>
cd locaguide
cp .env.example .env          # edit JWT_SECRET at minimum
npm install
docker compose -f docker-compose.dev.yml up -d   # Postgres + Redis only
npm run prisma:migrate                            # creates the schema
npm run prisma:seed                               # one SUPER_ADMIN + feature flags
npm run build                                      # tsc -b, all packages/services
npm run dev:api      # http://localhost:4000
npm run dev:worker    # in another terminal
```

If `localhost` doesn't resolve to your Docker containers (seen on some
Windows Docker Desktop setups during this build - IPv6/IPv4 ambiguity),
use `127.0.0.1` in `DATABASE_URL`/`REDIS_URL` instead.

**Working directory matters for the compiled API/worker.** `AI_CONFIG_PATH`
and `POLICY_CONFIG_PATH` default to `./config/ai.yaml` / `./config/policies.yaml`,
resolved relative to the process's current working directory - not the
repo root. `npm run dev:api`/`dev:worker` and the Docker images both get
this right automatically (npm workspaces run scripts with cwd set to the
workspace folder; the Dockerfiles set `WORKDIR /app/services/api`). If you
ever run the compiled output directly (`node services/api/dist/index.js`),
you must `cd services/api` first, or the app silently falls back to
mock-only defaults - real providers (e.g. a configured
`GOOGLE_PLACES_API_KEY`) will look "not configured" from the wrong
directory even though the key is present. As of this fix, that fallback
now logs a `warn`-level message naming the resolved path it looked for -
check the logs first if a provider you configured isn't being used.

## Everyday commands

| Command | Does |
|---|---|
| `npm run build` | `tsc -b` across every package/service (project references) |
| `npm test` | full Jest suite (unit + API integration) |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run prisma:studio` | Prisma Studio GUI against your local DB |
| `npm run dev:api` / `npm run dev:worker` | `ts-node-dev` hot-reload |

## Monorepo mental model

See `docs/architecture.md#monorepo-layout`. The short version: business
logic lives in `packages/domain` (no DB), gets composed with Prisma +
providers in `packages/runtime`, and is exposed over HTTP by `services/api`
or over a queue by `services/worker`. When adding a feature, ask "is this
a pure rule (→ domain), an orchestration step (→ runtime), or a
transport concern (→ api/worker)?" before deciding where the code goes.

## Adding an API endpoint

1. Add/extend a Zod schema in `packages/contracts` if the request/response
   shape is new.
2. Add the business logic to the right `packages/runtime/src/*Service.ts`
   (or `packages/domain` if it's pure).
3. Add the route in `services/api/src/routes/*.routes.ts`, wrapped in
   `asyncHandler`, validated with `validateBody`/`validateQuery`.
4. Document it in `services/api/openapi.yaml`.
5. Add an integration test in `services/api/src/app.test.ts` (or a new
   `*.test.ts` file under `services/api/src`).

## Running in full demo mode

No external credential is required for anything to work - see
`docs/provider-architecture.md`. `.env.example` documents every optional
variable; leave them blank and every provider resolves to its mock
implementation.
