# Provider Architecture

See section 9/40 of the product spec. Every external data source is
accessed through an interface in `packages/providers/src/*`, never called
directly from route handlers or the recommendation engine.

| Interface | Mock (always available) | Real adapter | Status |
|---|---|---|---|
| `LocationProvider` | `MockLocationProvider` (5 realistic demo entities) | `GooglePlacesProvider` | **Verified against a live key** (see `docs/google-api-setup.md`) - confirmed returning real data (name, address, rating, review count, category, accessibility) for a real place |
| `ReviewProvider` | `MockReviewProvider` (26 demo reviews) + `CommunityReviewProvider` (reads LocaGuide's own approved opinions) | `GoogleReviewProvider` | **Verified against a live key** - enabled by default policy and wired into the registry (was present in policy but not actually registered until this fix - see `packages/runtime/src/registry.ts`). Google's API caps this at 5 reviews/place per its ToS - documented as a hard limitation in the file, not worked around |
| `ProductProvider` / `DealProvider` | `MockProductProvider` / `MockDealProvider` | `AmazonProductProvider` | Interface + policy wiring only; PA-API 5.0 request signing not implemented (needs `AMAZON_API_KEY`/`AMAZON_API_SECRET` + an Associates account to test against) |
| `AIProvider` | `MockAIProvider` | `OllamaProvider` (**verified**, local/open-source, default), `OpenAIProvider`, `AnthropicProvider` (unverified against live keys) | See `docs/ai-architecture.md` |
| `WeatherProvider` | `MockWeatherProvider` | - | Interface only, not wired into the briefing yet |
| `EventProvider` | `MockEventProvider` | - | Interface only, not wired into the briefing yet |

## Selection logic

`packages/runtime/src/registry.ts#buildProviderRegistry()` is the single
composition point. For each interface: use the real adapter **only if**
its credential is present **and** the Policy Engine allow-lists its name
in `config/policies.yaml`; otherwise use the mock. This means an operator
can disable an external provider outright (e.g. an enterprise/on-prem
deployment that must never call Google) by removing it from
`providers.location` in policy config, independent of whether a
credential happens to be set.

**Location lookups specifically go through `RoutingLocationProvider`**
(`packages/providers/src/location/RoutingLocationProvider.ts`), not a bare
either/or choice between mock and real. Demo entity ids are always
`demo-*` and real Google ids are always `google:*`, so `getById` routes
by that prefix - meaning enabling a real credential augments demo mode
instead of replacing it. This matters because other data (community
opinions, saved locations, evidence, audit trails) can already reference
a `demo-*` id; without this router, adding a real credential later would
silently 404 every existing reference to a demo entity. Search
(`searchNearby`/`searchByText`) prefers the real provider's results when
they're non-empty, falling back to mock on an empty result or a thrown
error - so a real key genuinely takes over search once configured
(exactly as intended), while demo entities remain independently
resolvable by id, and are also still what search falls back to if the
real API returns nothing for a given query/area.

## Compliance rules encoded here (section 40)

- No provider is ever scraped - only official HTTPS APIs
  (`GooglePlacesProvider`/`GoogleReviewProvider` call
  `places.googleapis.com`; nothing calls `google.com` HTML endpoints).
- Attribution is carried on every `LocationEntity`
  (`attribution: "Place information provided by Google"` /
  `"Demo data - LocaGuide Mock Location Provider"`) so the client can
  render required attribution text.
- `AmazonProductProvider` is left unimplemented rather than scraped -
  Amazon's terms require the official, signed PA-API request format,
  which needs a live Associates account to build and test correctly.

## Adding a new provider

1. Add the interface method(s) to the relevant file in
   `packages/providers/src/<domain>/` if the existing interface doesn't
   already cover it.
2. Implement a class satisfying the interface (constructor takes only the
   credential(s) it needs; `isConfigured` reflects their presence).
3. Register it in `packages/runtime/src/registry.ts` behind the same
   credential-present-and-policy-allowed check.
4. Add its name to the relevant `providers.*` allow-list in
   `config/policies.yaml` (both `services/api/config/` and
   `services/worker/config/` copies).
