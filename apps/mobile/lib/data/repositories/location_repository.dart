import '../../core/network/api_client.dart';
import '../../domain/entities/evidence.dart';
import '../../domain/entities/location_entity.dart';
import '../../domain/entities/community_opinion.dart';

/// Repository pattern (section 27): screens never call ApiClient directly.
class LocationRepository {
  final ApiClient _client;

  LocationRepository(this._client);

  Future<List<LocationEntity>> searchNearby({required double lat, required double lng, double radiusMeters = 3000}) async {
    final json = await _client.get('/locations/nearby', query: {'lat': lat, 'lng': lng, 'radiusMeters': radiusMeters});
    return ((json['items'] as List<dynamic>?) ?? const [])
        .map((e) => LocationEntity.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<LocationEntity>> search(String query) async {
    final json = await _client.get('/locations/search', query: {'q': query});
    return ((json['items'] as List<dynamic>?) ?? const [])
        .map((e) => LocationEntity.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<LocationEntity> getById(String id) async {
    final json = await _client.get('/locations/$id');
    return LocationEntity.fromJson(json as Map<String, dynamic>);
  }

  Future<List<Evidence>> getIntelligence(String entityId) async {
    final json = await _client.get('/locations/$entityId/intelligence');
    return ((json['evidence'] as List<dynamic>?) ?? const [])
        .map((e) => Evidence.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<CommunityOpinion>> getCommunityOpinions(String entityId) async {
    final json = await _client.get('/locations/$entityId/community');
    return ((json['items'] as List<dynamic>?) ?? const [])
        .map((e) => CommunityOpinion.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
