import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';

final notificacoesRepositoryProvider = Provider<NotificacoesRepository>(
  (ref) => NotificacoesRepository(ref.watch(apiClientProvider)),
);

class NotificacoesRepository {
  NotificacoesRepository(this._client);
  final ApiClient _client;

  Future<List<dynamic>> listar({bool apenasNaoLidas = false}) async {
    final res = await _client.dio.get(
      '/notificacoes',
      queryParameters: apenasNaoLidas ? {'naoLidas': 'true'} : null,
    );
    return res.data as List<dynamic>;
  }

  Future<int> contarNaoLidas() async {
    final res = await _client.dio.get('/notificacoes/contagem');
    return (res.data['naoLidas'] as int?) ?? 0;
  }

  Future<void> marcarComoLida(int id) async {
    await _client.dio.patch('/notificacoes/$id/ler');
  }

  Future<Map<String, dynamic>> marcarTodasComoLidas() async {
    final res = await _client.dio.patch('/notificacoes/ler-todas');
    return res.data as Map<String, dynamic>;
  }

  Future<void> registrarFcmToken(String token) async {
    await _client.dio.patch('/auth/fcm-token', data: {'token': token});
  }
}
