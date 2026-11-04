import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>(
  (ref) => DashboardRepository(ref.watch(apiClientProvider)),
);

class DashboardRepository {
  DashboardRepository(this._client);
  final ApiClient _client;

  Future<List<Map<String, dynamic>>> resumoCategorias() async {
    final res = await _client.dio.get('/transacoes/resumo-categorias');
    final data = res.data as Map<String, dynamic>;
    return List<Map<String, dynamic>>.from(data['categorias'] as List);
  }

  Future<List<Map<String, dynamic>>> resumoMensal({int meses = 6}) async {
    final res = await _client.dio.get(
      '/transacoes/resumo-mensal',
      queryParameters: {'meses': meses},
    );
    final data = res.data as Map<String, dynamic>;
    return List<Map<String, dynamic>>.from(data['meses'] as List);
  }
}
