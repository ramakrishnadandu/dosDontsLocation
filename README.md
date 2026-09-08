# LocaGuide

A real-world location intelligence assistant: point it at a mall,
restaurant, hospital, hotel, or attraction and get an evidence-backed
briefing (DO / CONSIDER / WATCH / MUST SEE / SPENDING / HEALTH-AWARE)
built from official data, review signals, and community opinions - never
presenting an AI-generated synthesis as a verified fact.

See `docs/product-requirements.md` for what's implemented vs. deferred,
and `docs/architecture.md` for how it fits together (with diagrams).

## Quick start (demo mode - no API keys required)

```bash
git clone <this-repo>
cd locaguide
cp .env.example .env              # edit JWT_SECRET; everything else is optional
npm install
docker compose -f docker-compose.dev.yml up -d   # Postgres + Redis
npm run prisma:migrate
npm run prisma:seed
npm run build
npm run dev:api      # http://localhost:4000  (Swagger UI: /api/docs)
```

In another terminal:

```bash
npm run dev:worker
```

Try it:

```bash
curl "http://localhost:4000/api/v1/locations/search?q=fort"
curl "http://localhost:4000/api/v1/locations/demo-attraction-1/intelligence"
```

Every provider (location, reviews, products, AI) runs in mock/demo mode
automatically because no external credential is set - see
`docs/provider-architecture.md`. Demo data is clearly flagged
(`isDemoData: true`) in every API response.

**Note on Windows/Docker Desktop**: if `DATABASE_URL`/`REDIS_URL` with
`localhost` fail to connect, use `127.0.0.1` instead - this was needed to
get Prisma connecting reliably in the environment this was built in.

## Repository layout

```
apps/
├── mobile/    Flutter client (Android/iOS/Web) - see apps/mobile/README.md
└── admin/     Admin console - API-only today, see apps/admin/README.md
services/
├── api/       Express REST API
└── worker/    BullMQ background jobs
packages/
├── contracts/ Shared Zod schemas (the wire contract)
├── domain/    Pure business logic (review engine, recommendation engine, moderation, policy)
├── providers/ Location/Review/Product/AI provider interfaces + mock/real adapters
├── runtime/   Server-side composition (Prisma + providers + domain), shared by api & worker
├── db/        Prisma schema, migrations
├── config/    Env/AI-routing/policy config loaders
└── shared/    Logger, errors, ids, data classification
infra/
├── docker/    Multi-stage, non-root Dockerfiles
├── kubernetes/  Raw manifests (Deployment/HPA/PDB/NetworkPolicy/Ingress/...)
├── helm/      Helm chart wrapping the same
└── terraform/ AWS/Azure/GCP/on-prem data-plane modules
docs/          Architecture, security, privacy, deployment, on-prem, AI, providers, database, testing, development
```

## Commands

| Command                                                          | Does                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm install`                                                  | install all workspaces                                                        |
| `npm run build`                                                | `tsc -b` across every package/service                                       |
| `npm test`                                                     | 40 automated tests (30 unit + 10 API integration against real Postgres/Redis) |
| `npm run lint` / `npm run format`                            | ESLint / Prettier                                                             |
| `npm run prisma:migrate` / `prisma:seed` / `prisma:studio` | database tooling                                                              |
| `npm run dev:api` / `npm run dev:worker`                     | hot-reload dev servers                                                        |
| `docker compose up --build`                                    | full stack (Postgres + Redis + API + worker) in containers                    |

Full setup detail: `docs/development.md`. Deployment (Docker/K8s/Helm/
Terraform/on-prem): `docs/deployment.md` and `docs/on-prem.md`.

## Status at a glance

- ✅ Backend (API + worker + Postgres + Redis + Docker + K8s + Helm +
  Terraform + CI): built, tested, running.
- ✅ Demo mode: fully functional with zero external credentials.
- ✅ Real providers verified live: Google Places + Google Reviews (real
  place data, real review text) and a local open-source AI model via
  Ollama (`llama3.2:3b`, no API key) - see `docs/provider-architecture.md`
  and `docs/ai-architecture.md`.
- ✅ Flutter client: `flutter analyze` clean (0 issues) and `flutter build
  web` succeeds. `flutter test`/`flutter build windows` are currently
  blocked by an apostrophe in this repo's folder name (`Repo's`), a
  Windows-native-toolchain path bug unrelated to the app - see
  `apps/mobile/README.md`.
- ⚠️ Admin web UI: not built - the protected REST API it would call is
  complete (see `apps/admin/README.md`).

See `docs/product-requirements.md` for the complete implemented /
partial / deferred breakdown, and the bottom of this README's companion
build report for `REQUIRED EXTERNAL CREDENTIALS`, `KNOWN LIMITATIONS`, and
`NEXT DEVELOPMENT PRIORITIES`.

## License

See `LICENSE`.
