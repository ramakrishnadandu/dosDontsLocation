class CommunityOpinion {
  final String id;
  final int rating;
  final String? title;
  final String? body;
  final List<String> tips;
  final int helpfulCount;
  final String createdAt;

  const CommunityOpinion({
    required this.id,
    required this.rating,
    required this.title,
    required this.body,
    required this.tips,
    required this.helpfulCount,
    required this.createdAt,
  });

  factory CommunityOpinion.fromJson(Map<String, dynamic> json) {
    return CommunityOpinion(
      id: json['id'] as String,
      rating: (json['rating'] as num).toInt(),
      title: json['title'] as String?,
      body: json['body'] as String?,
      tips: (json['tips'] as List<dynamic>? ?? const []).map((e) => e.toString()).toList(),
      helpfulCount: (json['helpfulCount'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}
