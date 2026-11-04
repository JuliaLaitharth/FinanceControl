import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/storage/local_database.dart';

final transacoesRepositoryProvider = Provider<TransacoesRepository>(
  (ref) => TransacoesRepository(ref.watch(apiClientProvider)),
);

class TransacoesRepository {
  TransacoesRepository(this._client);
  final ApiClient _client;

  Future<Map<String, dynamic>> listar({
    int page = 1,
    int limit = 20,
    int? categoriaId,
    String? tipo,
    String? de,
    String? ate,
  }) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (categoriaId != null) params['categoriaId'] = categoriaId;
    if (tipo != null) params['tipo'] = tipo;
    if (de != null) params['de'] = de;
    if (ate != null) params['ate'] = ate;

    final res = await _client.dio.get('/transacoes', queryParameters: params);
    final data = res.data as Map<String, dynamic>;

    // Persiste no cache somente a primeira página sem filtros adicionais
    if (page == 1 && categoriaId == null && tipo == null && de == null && ate == null) {
      await LocalDatabase.salvarTransacoes(data['dados'] as List<dynamic>);
    }
    return data;
  }

  Future<Map<String, dynamic>> listarDoCache({
    int page = 1,
    int limit = 20,
    int? categoriaId,
    String? tipo,
    String? de,
    String? ate,
  }) async {
    final rows = await LocalDatabase.buscarTransacoesCache(
      page: page,
      limit: limit,
      categoriaId: categoriaId,
      tipo: tipo,
      de: de,
      ate: ate,
    );
    // Adapta rows para o mesmo formato da API
    final dados = rows.map((r) => <String, dynamic>{
      'id': r['id'],
      'idExternoPluggy': r['id'],
      'contaId': r['conta_id'],
      'descricao': r['descricao'],
      'valor': r['valor'],
      'tipo': r['tipo'],
      'data': r['data'],
      'categoriaId': r['categoria_id'],
      'categoria': r['categoria_nome'] != null
          ? <String, dynamic>{'nome': r['categoria_nome'], 'icone': null}
          : null,
    }).toList();

    return {
      'dados': dados,
      'total': rows.length,
      'pagina': page,
      'porPagina': limit,
      'totalPaginas': 1,
      'fromCache': true,
    };
  }

  Future<Map<String, dynamic>> sincronizar() async {
    final res = await _client.dio.post('/transacoes/sincronizar');
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> listarCategorias() async {
    final res = await _client.dio.get('/categorias');
    return res.data as List<dynamic>;
  }
}
