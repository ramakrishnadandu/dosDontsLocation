/// Backend base URL. Never embed provider API keys here - all provider
/// calls (Google/OpenAI/Anthropic/Amazon) happen server-side, see
/// docs/security.md and docs/provider-architecture.md.
class ApiConfig {
  ApiConfig._();

  /// Overridable via `--dart-define=API_BASE_URL=https://...` at build time.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );
}
