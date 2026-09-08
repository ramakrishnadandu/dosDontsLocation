import 'package:flutter/foundation.dart';
import '../data/repositories/location_repository.dart';
import '../domain/entities/community_opinion.dart';
import '../domain/entities/evidence.dart';
import '../domain/entities/location_entity.dart';

enum LoadStatus { idle, loading, success, error }

/// Simple ChangeNotifier-based state management (section 27). No code
/// generation required, which keeps this buildable without running
/// `flutter pub run build_runner` in an environment without the Flutter SDK.
class LocationController extends ChangeNotifier {
  final LocationRepository _repository;

  LocationController(this._repository);

  LoadStatus nearbyStatus = LoadStatus.idle;
  List<LocationEntity> nearby = [];
  String? errorMessage;

  LocationEntity? selectedEntity;
  List<Evidence> evidence = [];
  List<CommunityOpinion> opinions = [];
  LoadStatus detailsStatus = LoadStatus.idle;

  Future<void> loadNearby({required double lat, required double lng, double radiusMeters = 5000}) async {
    nearbyStatus = LoadStatus.loading;
    notifyListeners();
    try {
      nearby = await _repository.searchNearby(lat: lat, lng: lng, radiusMeters: radiusMeters);
      nearbyStatus = LoadStatus.success;
    } catch (e) {
      errorMessage = e.toString();
      nearbyStatus = LoadStatus.error;
    }
    notifyListeners();
  }

  Future<List<LocationEntity>> search(String query) => _repository.search(query);

  Future<void> loadDetails(String entityId) async {
    detailsStatus = LoadStatus.loading;
    notifyListeners();
    try {
      final results = await Future.wait([
        _repository.getById(entityId),
        _repository.getIntelligence(entityId),
        _repository.getCommunityOpinions(entityId),
      ]);
      selectedEntity = results[0] as LocationEntity;
      evidence = results[1] as List<Evidence>;
      opinions = results[2] as List<CommunityOpinion>;
      detailsStatus = LoadStatus.success;
    } catch (e) {
      errorMessage = e.toString();
      detailsStatus = LoadStatus.error;
    }
    notifyListeners();
  }

  List<Evidence> byCategory(String category) =>
      evidence.where((e) => e.category == category).toList(growable: false);
}
