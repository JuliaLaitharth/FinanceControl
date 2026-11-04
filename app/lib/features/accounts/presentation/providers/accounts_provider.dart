import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/accounts_repository.dart';

// ─── Estado ──────────────────────────────────────────────────────────────────

class AccountsState {
  const AccountsState({
    this.consentimentos = const [],
    this.isLoading = false,
    this.errorMessage,
  });

  final List<dynamic> consentimentos;
  final bool isLoading;
  final String? errorMessage;

  AccountsState copyWith({
    List<dynamic>? consentimentos,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) =>
      AccountsState(
        consentimentos: consentimentos ?? this.consentimentos,
        isLoading: isLoading ?? this.isLoading,
        errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      );
}

// ─── Notifier ────────────────────────────────────────────────────────────────

class AccountsNotifier extends StateNotifier<AccountsState> {
  AccountsNotifier(this._repo) : super(const AccountsState());

  final AccountsRepository _repo;

  Future<void> carregar() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final lista = await _repo.listarConsentimentos();
      state = state.copyWith(consentimentos: lista, isLoading: false);
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
    }
  }

  Future<String?> gerarConnectToken() async {
    try {
      return await _repo.gerarConnectToken();
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e));
      return null;
    }
  }

  Future<bool> registrarConsentimento(String itemId) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repo.registrarConsentimento(itemId);
      await carregar();
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      return false;
    }
  }

  Future<bool> revogar(int id) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repo.revogarConsentimento(id);
      await carregar();
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      return false;
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
    return 'Ocorreu um erro. Tente novamente.';
  }
}

final accountsProvider =
    StateNotifierProvider<AccountsNotifier, AccountsState>(
  (ref) => AccountsNotifier(ref.watch(accountsRepositoryProvider)),
);

// ─── Provider de saldo consolidado ───────────────────────────────────────────

final saldoProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(accountsRepositoryProvider);
  return repo.saldoConsolidado();
});
