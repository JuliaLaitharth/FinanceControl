import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/transacoes_repository.dart';

// ─── Filtros ─────────────────────────────────────────────────────────────────

class FiltrosTransacao {
  const FiltrosTransacao({
    this.de,
    this.ate,
    this.categoriaId,
    this.tipo,
    this.page = 1,
  });

  final DateTime? de;
  final DateTime? ate;
  final int? categoriaId;
  final String? tipo; // 'DEBIT' | 'CREDIT' | null
  final int page;

  FiltrosTransacao copyWith({
    DateTime? de,
    DateTime? ate,
    int? categoriaId,
    String? tipo,
    int? page,
    bool clearDe = false,
    bool clearAte = false,
    bool clearCategoria = false,
    bool clearTipo = false,
  }) =>
      FiltrosTransacao(
        de: clearDe ? null : (de ?? this.de),
        ate: clearAte ? null : (ate ?? this.ate),
        categoriaId: clearCategoria ? null : (categoriaId ?? this.categoriaId),
        tipo: clearTipo ? null : (tipo ?? this.tipo),
        page: page ?? 1,
      );

  bool get temFiltroAtivo => de != null || ate != null || categoriaId != null || tipo != null;

  String? get deStr => de?.toIso8601String().split('T')[0];
  String? get ateStr => ate?.toIso8601String().split('T')[0];
}

// ─── Estado ──────────────────────────────────────────────────────────────────

class TransacoesState {
  const TransacoesState({
    this.transacoes = const [],
    this.total = 0,
    this.pagina = 1,
    this.totalPaginas = 1,
    this.isLoading = false,
    this.isSincronizando = false,
    this.errorMessage,
    this.filtros = const FiltrosTransacao(),
    this.fromCache = false,
  });

  final List<dynamic> transacoes;
  final int total;
  final int pagina;
  final int totalPaginas;
  final bool isLoading;
  final bool isSincronizando;
  final String? errorMessage;
  final FiltrosTransacao filtros;
  final bool fromCache;

  TransacoesState copyWith({
    List<dynamic>? transacoes,
    int? total,
    int? pagina,
    int? totalPaginas,
    bool? isLoading,
    bool? isSincronizando,
    String? errorMessage,
    bool clearError = false,
    FiltrosTransacao? filtros,
    bool? fromCache,
  }) =>
      TransacoesState(
        transacoes: transacoes ?? this.transacoes,
        total: total ?? this.total,
        pagina: pagina ?? this.pagina,
        totalPaginas: totalPaginas ?? this.totalPaginas,
        isLoading: isLoading ?? this.isLoading,
        isSincronizando: isSincronizando ?? this.isSincronizando,
        errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
        filtros: filtros ?? this.filtros,
        fromCache: fromCache ?? this.fromCache,
      );
}

// ─── Notifier ────────────────────────────────────────────────────────────────

class TransacoesNotifier extends StateNotifier<TransacoesState> {
  TransacoesNotifier(this._repo) : super(const TransacoesState());

  final TransacoesRepository _repo;

  Future<void> carregar({bool forceApi = false}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    final f = state.filtros;

    if (!forceApi) {
      // Tenta cache primeiro para resposta imediata
      try {
        final cached = await _repo.listarDoCache(
          page: f.page,
          categoriaId: f.categoriaId,
          tipo: f.tipo,
          de: f.deStr,
          ate: f.ateStr,
        );
        if ((cached['dados'] as List).isNotEmpty) {
          state = state.copyWith(
            transacoes: cached['dados'] as List,
            total: cached['total'] as int,
            pagina: cached['pagina'] as int,
            totalPaginas: cached['totalPaginas'] as int,
            isLoading: false,
            fromCache: true,
          );
        }
      } catch (_) {}
    }

    try {
      final data = await _repo.listar(
        page: f.page,
        categoriaId: f.categoriaId,
        tipo: f.tipo,
        de: f.deStr,
        ate: f.ateStr,
      );
      state = state.copyWith(
        transacoes: data['dados'] as List,
        total: data['total'] as int,
        pagina: data['pagina'] as int,
        totalPaginas: data['totalPaginas'] as int,
        isLoading: false,
        fromCache: false,
      );
    } catch (e) {
      if (state.transacoes.isEmpty) {
        state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      } else {
        // Cache já exibido; silencia o erro de rede
        state = state.copyWith(isLoading: false);
      }
    }
  }

  Future<void> sincronizar() async {
    state = state.copyWith(isSincronizando: true, clearError: true);
    try {
      await _repo.sincronizar();
      await carregar(forceApi: true);
    } catch (e) {
      state = state.copyWith(
        errorMessage: _parseError(e),
        isSincronizando: false,
      );
    } finally {
      state = state.copyWith(isSincronizando: false);
    }
  }

  Future<void> setFiltros(FiltrosTransacao filtros) async {
    state = state.copyWith(filtros: filtros.copyWith(page: 1));
    await carregar(forceApi: true);
  }

  Future<void> proximaPagina() async {
    if (state.pagina >= state.totalPaginas || state.isLoading) return;
    final f = state.filtros.copyWith(page: state.pagina + 1);
    state = state.copyWith(filtros: f, isLoading: true);
    try {
      final data = await _repo.listar(
        page: f.page,
        categoriaId: f.categoriaId,
        tipo: f.tipo,
        de: f.deStr,
        ate: f.ateStr,
      );
      state = state.copyWith(
        transacoes: [...state.transacoes, ...(data['dados'] as List)],
        pagina: data['pagina'] as int,
        totalPaginas: data['totalPaginas'] as int,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
    }
  }

  String _parseError(Object e) {
    try {
      final dynamic data = (e as dynamic).response?.data; // ignore: avoid_dynamic_calls
      if (data is Map) {
        final msg = data['message'];
        if (msg is String) return msg;
      }
    } catch (_) {}
    return 'Ocorreu um erro ao carregar as transações.';
  }
}

final transacoesProvider =
    StateNotifierProvider<TransacoesNotifier, TransacoesState>(
  (ref) => TransacoesNotifier(ref.watch(transacoesRepositoryProvider)),
);

final categoriasProvider = FutureProvider<List<dynamic>>((ref) async {
  final repo = ref.watch(transacoesRepositoryProvider);
  return repo.listarCategorias();
});
