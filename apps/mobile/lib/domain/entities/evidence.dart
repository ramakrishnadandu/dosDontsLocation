/// Mirrors packages/contracts/src/evidence.ts#Evidence. `type` must never be
/// dropped by the UI - it drives the provenance badge (see
/// presentation/widgets/evidence_card.dart) so an AI_INTERPRETATION is never
/// shown the same way as a FACT (product spec section 3/8).
enum EvidenceType { fact, reviewSignal, communityOpinion, aiInterpretation, unknown }

EvidenceType evidenceTypeFromJson(String? raw) {
  switch (raw) {
    case 'FACT':
      return EvidenceType.fact;
    case 'REVIEW_SIGNAL':
      return EvidenceType.reviewSignal;
    case 'COMMUNITY_OPINION':
      return EvidenceType.communityOpinion;
    case 'AI_INTERPRETATION':
      return EvidenceType.aiInterpretation;
    default:
      return EvidenceType.unknown;
  }
}

class Evidence {
  final String id;
  final String category;
  final String recommendation;
  final EvidenceType type;
  final String reason;
  final double confidence;

  const Evidence({
    required this.id,
    required this.category,
    required this.recommendation,
    required this.type,
    required this.reason,
    required this.confidence,
  });

  factory Evidence.fromJson(Map<String, dynamic> json) {
    return Evidence(
      id: json['id'] as String,
      category: json['category'] as String,
      recommendation: json['recommendation'] as String,
      type: evidenceTypeFromJson(json['type'] as String?),
      reason: json['reason'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
    );
  }
}
