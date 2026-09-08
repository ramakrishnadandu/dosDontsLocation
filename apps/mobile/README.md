# LocaGuide Mobile (Flutter)

Cross-platform client (Android/iOS/Web) for the LocaGuide API.

## Verification status (updated after installing a real Flutter SDK)

Flutter 3.41.7 (stable) was located at `F:\flutter` and used to actually
verify this app:

- ✅ `flutter pub get` - succeeds (one real fix was needed: this SDK's
  `flutter_localizations` pins `intl` to `0.20.2`, so `pubspec.yaml` was
  updated from `^0.19.0` to `^0.20.2`).
- ✅ `flutter analyze` - **0 issues** (14 minor lint issues found on first
  run - const constructors, a `BuildContext`-across-async-gap, deprecated
  `withOpacity`/`RadioListTile` APIs - all fixed).
- ✅ `flutter build web --debug` - **succeeds**, compiles cleanly.
- ❌ `flutter build windows --debug` - **fails**, but not because of the
  app code: Flutter's own error is `Path ... contains invalid characters
  in "'#!$^&*=|,;<>?". Please rename your directory...`. The repo's parent
  folder is named `Repo's` (with an apostrophe), which breaks Flutter's
  native/CMake-based Windows build tooling.
- ❌ `flutter test` - fails with the same root cause: the test runner
  generates a temporary Dart file that embeds the full file path as an
  unescaped string literal, and the apostrophe breaks that generated code.
- ⚠️ Android build not attempted - no Android SDK is installed on this
  machine (`flutter doctor` confirms), unrelated to the app itself.

**Bottom line**: the app code compiles and analyzes cleanly. The only
failures are Windows-native-toolchain path handling of the apostrophe in
`Repo's`, not a bug in this app - they will disappear if the repo is
cloned to a path without an apostrophe (e.g. `Repos` instead of `Repo's`),
or you can verify with `flutter build web` / `flutter run -d chrome` in
the meantime, which are unaffected.

## What's here

```
lib/
├── core/          API client, config, theme
├── domain/        Entities mirroring packages/contracts (keep in sync manually)
├── data/          Repositories (one per API resource group)
├── application/   ChangeNotifier controllers (auth, location/briefing)
├── presentation/
│   ├── screens/   All 20 screens from the product spec's screen list
│   └── widgets/   EvidenceCard - the one place FACT/REVIEW_SIGNAL/
│                  COMMUNITY_OPINION/AI_INTERPRETATION provenance is rendered
└── l10n/          en/hi/te ARB files (flutter gen-l10n)
test/
├── widget_test.dart          smoke test: app boots to the splash screen
└── evidence_card_test.dart   evidence-provenance badge rendering
android/, web/, windows/      scaffolded via `flutter create .`
```

`ios/` and `macos/`/`linux/` were not scaffolded (no Xcode/relevant
toolchain on this machine) - run `flutter create --platforms ios .` on a
Mac to add iOS support; nothing in `lib/` needs to change for that.

## Running it

```bash
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:4000/api/v1
# or, once on a path without an apostrophe:
flutter run -d windows --dart-define=API_BASE_URL=http://localhost:4000/api/v1
flutter test
```

## Known gaps vs. the full product spec

- **Map screen** (`presentation/screens/map_screen.dart`) is a placeholder
  list view, not an interactive map - see the doc comment in that file for
  why (a real map SDK needs native API keys/config) and what to swap in.
- **Notifications** are UI-only toggles; no push provider is wired up.
- Product comparison is a simple side-by-side table for 2+ selected
  products, not a full recommendation-engine-backed comparison.

## API base URL

Set at build/run time via `--dart-define=API_BASE_URL=...`
(`core/config/api_config.dart`). Defaults to `http://10.0.2.2:4000/api/v1`,
the Android emulator's alias for the host machine's `localhost` - override
for Chrome/Windows desktop (`http://localhost:4000/api/v1`), an iOS
simulator (same), a physical device (your machine's LAN IP), or a
deployed environment.
