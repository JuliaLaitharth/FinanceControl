import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../providers/transacoes_provider.dart';

class TransacoesScreen extends ConsumerStatefulWidget {
  const TransacoesScreen({super.key});

  @override
  ConsumerState<TransacoesScreen> createState() => _TransacoesScreenState();
}

class _TransacoesScreenState extends ConsumerState<TransacoesScreen> {
  final _scrollController = ScrollController();
  final _brlFormat = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(transacoesProvider.notifier).carregar());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(transacoesProvider.notifier).proximaPagina();
    }
  }

  Future<void> _abrirFiltros() async {
    final state = ref.read(transacoesProvider);
    final categorias = ref.read(categoriasProvider).valueOrNull ?? [];

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _FiltrosSheet(
        filtrosAtuais: state.filtros,
        categorias: categorias,
        onAplicar: (f) {
          ref.read(transacoesProvider.notifier).setFiltros(f);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(transacoesProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transações'),
        actions: [
          if (state.isSincronizando)
            const Padding(
              padding: EdgeInsets.all(14),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.sync),
              tooltip: 'Sincronizar',
              onPressed: () =>
                  ref.read(transacoesProvider.notifier).sincronizar(),
            ),
          Stack(
            alignment: Alignment.topRight,
            children: [
              IconButton(
                icon: const Icon(Icons.filter_list),
                tooltip: 'Filtros',
                onPressed: _abrirFiltros,
              ),
              if (state.filtros.temFiltroAtivo)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: cs.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Builder(
        builder: (ctx) {
          if (state.isLoading && state.transacoes.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.errorMessage != null && state.transacoes.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(state.errorMessage!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: cs.error)),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () =>
                          ref.read(transacoesProvider.notifier).carregar(),
                      child: const Text('Tentar novamente'),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state.transacoes.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.receipt_long_outlined,
                      size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('Nenhuma transação encontrada.',
                      style: TextStyle(fontSize: 16)),
                  if (state.filtros.temFiltroAtivo) ...[
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => ref
                          .read(transacoesProvider.notifier)
                          .setFiltros(const FiltrosTransacao()),
                      child: const Text('Limpar filtros'),
                    ),
                  ],
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () =>
                ref.read(transacoesProvider.notifier).sincronizar(),
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: state.transacoes.length +
                  (state.isLoading ? 1 : 0) +
                  (state.fromCache ? 1 : 0),
              itemBuilder: (ctx, i) {
                if (state.fromCache && i == 0) {
                  return Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Row(
                      children: [
                        Icon(Icons.offline_bolt_outlined,
                            size: 14, color: cs.secondary),
                        const SizedBox(width: 4),
                        Text(
                          'Dados em cache — puxe para atualizar',
                          style: TextStyle(
                              fontSize: 12, color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  );
                }

                final offset = state.fromCache ? 1 : 0;
                if (i - offset >= state.transacoes.length) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                final tx =
                    state.transacoes[i - offset] as Map<String, dynamic>;
                return _TransacaoTile(tx: tx, brlFormat: _brlFormat);
              },
            ),
          );
        },
      ),
    );
  }
}

// ─── Tile de transação ───────────────────────────────────────────────────────

class _TransacaoTile extends StatelessWidget {
  const _TransacaoTile({required this.tx, required this.brlFormat});

  final Map<String, dynamic> tx;
  final NumberFormat brlFormat;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tipo = tx['tipo'] as String? ?? '';
    final isCredito = tipo == 'CREDIT';
    final valor = double.tryParse(tx['valor']?.toString() ?? '0') ?? 0;
    final cat = tx['categoria'] as Map<String, dynamic>?;
    final catNome = cat?['nome'] as String? ?? 'Outros';
    final catIcone = cat?['icone'] as String?;
    final descricao = tx['descricao'] as String? ?? '';

    DateTime? data;
    try {
      data = DateTime.parse(tx['data'] as String? ?? '');
    } catch (_) {}

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: isCredito
            ? Colors.green.withAlpha(26)
            : cs.errorContainer,
        child: Text(
          catIcone ?? (isCredito ? '↑' : '↓'),
          style: const TextStyle(fontSize: 18),
        ),
      ),
      title: Text(
        descricao,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        '$catNome${data != null ? '  •  ${DateFormat('dd/MM/yy', 'pt_BR').format(data)}' : ''}',
        style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
      ),
      trailing: Text(
        '${isCredito ? '+' : '-'} ${brlFormat.format(valor.abs())}',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: isCredito ? Colors.green.shade700 : cs.error,
        ),
      ),
    );
  }
}

// ─── Bottom Sheet de filtros ─────────────────────────────────────────────────

class _FiltrosSheet extends StatefulWidget {
  const _FiltrosSheet({
    required this.filtrosAtuais,
    required this.categorias,
    required this.onAplicar,
  });

  final FiltrosTransacao filtrosAtuais;
  final List<dynamic> categorias;
  final void Function(FiltrosTransacao) onAplicar;

  @override
  State<_FiltrosSheet> createState() => _FiltrosSheetState();
}

class _FiltrosSheetState extends State<_FiltrosSheet> {
  late FiltrosTransacao _filtros;

  @override
  void initState() {
    super.initState();
    _filtros = widget.filtrosAtuais;
  }

  void _selecionarPeriodo(int dias) {
    final ate = DateTime.now();
    final de = ate.subtract(Duration(days: dias));
    setState(() => _filtros = _filtros.copyWith(de: de, ate: ate));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Filtros',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              TextButton(
                onPressed: () {
                  setState(() => _filtros = const FiltrosTransacao());
                },
                child: const Text('Limpar'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Período rápido
          const Text('Período',
              style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('7 dias'),
                selected: false,
                onSelected: (_) => _selecionarPeriodo(7),
              ),
              ChoiceChip(
                label: const Text('30 dias'),
                selected: false,
                onSelected: (_) => _selecionarPeriodo(30),
              ),
              ChoiceChip(
                label: const Text('90 dias'),
                selected: false,
                onSelected: (_) => _selecionarPeriodo(90),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Tipo
          const Text('Tipo',
              style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Row(
            children: [
              ChoiceChip(
                label: const Text('Todos'),
                selected: _filtros.tipo == null,
                onSelected: (_) =>
                    setState(() => _filtros = _filtros.copyWith(clearTipo: true)),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('Entrada'),
                selected: _filtros.tipo == 'CREDIT',
                onSelected: (_) =>
                    setState(() => _filtros = _filtros.copyWith(tipo: 'CREDIT')),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('Saída'),
                selected: _filtros.tipo == 'DEBIT',
                onSelected: (_) =>
                    setState(() => _filtros = _filtros.copyWith(tipo: 'DEBIT')),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Categoria
          if (widget.categorias.isNotEmpty) ...[
            const Text('Categoria',
                style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            DropdownButtonFormField<int?>(
              initialValue: _filtros.categoriaId,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('Todas')),
                ...widget.categorias.map((c) {
                  final cat = c as Map<String, dynamic>;
                  return DropdownMenuItem<int?>(
                    value: cat['id'] as int?,
                    child: Text(
                        '${cat['icone'] ?? ''} ${cat['nome']}'),
                  );
                }),
              ],
              onChanged: (v) => setState(
                () => v == null
                    ? _filtros = _filtros.copyWith(clearCategoria: true)
                    : _filtros = _filtros.copyWith(categoriaId: v),
              ),
            ),
            const SizedBox(height: 16),
          ],

          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                widget.onAplicar(_filtros);
                Navigator.pop(context);
              },
              child: const Text('Aplicar filtros'),
            ),
          ),
        ],
      ),
    );
  }
}
