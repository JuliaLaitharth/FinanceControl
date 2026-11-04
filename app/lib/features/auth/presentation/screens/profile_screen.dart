import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final usuario = auth.usuario ?? {};
    final nome = (usuario['nome'] as String?) ?? '';
    final email = (usuario['email'] as String?) ?? '';
    final biometriaAtiva = (usuario['biometriaAtiva'] as bool?) ?? false;
    final iniciais = nome.isNotEmpty
        ? nome.trim().split(' ').map((p) => p[0]).take(2).join().toUpperCase()
        : '?';
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        children: [
          // Avatar
          Center(
            child: CircleAvatar(
              radius: 40,
              backgroundColor: cs.primaryContainer,
              child: Text(
                iniciais,
                style: tt.headlineMedium?.copyWith(color: cs.onPrimaryContainer),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Center(child: Text(nome, style: tt.titleLarge)),
          Center(
            child: Text(email, style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
          ),

          const SizedBox(height: 28),
          const Divider(),

          // Editar nome
          ListTile(
            leading: const Icon(Icons.edit_outlined),
            title: const Text('Editar nome'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _editarNome(context, ref, nome),
          ),

          // Alterar senha
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Alterar senha'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _alterarSenha(context, ref),
          ),

          // Biometria
          SwitchListTile(
            secondary: const Icon(Icons.fingerprint),
            title: const Text('Biometria / Face ID'),
            value: biometriaAtiva,
            onChanged: (v) => ref.read(authProvider.notifier).toggleBiometria(ativa: v),
          ),

          const Divider(),

          // Logout
          ListTile(
            leading: Icon(Icons.logout, color: cs.error),
            title: Text('Sair', style: TextStyle(color: cs.error)),
            onTap: () => _confirmarLogout(context, ref),
          ),

          // Excluir conta
          ListTile(
            leading: Icon(Icons.delete_forever_outlined, color: cs.error),
            title: Text(
              'Excluir minha conta',
              style: TextStyle(color: cs.error),
            ),
            subtitle: const Text('Ação irreversível (LGPD)'),
            onTap: () => _confirmarExclusao(context, ref),
          ),
        ],
      ),
    );
  }

  Future<void> _editarNome(BuildContext context, WidgetRef ref, String nomeAtual) async {
    final ctrl = TextEditingController(text: nomeAtual);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Editar nome'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(labelText: 'Nome completo'),
          textCapitalization: TextCapitalization.words,
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
    if (ok == true && ctrl.text.trim().isNotEmpty && context.mounted) {
      final sucesso = await ref.read(authProvider.notifier).atualizarNome(ctrl.text.trim());
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(sucesso ? 'Nome atualizado!' : 'Erro ao atualizar nome.')),
        );
      }
    }
  }

  Future<void> _alterarSenha(BuildContext context, WidgetRef ref) async {
    final atualCtrl = TextEditingController();
    final novaCtrl = TextEditingController();
    final confirmarCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Alterar senha'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: atualCtrl,
                decoration: const InputDecoration(labelText: 'Senha atual'),
                obscureText: true,
                validator: (v) => (v == null || v.isEmpty) ? 'Obrigatório' : null,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: novaCtrl,
                decoration: const InputDecoration(labelText: 'Nova senha'),
                obscureText: true,
                validator: (v) => (v == null || v.length < 8) ? 'Mínimo 8 caracteres' : null,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: confirmarCtrl,
                decoration: const InputDecoration(labelText: 'Confirmar nova senha'),
                obscureText: true,
                validator: (v) => v != novaCtrl.text ? 'Senhas não conferem' : null,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () {
              if (formKey.currentState?.validate() == true) Navigator.pop(ctx, true);
            },
            child: const Text('Alterar'),
          ),
        ],
      ),
    );

    if (ok == true && context.mounted) {
      final sucesso = await ref.read(authProvider.notifier).alterarSenha(
            senhaAtual: atualCtrl.text,
            novaSenha: novaCtrl.text,
          );
      if (context.mounted && !sucesso) {
        final err = ref.read(authProvider).errorMessage ?? 'Erro ao alterar senha.';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }
  }

  Future<void> _confirmarLogout(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sair'),
        content: const Text('Deseja encerrar sua sessão?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sair'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  Future<void> _confirmarExclusao(BuildContext context, WidgetRef ref) async {
    final cs = Theme.of(context).colorScheme;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Excluir conta'),
        content: const Text(
          'Esta ação é irreversível. Todos os seus dados serão removidos permanentemente '
          'conforme a LGPD. Deseja continuar?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: cs.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );

    if (ok != true || !context.mounted) return;

    // Segunda confirmação
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmar exclusão'),
        content: const Text('Tem certeza absoluta? Seus dados não poderão ser recuperados.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: cs.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sim, excluir'),
          ),
        ],
      ),
    );

    if (confirmar == true && context.mounted) {
      final sucesso = await ref.read(authProvider.notifier).excluirConta();
      if (!sucesso && context.mounted) {
        final err = ref.read(authProvider).errorMessage ?? 'Erro ao excluir conta.';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }
  }
}
