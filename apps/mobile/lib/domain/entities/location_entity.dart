/// Mirrors packages/contracts/src/entity.ts#LocationEntity - keep these two
/// definitions in sync when the API contract changes.
class LocationEntity {
  final String id;
  final String name;
  final String category;
  final String? address;
  final double latitude;
  final double longitude;
  final double? rating;
  final int? reviewCount;
  final String? website;
  final String? phone;
  final List<String> accessibility;
  final String sourceProvider;
  final String? attribution;
  final bool isDemoData;

  const LocationEntity({
    required this.id,
    required this.name,
    required this.category,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.rating,
    required this.reviewCount,
    required this.website,
    required this.phone,
    required this.accessibility,
    required this.sourceProvider,
    required this.attribution,
    required this.isDemoData,
  });

  factory LocationEntity.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>? ?? const {};
    return LocationEntity(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      address: json['address'] as String?,
      latitude: (location['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (location['longitude'] as num?)?.toDouble() ?? 0,
      rating: (json['rating'] as num?)?.toDouble(),
      reviewCount: json['reviewCount'] as int?,
      website: json['website'] as String?,
      phone: json['phone'] as String?,
      accessibility: (json['accessibility'] as List<dynamic>? ?? const [])
          .map((e) => e.toString())
          .toList(),
      sourceProvider: json['sourceProvider'] as String? ?? 'unknown',
      attribution: json['attribution'] as String?,
      isDemoData: json['isDemoData'] as bool? ?? false,
    );
  }
}
