import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';

/// Section 19: tokens are kept only in local device storage, never logged.
class AuthRepository {
  static const _accessTokenKey = 'locaguide_access_token';
  static const _refreshTokenKey = 'locaguide_refresh_token';

  final ApiClient _client;

  AuthRepository(this._client);

  Future<void> register({required String email, required String password, required String displayName}) async {
    final json = await _client.post('/auth/register', body: {
      'email': email,
      'password': password,
      'displayName': displayName,
    });
    await _persistTokens(json as Map<String, dynamic>);
  }

  Future<void> login({required String email, required String password}) async {
    final json = await _client.post('/auth/login', body: {'email': email, 'password': password});
    await _persistTokens(json as Map<String, dynamic>);
  }

  Future<void> _persistTokens(Map<String, dynamic> json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, json['accessToken'] as String);
    await prefs.setString(_refreshTokenKey, json['refreshToken'] as String);
    _client.setAccessToken(json['accessToken'] as String);
  }

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_accessTokenKey);
    if (token != null) _client.setAccessToken(token);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    _client.setAccessToken(null);
  }

  Future<bool> isSignedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey) != null;
  }
}
