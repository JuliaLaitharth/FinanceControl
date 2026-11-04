import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:finance_control/main.dart';

void main() {
  testWidgets('App renderiza sem erros', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: FinanceControlApp()));
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
