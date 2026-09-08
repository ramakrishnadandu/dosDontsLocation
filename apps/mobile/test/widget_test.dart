import 'package:flutter_test/flutter_test.dart';

import 'package:locaguide/main.dart';

void main() {
  testWidgets('LocaGuideApp boots and shows the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const LocaGuideApp());
    await tester.pump();

    expect(find.text('LocaGuide'), findsOneWidget);
  });
}
