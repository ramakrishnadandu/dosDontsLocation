/// Mirrors packages/contracts/src/savedLocation.ts#SavedLocation.
class SavedLocation {
  final String id;
  final String? entityId;
  final String label;
  final String? note;
  final String? sourceUrl;
  final double? latitude;
  final double? longitude;
  final String createdAt;

  const SavedLocation({
    required this.id,
    required this.entityId,
    required this.label,
    required this.note,
    required this.sourceUrl,
    required this.latitude,
    required this.longitude,
    required this.createdAt,
  });

  factory SavedLocation.fromJson(Map<String, dynamic> json) {
    return SavedLocation(
      id: json['id'] as String,
      entityId: json['entityId'] as String?,
      label: json['label'] as String,
      note: json['note'] as String?,
      sourceUrl: json['sourceUrl'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      createdAt: json['createdAt'] as String,
    );
  }

  bool get hasCoordinates => latitude != null && longitude != null;
}
