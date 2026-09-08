import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:locaguide/domain/entities/evidence.dart';
import 'package:locaguide/presentation/widgets/evidence_card.dart';

/// UNVERIFIED: written without a Flutter SDK available in this environment
/// (see apps/mobile/README.md). Run `flutter test` once the SDK is
/// installed to confirm this passes.
void main() {
  testWidgets('EvidenceCard shows the AI interpretation badge for AI-generated evidence', (tester) async {
    const evidence = Evidence(
      id: 'e1',
      category: 'GENERAL_TIPS',
      recommendation: 'A short synthesized summary.',
      type: EvidenceType.aiInterpretation,
      reason: 'AI-synthesized summary of the evidence above. Not independently verified.',
      confidence: 0.8,
    );

    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: EvidenceCard(evidence: evidence))));

    expect(find.textContaining('AI interpretation'), findsOneWidget);
    expect(find.text('A short synthesized summary.'), findsOneWidget);
  });

  testWidgets('EvidenceCard shows the Fact badge for provider facts', (tester) async {
    const evidence = Evidence(
      id: 'e2',
      category: 'DO',
      recommendation: 'Wheelchair accessible entrance available.',
      type: EvidenceType.fact,
      reason: 'Reported by the location provider.',
      confidence: 1,
    );

    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: EvidenceCard(evidence: evidence))));

    expect(find.text('Fact'), findsOneWidget);
  });
}
