# Database

PostgreSQL via Prisma. Schema: `packages/db/prisma/schema.prisma`.
Migrations: `packages/db/prisma/migrations/` (created with
`npm run prisma:migrate`, applied in production with
`npm run prisma:migrate:deploy`). **Never** hand-edit the schema in a live
database - always go through a migration.

## Table groups

- **Identity**: `users`, `refresh_tokens`, `preferences`
- **Locations**: `entities` (canonical cache of resolved
  `LocationProvider` results, keyed by the provider-composed id so
  `demo-mall-1` and `google:ChIJ...` coexist cleanly)
- **Reviews**: `reviews` (per-review analysis result, not raw provider
  payloads beyond what's needed to re-derive signals), `review_aspects`
  (aggregated signals, see `docs/architecture.md#evidence-model`)
- **Community**: `community_opinions`, `community_votes`, `check_ins`
  (visit-recency only, see `docs/privacy.md`), `media`
- **Commerce**: `products`, `product_reviews`, `deals`
- **AI/Recommendations**: `recommendations` (a generation run),
  `evidence` (the individual DO/CONSIDER/WATCH/... items),
  `ai_requests`/`ai_responses` (cost/token tracking scaffold)
- **Moderation/Admin**: `reports`, `moderation_cases`, `audit_logs`,
  `feature_flags`, `policies`

Every model carries a `Data classification:` doc comment - see
`docs/privacy.md` for what each level means.

## Why `entities` instead of a `locations` table

The product spec lists both "locations" and "entities" as concepts.
Here they're the same table: a `LocationEntity` (the canonical shape any
`LocationProvider` returns) is cached into `entities` the first time it's
looked up, so `community_opinions`, `reviews`, and `evidence` can have a
real foreign key to it regardless of which upstream provider originally
supplied the data. There is no separate raw "provider payload" table -
the full provider response is kept in the `raw` JSON column for
debugging/replay.

## Indexes

Every foreign-key-heavy query path has a matching index:
`entities(category)`, `entities(tenantId)`,
`reviews(entityId)` + unique `(sourceProvider, sourceReviewId)` (prevents
duplicate ingestion from the same provider),
`review_aspects(entityId, aspect, timeWindow)`,
`community_opinions(entityId, status, moderationStatus)` (the exact filter
`listOpinionsForEntity` uses), `deals(productId, validUntil)`,
`audit_logs(action, timestamp)` and `(actorId)`.

## Multi-tenancy (section 51)

`tenantId` (nullable) exists on `users` and `entities` today as the
foundation for future tenant isolation. **No query currently filters by
tenant** - multi-tenant enforcement is explicitly listed as not-yet-built
in `docs/product-requirements.md`. Do not treat the presence of the column
as tenant isolation; it is schema-only groundwork.

## Seed data

`packages/db/prisma/seed.ts` creates one `SUPER_ADMIN` account
(`admin@locaguide.local`, password from `SEED_ADMIN_PASSWORD` or
`ChangeMe123!`) and the three feature flags referenced in
`docs/product-requirements.md`. Location/review/product demo data is
**not** seeded into the database - it lives in
`packages/providers/src/*/demo*.ts` and is served live by the mock
providers, then cached into `entities` on first access. This mirrors how
a real provider would behave (data arrives via the provider, not a
fixture load).
