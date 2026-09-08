import 'package:flutter/material.dart';
import '../../domain/entities/evidence.dart';

/// Renders one Evidence item with a provenance badge. This is the ONE place
/// in the UI that must never blur FACT / REVIEW_SIGNAL / COMMUNITY_OPINION /
/// AI_INTERPRETATION - see docs/architecture.md#evidence-model.
class EvidenceCard extends StatelessWidget {
  final Evidence evidence;

  const EvidenceCard({super.key, required this.evidence});

  ({String label, Color color}) _badge(BuildContext context) {
    switch (evidence.type) {
      case EvidenceType.fact:
        return (label: 'Fact', color: Colors.green.shade700);
      case EvidenceType.reviewSignal:
        return (label: 'Review signal', color: Colors.blue.shade700);
      case EvidenceType.communityOpinion:
        return (label: 'Community opinion', color: Colors.purple.shade700);
      case EvidenceType.aiInterpretation:
        return (label: 'AI interpretation · not verified', color: Colors.orange.shade800);
      case EvidenceType.unknown:
        return (label: 'Unknown', color: Colors.grey);
    }
  }

  @override
  Widget build(BuildContext context) {
    final badge = _badge(context);
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: badge.color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
              child: Text(badge.label, style: TextStyle(color: badge.color, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 8),
            Text(evidence.recommendation, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text(evidence.reason, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }
}
