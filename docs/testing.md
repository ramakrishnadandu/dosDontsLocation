# Testing

## What exists today

- **Unit tests** (30, no DB/network needed) over the pure logic in
  `packages/domain`: review-engine pipeline (spam/duplicate detection,
  sentiment, aspect extraction, time-windowed aggregation), the
  recommendation engine (evidence-type separation, hallucination-control
  fallback, no-fabricated-spending-without-a-deal), the moderation engine
  (never auto-hides for negativity alone), and the policy engine.
- **Integration/API tests** (10) in `services/api/src/app.test.ts`, run
  with `supertest` against the real Express app, a real PostgreSQL
  database, and a real Redis instance (no mocking of the DB layer -
  exactly the "don't mock the database" pattern that catches
  mock/prod divergence). Covers: health/readiness, the standard error
  envelope, demo-mode location search, the full evidence-typed
  intelligence briefing, and the register → submit opinion → list opinion
  flow (plus the negative case: submission without auth is rejected).

Run everything: `npm test` (from the repo root; requires `DATABASE_URL`/
`REDIS_URL` pointing at a reachable Postgres/Redis - `docker compose -f
docker-compose.dev.yml up -d` provides both locally). Run one workspace:
`npx jest packages/domain` or `npx jest services/api`.

## How module resolution works in tests

`jest.config.js` maps every `@locaguide/*` package to its `src/index.ts`
(not `dist/`) via `moduleNameMapper`, and `tsconfig.jest.json` mirrors that
in `compilerOptions.paths` so `ts-jest`'s type-checker agrees. This means
tests always run against current source, never a stale build.

## CI

`.github/workflows/ci.yml` runs, on every push/PR: format check, lint,
`tsc -b` (the whole project-reference graph, catching cross-package type
errors), the full Jest suite against real Postgres+Redis service
containers, then builds both Docker images. `.github/workflows/codeql.yml`
runs CodeQL SAST weekly and on every push/PR.

## Gaps (see docs/product-requirements.md for the full list)

- **Frontend tests**: two widget tests exist
  (`apps/mobile/test/{widget_test,evidence_card_test}.dart`) and
  `flutter analyze` passes with 0 issues, but `flutter test` itself
  currently fails in this repo checkout - not from a code defect, but
  because the parent folder is named `Repo's` (with an apostrophe), which
  breaks Flutter's test-runner codegen on Windows (confirmed: `flutter
  build web` succeeds from the same checkout, `flutter build windows`
  fails with the identical apostrophe complaint). Clone to a path without
  an apostrophe to run `flutter test` for real; add it to CI once that's
  resolved.
- **End-to-end test** (open app → permission → detect location → view
  entity → see intelligence → submit opinion → view community opinion):
  the API-side half of this flow is covered by the integration test
  described above; the true end-to-end version needs the Flutter client
  driving a real device/simulator, which is a natural next step once the
  client is running.
- **Security tests**: authentication/authorization/rate-limiting have
  implicit coverage (the "rejects without auth" test, RBAC middleware
  used throughout `admin.routes.ts`) but there is no dedicated fuzz/
  injection test suite yet - `/code-review` or a dedicated `security-review`
  pass is the recommended next step before a production launch.
- **Load testing**: none yet. The API is stateless by design (see
  `docs/architecture.md`), so standard tools (k6, Artillery) can be
  pointed at a running instance once one is deployed.
