import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/accounts_provider.dart';
import 'connect_account_screen.dart';

class AccountsScreen extends ConsumerStatefulWidget {
  const AccountsScreen({super.key});

  @override
  ConsumerState<AccountsScreen> createState() => _AccountsScreenState();
}

class _AccountsScreenState extends ConsumerState<AccountsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(accountsProvider.notifier).carregar());
  }

  Future<void> _conectar() async {
    final resultado = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const ConnectAccountScreen()),
    );
    if (resultado == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Conta conectada com sucesso!')),
      );
    }
  }

  Future<void> _confirmarRevogacao(BuildContext ctx, int id, String nome) async {
    final confirmar = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        title: const Text('Desconectar conta'),
        content: Text(
          'Tem certeza que deseja desconectar "$nome"?\n\n'
          'Todos os dados desta conta serão excluídos do aplicativo.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Desconectar'),
          ),
        ],
      ),
    );
    if (confirmar == true && mounted) {
      await ref.read(accountsProvider.notifier).revogar(id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(accountsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Minhas contas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(accountsProvider.notifier).carregar(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _conectar,
        icon: const Icon(Icons.add_link),
        label: const Text('Conectar banco'),
      ),
      body: Builder(
        builder: (ctx) {
          if (state.isLoading && state.consentimentos.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.errorMessage != null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(state.errorMessage!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Theme.of(ctx).colorScheme.error)),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () =>
                          ref.read(accountsProvider.notifier).carregar(),
                      child: const Text('Tentar novamente'),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state.consentimentos.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.account_balance_outlined,
                        size: 72, color: Colors.grey),
                    const SizedBox(height: 16),
                    const Text(
                      'Nenhuma conta conectada',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Conecte seu banco para visualizar saldos e extratos.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: _conectar,
                      icon: const Icon(Icons.add_link),
                      label: const Text('Conectar banco'),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.read(accountsProvider.notifier).carregar(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.consentimentos.length,
              itemBuilder: (ctx, i) {
                final c = state.consentimentos[i] as Map<String, dynamic>;
                final inst = c['instituicao'] as Map<String, dynamic>?;
                final contas = c['contas'] as List<dynamic>? ?? [];
                final nome = inst?['nome'] as String? ?? 'Instituição';
                final logo = inst?['logoUrl'] as String?;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (logo != null)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(logo,
                                    width: 40,
                                    height: 40,
                                    errorBuilder: (_, __, ___) =>
                                        const Icon(Icons.account_balance)),
                              )
                            else
                              const Icon(Icons.account_balance, size: 40),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(nome,
                                  style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold)),
                            ),
                            IconButton(
                              icon: const Icon(Icons.link_off,
                                  color: Colors.red),
                              tooltip: 'Desconectar',
                              onPressed: () => _confirmarRevogacao(
                                  ctx, c['id'] as int, nome),
                            ),
                          ],
                        ),
                        if (contas.isNotEmpty) ...[
                          const Divider(height: 24),
                          ...contas.map((conta) {
                            final cv = conta as Map<String, dynamic>;
                            final saldo = double.tryParse(
                                    cv['saldoAtual']?.toString() ?? '0') ??
                                0;
                            final tipo = cv['tipo'] as String? ?? '';
                            final numero =
                                cv['numeroMascarado'] as String?;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      numero != null
                                          ? '$tipo  •  $numero'
                                          : tipo,
                                      style: const TextStyle(
                                          color: Colors.grey),
                                    ),
                                  ),
                                  Text(
                                    'R\$ ${saldo.toStringAsFixed(2)}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: saldo >= 0
                                          ? Colors.green.shade700
                                          : Colors.red.shade700,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
