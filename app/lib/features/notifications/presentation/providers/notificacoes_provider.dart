import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/notificacoes_repository.dart';

class NotificacoesState {
  const NotificacoesState({
    this.notificacoes = const [],
    this.naoLidas = 0,
    this.isLoading = false,
    this.errorMessage,
  });

  final List<dynamic> notificacoes;
  final int naoLidas;
  final bool isLoading;
  final String? errorMessage;

  NotificacoesState copyWith({
    List<dynamic>? notificacoes,
    int? naoLidas,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) =>
      NotificacoesState(
        notificacoes: notificacoes ?? this.notificacoes,
        naoLidas: naoLidas ?? this.naoLidas,
        isLoading: isLoading ?? this.isLoading,
        errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      );
}

class NotificacoesNotifier extends StateNotifier<NotificacoesState> {
  NotificacoesNotifier(this._repo) : super(const NotificacoesState());

  final NotificacoesRepository _repo;

  Future<void> carregar() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final lista = await _repo.listar();
      final naoLidas = lista.where((n) => (n as Map)['lida'] == false).length;
      state = state.copyWith(
        notificacoes: lista,
        naoLidas: naoLidas,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        errorMessage: 'Erro ao carregar notificações.',
        isLoading: false,
      );
    }
  }

  Future<void> carregarContagem() async {
    try {
      final n = await _repo.contarNaoLidas();
      state = state.copyWith(naoLidas: n);
    } catch (_) {}
  }

  Future<void> marcarComoLida(int id) async {
    try {
      await _repo.marcarComoLida(id);
      await carregar();
    } catch (_) {}
  }

  Future<void> marcarTodasComoLidas() async {
    try {
      await _repo.marcarTodasComoLidas();
      state = state.copyWith(
        notificacoes: state.notificacoes
            .map((n) => {...(n as Map<String, dynamic>), 'lida': true})
            .toList(),
        naoLidas: 0,
      );
    } catch (_) {}
  }
}

final notificacoesProvider =
    StateNotifierProvider<NotificacoesNotifier, NotificacoesState>(
  (ref) => NotificacoesNotifier(ref.watch(notificacoesRepositoryProvider)),
);
