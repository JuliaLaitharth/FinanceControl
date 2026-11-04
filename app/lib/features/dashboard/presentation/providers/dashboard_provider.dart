import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/dashboard_repository.dart';

final categoriasDashboardProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(dashboardRepositoryProvider).resumoCategorias();
});

final resumoMensalProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(dashboardRepositoryProvider).resumoMensal();
});
