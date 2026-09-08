import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// Thrown for any non-2xx response. Carries the server's error envelope
/// ({ error: { code, message, request_id } } - see docs/api.md) so the UI
/// can show a useful message instead of a raw stack trace.
class ApiException implements Exception {
  final int statusCode;
  final String code;
  final String message;
  final String? requestId;

  ApiException(this.statusCode, this.code, this.message, this.requestId);

  @override
  String toString() => 'ApiException($statusCode, $code): $message';
}

/// Thin HTTP client wrapping the LocaGuide REST API. Never stores a
/// provider API key - the backend is the only thing that talks to
/// Google/OpenAI/Anthropic/Amazon (see docs/security.md).
class ApiClient {
  final String baseUrl;
  String? _accessToken;

  ApiClient({this.baseUrl = ApiConfig.baseUrl});

  void setAccessToken(String? token) {
    _accessToken = token;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
      };

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final cleanQuery = <String, String>{
      for (final entry in (query ?? {}).entries)
        if (entry.value != null) entry.key: entry.value.toString(),
    };
    return Uri.parse('$baseUrl$path').replace(queryParameters: cleanQuery.isEmpty ? null : cleanQuery);
  }

  dynamic _decode(http.Response response) {
    final body = response.body.isEmpty ? '{}' : jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    final error = (body is Map<String, dynamic> ? body['error'] : null) as Map<String, dynamic>?;
    throw ApiException(
      response.statusCode,
      error?['code'] as String? ?? 'UNKNOWN_ERROR',
      error?['message'] as String? ?? 'Something went wrong.',
      error?['request_id'] as String?,
    );
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    final response = await http.get(_uri(path, query), headers: _headers);
    return _decode(response);
  }

  Future<dynamic> post(String path, {Object? body}) async {
    final response = await http.post(_uri(path), headers: _headers, body: body == null ? null : jsonEncode(body));
    return _decode(response);
  }

  Future<dynamic> put(String path, {Object? body}) async {
    final response = await http.put(_uri(path), headers: _headers, body: body == null ? null : jsonEncode(body));
    return _decode(response);
  }

  Future<dynamic> delete(String path) async {
    final response = await http.delete(_uri(path), headers: _headers);
    return _decode(response);
  }
}
