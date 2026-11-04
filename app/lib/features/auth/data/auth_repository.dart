import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/storage/local_database.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);

class AuthRepository {
  AuthRepository(this._client);
  final ApiClient _client;

  Future<Map<String, dynamic>> register({
    required String nome,
    required String email,
    required String senha,
  }) async {
    final res = await _client.dio.post('/auth/register', data: {
      'nome': nome,
      'email': email,
      'senha': senha,
    });
    final data = res.data as Map<String, dynamic>;
    await ApiClient.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
    return data;
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String senha,
  }) async {
    final res = await _client.dio.post('/auth/login', data: {
      'email': email,
      'senha': senha,
    });
    final data = res.data as Map<String, dynamic>;
    await ApiClient.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
    return data;
  }

  Future<void> logout() async {
    try {
      await _client.dio.post('/auth/logout');
    } on DioException {
      // Ignora falha de rede no logout; revoga localmente de qualquer forma.
    } finally {
      await ApiClient.clearTokens();
      await LocalDatabase.limpar();
    }
  }

  Future<void> forgotPassword(String email) async {
    await _client.dio.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword({
    required String token,
    required String novaSenha,
  }) async {
    await _client.dio.post('/auth/reset-password', data: {
      'token': token,
      'novaSenha': novaSenha,
    });
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _client.dio.get('/auth/me');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> setBiometria({required bool ativa}) async {
    final res = await _client.dio.patch('/auth/biometria', data: {'ativa': ativa});
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> atualizarPerfil({required String nome}) async {
    final res = await _client.dio.patch('/auth/perfil', data: {'nome': nome});
    return res.data as Map<String, dynamic>;
  }

  Future<void> alterarSenha({
    required String senhaAtual,
    required String novaSenha,
  }) async {
    await _client.dio.patch('/auth/senha', data: {
      'senhaAtual': senhaAtual,
      'novaSenha': novaSenha,
    });
  }

  Future<void> excluirConta() async {
    await _client.dio.delete('/auth/conta');
    await ApiClient.clearTokens();
    await LocalDatabase.limpar();
  }
}
