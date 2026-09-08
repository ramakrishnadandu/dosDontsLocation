# Privacy

## Data classification

`packages/shared/src/dataClassification.ts` defines five levels
(`PUBLIC/INTERNAL/PRIVATE/SENSITIVE/SECRET`). Every model in
`packages/db/prisma/schema.prisma` carries a `/// Data classification: ...`
doc comment stating which level its rows are. As a quick reference:

| Level | Examples |
|---|---|
| PUBLIC | entity name/category/address, aggregated review signals, evidence |
| INTERNAL | feature flags, AI request/response metadata, moderation cases |
| PRIVATE | user profile, preferences, community opinions, check-ins, reports |
| SENSITIVE | none persisted today - precise GPS is deliberately never stored (see below) |
| SECRET | password hashes, refresh token hashes, JWT signing key, provider API keys |

## Location data

- The client only ever sends the coordinates needed for one request
  (`GET /locations/nearby?lat&lng`) - the server does not persist the
  raw request coordinates anywhere.
- "I was here" check-ins (`CheckIn` table) store only a coarse
  `VisitRecency` bucket (`TODAY`/`THIS_WEEK`/`EARLIER`) plus a timestamp
  and entity id - never coordinates. This is enforced by the input
  contract itself (`CheckInInput` in `packages/contracts/src/community.ts`
  has no lat/lng field), not by a runtime filter that could be bypassed.
- `PolicyConfig.data_retention.precise_location_history_days` defaults to
  `0` (`services/api/config/policies.yaml`) - there is no precise location
  history to retain in the first place.

## User controls

- `DELETE /users/me/preferences` - reset all personalization data.
- `DELETE /users/me` - soft-deletes the account (marks `deletedAt`,
  anonymizes email/display name); login is rejected for deleted accounts.
- `GET /users/me/export` - returns the user's profile, preferences,
  community opinions, and check-ins as one JSON document.
- Every one of the above is audit-logged (`DATA_DELETION`/`DATA_EXPORT`).

## Encryption

- In transit: TLS terminated at the ingress (see `docs/security.md`).
- At rest: delegated to the managed database/cache (RDS/Cloud SQL/Azure
  Database for PostgreSQL encryption-at-rest is enabled by default on all
  three; the Terraform AWS module explicitly sets `storage_encrypted =
  true`). Self-managed Postgres/Redis (the on-prem StatefulSet/Deployment
  in `infra/kubernetes/`) should use an encrypted PersistentVolume - this
  is a cluster-level configuration, not something the app controls.

## What is never done

- Reviews/opinions are never sold or shared with third parties for
  purposes outside generating the user's own briefing.
- No individual is ever identified as a criminal or wrongdoer from review
  text - see the WATCH-category phrasing rules in
  `packages/domain/src/recommendationEngine/RecommendationEngine.ts#watchPhrasing`,
  which explicitly frames safety-related signals as "reviewer sentiment,
  not a verified incident report."
- No sensitive personal characteristic is inferred - `Preferences` is
  entirely opt-in, user-entered data (budget level, family travel,
  interests, accessibility needs, language, diet), never inferred from
  behavior.
