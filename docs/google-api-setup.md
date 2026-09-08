# Getting a Google API Key (Places API)

LocaGuide's `GooglePlacesProvider` (`packages/providers/src/location/GooglePlacesProvider.ts`)
and `GoogleReviewProvider` both call the official **Places API (New)** at
`https://places.googleapis.com/v1/*` — never scraping `google.com/maps`
directly. To use them instead of the mock providers, you need one API key
with that API enabled.

## 1. Create (or pick) a Google Cloud project

1. Go to <https://console.cloud.google.com/>.
2. Top-left project dropdown → **New Project** (or select an existing one).
3. Give it a name (e.g. `locaguide-dev`) and create it. Wait a few seconds
   for it to finish provisioning, then make sure it's selected in the
   project dropdown.

## 2. Enable billing

The Places API requires a billing account, even within the free monthly
credit (Google currently gives new accounts a free trial credit, and
Places API (New) has its own free monthly usage tier on top of that).

1. **Billing** in the left sidebar → **Link a billing account**.
2. Follow the prompts to add a payment method if you don't already have a
   billing account on this Google account.

You can set a budget alert (**Billing → Budgets & alerts**) so you're
notified before spending anything meaningful — recommended for a dev key.

## 3. Enable the Places API (New)

1. **APIs & Services → Library** in the left sidebar.
2. Search for **"Places API (New)"** — note: this is a *different* product
   from the older "Places API" in Google's catalog; make sure you enable
   the one literally named "Places API (New)", since that's the version
   LocaGuide's provider calls.
3. Click it, then click **Enable**.

If you also want `GOOGLE_MAPS_API_KEY` for a future interactive map (see
`apps/mobile/lib/presentation/screens/map_screen.dart` — currently a
placeholder), also enable **"Maps SDK for Android"** / **"Maps SDK for
iOS"** / **"Maps JavaScript API"** depending on which platform you're
targeting.

## 4. Create an API key

1. **APIs & Services → Credentials**.
2. **+ Create Credentials → API key**.
3. Google generates a key immediately and shows it once in a dialog —
   copy it now (you can always view/regenerate it later from the
   Credentials page, just not see the original value again if it's a
   different type of secret; API keys can be viewed again for API keys
   specifically, but copying now avoids any confusion).

## 5. Restrict the key (do this before using it anywhere real)

Still on the Credentials page, click the key you just created:

- **Application restrictions**: for a server-side key like this one
  (called from `services/api`, never from the Flutter client — see
  `docs/security.md`), choose **IP addresses** and list the IP(s) your
  API server runs from. In pure local development this is awkward
  (dynamic IP), so it's common to leave this as **None** for a
  throwaway dev key and tighten it before any shared/production
  deployment.
- **API restrictions**: choose **Restrict key**, then select only
  **Places API (New)** (and the Maps SDKs from step 3 if you enabled
  them). This means even if the key leaks, it can't be used for
  unrelated Google Cloud services on your account.

Click **Save**.

## 6. Add it to LocaGuide

Edit your `.env` at the repo root (never commit this file — it's already
git-ignored):

```bash
GOOGLE_PLACES_API_KEY=your-key-here
GOOGLE_MAPS_API_KEY=your-key-here   # only if you enabled a Maps SDK/JS API in step 3
```

Restart the API (`npm run dev:api`, or restart the container). On boot,
`packages/runtime/src/registry.ts#buildProviderRegistry()` checks:

1. Is `GOOGLE_PLACES_API_KEY` set? and
2. Does `config/policies.yaml`'s `providers.location` allow-list include
   `google_places`? (it does by default — see
   `services/api/config/policies.yaml`)

If both are true, `GooglePlacesProvider` replaces `MockLocationProvider`
automatically — no other code change needed. If the key is missing or
policy disallows it, LocaGuide silently falls back to mock data, so
nothing breaks either way.

## Verifying it worked

```bash
curl "http://localhost:4000/api/v1/locations/search?q=DMart+Kushaiguda&lat=17.4829726&lng=78.577203"
```

- **Real data**: the response's `sourceProvider` field will be
  `"google_places"` (not `"mock"`), and `isDemoData` will be `false`.
- If you still see `"sourceProvider": "mock"`, double check: the key is
  in `.env` (not just `.env.example`), the API process was restarted
  after editing `.env`, "Places API (New)" specifically is enabled (not
  just the legacy Places API), and billing is linked on the project.

## Cost awareness

Places API (New) is pay-per-request beyond its free monthly tier — see
<https://mapsplatform.google.com/pricing/> for current rates (they change
occasionally, so check the live page rather than trusting a hardcoded
number here). For a dev/demo key, set a budget alert (step 2) so you find
out about unexpected usage before a bill does.

## What this key does NOT unlock

- **Amazon product data** (`AMAZON_API_KEY`/`AMAZON_API_SECRET`) is a
  completely separate credential from a different provider (Amazon
  Product Advertising API) — see
  `packages/providers/src/products/AmazonProductProvider.ts`, which is
  not yet wired up regardless of any Google key.
- **AI features** (`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`) are separate
  credentials from separate providers — see `docs/ai-architecture.md`.
- A Places API key does **not** by itself give you bulk/unlimited review
  text - Google's API caps editorial reviews at 5 per place and restricts
  how long they may be cached, which is why `GoogleReviewProvider`
  documents that limitation directly in its source file rather than
  working around it.
