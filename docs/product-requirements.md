# LocaGuide Product Requirements (summary)

Full prose requirements are the master build prompt this repository was
built from; this document tracks what is implemented, partially
implemented, or intentionally deferred, so a new engineer can see the gap
between spec and code at a glance.

## Implemented (real, tested code)

- Location search (nearby + text) via a provider-agnostic `LocationProvider`. `RoutingLocationProvider` composes mock demo data with a real provider when configured - demo entities (`demo-*` ids) stay resolvable even after a real credential is added, real search takes priority when it returns results, and falls back to mock otherwise (see `docs/provider-architecture.md#selection-logic`).
- **`GooglePlacesProvider` and `GoogleReviewProvider`: implemented AND verified against a live key** in this environment - confirmed returning real place data (name, address, rating, review count, category, accessibility) and real review text (Google's API caps this at 5 reviews/place per its ToS, not worked around).
- Location details + evidence-based "intelligence" briefing (DO/CONSIDER/WATCH/MUST_SEE/**PRODUCTS**/SPENDING/HEALTH_AWARE/GENERAL_TIPS) - all 7 categories from section 43 now generate real evidence and render in the UI (PRODUCTS was previously missing end-to-end: no generator, no data linking products to locations, no UI section - see `ProductProvider#getProductsForEntity`), including a temporal-window fallback (recent → quarter → year → all-time) for providers with a small, non-recent review sample, with evidence text honestly labeled by which window actually produced it (never implies old data is current).
- Review-intelligence pipeline: language detect → normalize → spam/duplicate detect → sentiment (lexicon-based, tuned against real-world review phrasing) → aspect extraction → time-windowed aggregate signals.
- Community opinions: submit, list (approved only), "I was here" check-in (no precise location stored), **and real helpful/not-helpful/report voting on individual opinions** - the UI previously showed a static count with no way to actually vote, and the "Report" screen showed a fake success message without calling the API at all; both now call the real, already-existing backend endpoint.
- **Saved/interested locations (section 48)**: favorite a known entity, or add a place by pasting a Google Maps link - short links (`maps.app.goo.gl`) resolved via redirect, then parsed for name/coordinates without ever calling Google's page-scraping-adjacent surfaces (`packages/domain/src/googleMaps/parseGoogleMapsUrl.ts`); share a location via the OS share sheet.
- Moderation: heuristic spam/PII/malicious-link/duplicate detection, policy-driven auto-hide/queue-for-review, admin moderation-case resolution endpoint, audit logging.
- **AI provider abstraction with Ollama (local/open-source, verified against a live `llama3.2:3b` instance, default provider)**, OpenAI/Anthropic (unverified, no key available), and Mock - automatic fallback chain (`ollama → openai → mock`), centralized prompt templates that forbid fact invention regardless of which model answers.
- Product search/details + a deal engine that only ever returns currently-valid deals.
- Auth (register/login/refresh with JWT + bcrypt), RBAC (`SUPER_ADMIN/ADMIN/MODERATOR/ANALYST/SUPPORT/USER`), admin endpoints for users/moderation/reports/audit-logs/feature-flags.
- Preferences (budget/family/interests/accessibility/language), with delete/reset and full data export endpoints (export now also includes saved locations).
- PostgreSQL schema with migrations (`packages/db/prisma`), Redis for caching/rate-limiting/queues.
- Docker (multi-stage, non-root, healthchecked), Docker Compose (dev + full stack), Kubernetes manifests, a Helm chart, Terraform scaffolding for AWS/Azure/GCP/on-prem.
- CI (lint, typecheck, unit+integration tests against real Postgres/Redis, Docker builds, CodeQL, Trivy container scan).
- 65 automated tests (unit tests over the review/recommendation/moderation/policy/routing-provider/Google-Maps-URL-parsing engines, integration tests over the live API+DB+Redis).
- Flutter web client: redesigned UI (category filters, evidence-provenance cards, hero location header), verified via `flutter analyze` (0 issues) and `flutter build web` against the real backend end-to-end.

## Partially implemented (interface exists, real integration pending)

- `AmazonProductProvider`: interface + policy wiring only; PA-API 5.0 request signing is not implemented (see the file's doc comment for what's needed).
- **Retail offers/pricing for real (non-demo) locations**: no data source exists for this today - Google Places API doesn't return merchant pricing/promotions, and LocaGuide deliberately never fabricates prices or scrapes a merchant's site without authorization. The `SPENDING` section stays empty for real places unless a `Deal` is explicitly linked via a legitimate provider (e.g. a future authorized retailer API).
- Async jobs: `review_analysis` and `recommendation_generation` are real; `review_ingestion`, `product_sync`, `location_sync`, `ai_summary`, `moderation`, `image_processing`, `analytics`, `notifications` are registered queues with a logging placeholder processor.
- Admin console: implemented as protected REST endpoints only (`/api/v1/admin/*`); no dedicated admin web UI (see `apps/admin/README.md`).
- Media upload (section 46): data model exists (`Media` table, `mediaIds` on opinions); no upload endpoint/object-storage integration yet.
- Notifications (section 47), Travel/Tour mode (section 49), Location Agent (section 50), multi-tenancy enforcement (section 51): data model hooks exist (`tenantId` columns, feature flags `travel_mode`/`location_agent`/`multi_tenant`) but no business logic yet.

## Explicitly out of scope for this pass

- A separate admin web frontend (React/Vue/etc) - the API is ready for one.
- Real push notification delivery, object storage, malware scanning for uploads.
- Verified Flutter build/test execution - no Flutter SDK was available in
  this environment (see `apps/mobile/README.md`); the code was written to
  compile against stable Flutter APIs but has not been run.

## Non-negotiable product rules enforced in code

- AI never presents a synthesis as a verified fact - enforced by the
  `Evidence.type` field and the system prompt in
  `packages/domain/src/recommendationEngine/prompts.ts`.
- Expired deals are never shown as active -
  `packages/contracts/src/product.ts#isDealActive` is the single place
  "active" is decided, used both when generating SPENDING evidence and in
  `GET /products/:id/deals`.
- Negative reviews are never auto-removed for being negative -
  `packages/domain/src/moderation/moderationEngine.ts#decideModerationAction`
  only reacts to spam score, malicious links, PII, and report count.
- Precise GPS history is never retained - "I was here" persists only a
  `VisitRecency` bucket (`TODAY`/`THIS_WEEK`/`EARLIER`), never coordinates
  (`packages/contracts/src/community.ts#CheckInInput`).
