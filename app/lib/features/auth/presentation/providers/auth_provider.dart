import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/auth_repository.dart';

enum AuthStatus { unauthenticated, authenticated }

class AuthState {
  const AuthState({
    this.status = AuthStatus.unauthenticated,
    this.usuario,
    this.errorMessage,
    this.isLoading = false,
  });

  final AuthStatus status;
  final Map<String, dynamic>? usuario;
  final String? errorMessage;
  final bool isLoading;

  AuthState copyWith({
    AuthStatus? status,
    Map<String, dynamic>? usuario,
    String? errorMessage,
    bool clearError = false,
    bool? isLoading,
  }) =>
      AuthState(
        status: status ?? this.status,
        usuario: usuario ?? this.usuario,
        errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
        isLoading: isLoading ?? this.isLoading,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repo) : super(const AuthState());

  final AuthRepository _repo;

  Future<void> register({
    required String nome,
    required String email,
    required String senha,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _repo.register(nome: nome, email: email, senha: senha);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        usuario: data['usuario'] as Map<String, dynamic>?,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        errorMessage: _parseError(e),
        isLoading: false,
      );
    }
  }

  Future<void> login({required String email, required String senha}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _repo.login(email: email, senha: senha);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        usuario: data['usuario'] as Map<String, dynamic>?,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        errorMessage: _parseError(e),
        isLoading: false,
      );
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repo.forgotPassword(email);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
    }
  }

  Future<void> toggleBiometria({required bool ativa}) async {
    try {
      final data = await _repo.setBiometria(ativa: ativa);
      state = state.copyWith(usuario: data);
    } catch (_) {}
  }

  Future<bool> atualizarNome(String nome) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _repo.atualizarPerfil(nome: nome);
      state = state.copyWith(usuario: data, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      return false;
    }
  }

  Future<bool> alterarSenha({
    required String senhaAtual,
    required String novaSenha,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repo.alterarSenha(senhaAtual: senhaAtual, novaSenha: novaSenha);
      state = state.copyWith(isLoading: false);
      await logout();
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      return false;
    }
  }

  Future<bool> excluirConta() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repo.excluirConta();
      state = const AuthState(status: AuthStatus.unauthenticated);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      return false;
    }
  }

  String _parseError(Object e) {
    // Extrai mensagem de erro da API (DioException → response.data.message)
    try {
      final dynamic data = (e as dynamic).response?.data; // ignore: avoid_dynamic_calls
      if (data is Map) {
        final msg = data['message'];
        if (msg is String) return msg;
        if (msg is List<dynamic>) return msg.join(', ');
      }
    } catch (_) {}
    return 'Ocorreu um erro. Tente novamente.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref.watch(authRepositoryProvider)),
);
