import '../../core/network/api_client.dart';
import '../../domain/entities/saved_location.dart';

/// Section 48: saved/"interested" locations. Backs both "save this place"
/// (pass entityId) and "add a place I found on Google Maps" (pass
/// sourceUrl - the backend resolves short links and parses coordinates).
class SavedLocationRepository {
  final ApiClient _client;

  SavedLocationRepository(this._client);

  Future<List<SavedLocation>> list() async {
    final json = await _client.get('/users/me/saved-locations');
    return ((json['items'] as List<dynamic>?) ?? const [])
        .map((e) => SavedLocation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<SavedLocation> add({String? entityId, String? label, String? sourceUrl, String? note}) async {
    final json = await _client.post('/users/me/saved-locations', body: {
      if (entityId != null) 'entityId': entityId,
      if (label != null && label.isNotEmpty) 'label': label,
      if (sourceUrl != null && sourceUrl.isNotEmpty) 'sourceUrl': sourceUrl,
      if (note != null && note.isNotEmpty) 'note': note,
    });
    return SavedLocation.fromJson(json as Map<String, dynamic>);
  }

  Future<void> delete(String id) async {
    await _client.delete('/users/me/saved-locations/$id');
  }
}
