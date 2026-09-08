import '../../core/network/api_client.dart';

/// Section 11: personalization preferences. Entirely opt-in, user-entered -
/// never inferred from behavior (see docs/privacy.md).
class PreferencesRepository {
  final ApiClient _client;

  PreferencesRepository(this._client);

  Future<Map<String, dynamic>> get() async {
    return await _client.get('/users/me/preferences') as Map<String, dynamic>;
  }

  Future<void> update(Map<String, dynamic> patch) async {
    await _client.put('/users/me/preferences', body: patch);
  }

  Future<void> reset() async {
    await _client.delete('/users/me/preferences');
  }
}
