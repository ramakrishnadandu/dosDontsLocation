import '../../core/network/api_client.dart';

class CommunityRepository {
  final ApiClient _client;

  CommunityRepository(this._client);

  Future<Map<String, dynamic>> submitOpinion({
    required String entityId,
    required int rating,
    String? title,
    String? body,
    List<String>? pros,
    List<String>? cons,
    List<String>? tips,
  }) async {
    final result = await _client.post('/community/opinions', body: {
      'entityId': entityId,
      'rating': rating,
      if (title != null) 'title': title,
      if (body != null) 'body': body,
      if (pros != null) 'pros': pros,
      if (cons != null) 'cons': cons,
      if (tips != null) 'tips': tips,
    });
    return result as Map<String, dynamic>;
  }

  Future<void> vote({required String opinionId, required String voteType, String? reportReason}) async {
    await _client.post('/community/votes', body: {
      'opinionId': opinionId,
      'voteType': voteType,
      if (reportReason != null) 'reportReason': reportReason,
    });
  }

  /// "I was here" (section 5). visitRecency is one of TODAY/THIS_WEEK/EARLIER
  /// - never a precise coordinate, see docs/privacy.md.
  Future<void> checkIn({required String entityId, required String visitRecency}) async {
    await _client.post('/community/check-ins', body: {'entityId': entityId, 'visitRecency': visitRecency});
  }
}
