import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../providers/notificacoes_provider.dart';

class NotificacoesScreen extends ConsumerStatefulWidget {
  const NotificacoesScreen({super.key});

  @override
  ConsumerState<NotificacoesScreen> createState() => _NotificacoesScreenState();
}

class _NotificacoesScreenState extends ConsumerState<NotificacoesScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
        () => ref.read(notificacoesProvider.notifier).carregar());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificacoesProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificações'),
        actions: [
          if (state.naoLidas > 0)
            TextButton(
              onPressed: () =>
                  ref.read(notificacoesProvider.notifier).marcarTodasComoLidas(),
              child: const Text('Marcar todas como lidas'),
            ),
        ],
      ),
      body: Builder(
        builder: (_) {
          if (state.isLoading && state.notificacoes.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.notificacoes.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_none_outlined,
                      size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Nenhuma notificação',
                      style: TextStyle(fontSize: 16)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () =>
                ref.read(notificacoesProvider.notifier).carregar(),
            child: ListView.separated(
              itemCount: state.notificacoes.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (ctx, i) {
                final n = state.notificacoes[i] as Map<String, dynamic>;
                final lida = n['lida'] as bool? ?? false;
                final mensagem = n['mensagem'] as String? ?? '';
                final canal = (n['regra'] as Map?)?['tipoEvento'] as String? ?? '';

                DateTime? data;
                try {
                  data = DateTime.parse(n['dataEnvio'] as String? ?? '');
                } catch (_) {}

                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: lida
                        ? cs.surfaceContainerHighest
                        : cs.primaryContainer,
                    child: Icon(
                      lida
                          ? Icons.notifications_none
                          : Icons.notifications_active,
                      color: lida ? cs.onSurfaceVariant : cs.primary,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    mensagem,
                    style: TextStyle(
                      fontWeight:
                          lida ? FontWeight.normal : FontWeight.bold,
                    ),
                  ),
                  subtitle: Text(
                    '$canal${data != null ? '  •  ${DateFormat('dd/MM/yy HH:mm', 'pt_BR').format(data.toLocal())}' : ''}',
                    style: TextStyle(
                        fontSize: 12, color: cs.onSurfaceVariant),
                  ),
                  onTap: lida
                      ? null
                      : () => ref
                          .read(notificacoesProvider.notifier)
                          .marcarComoLida(n['id'] as int),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
