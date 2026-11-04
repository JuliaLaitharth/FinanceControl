import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../providers/dashboard_provider.dart';

const _coresCategorias = [
  Color(0xFF3F51B5),
  Color(0xFF4CAF50),
  Color(0xFFF44336),
  Color(0xFFFF9800),
  Color(0xFF9C27B0),
  Color(0xFF00BCD4),
  Color(0xFFFF5722),
  Color(0xFF607D8B),
];

const _abrevMeses = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriasAsync = ref.watch(categoriasDashboardProvider);
    final mensalAsync = ref.watch(resumoMensalProvider);
    final brl = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Relatórios'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Atualizar',
            onPressed: () {
              ref.invalidate(categoriasDashboardProvider);
              ref.invalidate(resumoMensalProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(categoriasDashboardProvider);
          ref.invalidate(resumoMensalProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // --- Gráfico de pizza: despesas por categoria ---
            Text('Despesas por Categoria', style: tt.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Mês atual',
              style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            categoriasAsync.when(
              loading: () => const SizedBox(
                height: 240,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (_, __) => const SizedBox(
                height: 240,
                child: Center(child: Text('Sem dados')),
              ),
              data: (cats) => cats.isEmpty
                  ? const SizedBox(
                      height: 240,
                      child: Center(child: Text('Nenhuma despesa no mês')),
                    )
                  : _PieSection(cats: cats, brl: brl),
            ),

            const SizedBox(height: 28),
            const Divider(),
            const SizedBox(height: 16),

            // --- Gráfico de barras: receitas vs despesas ---
            Text('Receitas vs Despesas', style: tt.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Últimos 6 meses',
              style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            mensalAsync.when(
              loading: () => const SizedBox(
                height: 260,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (_, __) => const SizedBox(
                height: 260,
                child: Center(child: Text('Sem dados')),
              ),
              data: (meses) => _BarSection(meses: meses),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _PieSection extends StatefulWidget {
  const _PieSection({required this.cats, required this.brl});
  final List<Map<String, dynamic>> cats;
  final NumberFormat brl;

  @override
  State<_PieSection> createState() => _PieSectionState();
}

class _PieSectionState extends State<_PieSection> {
  int _touched = -1;

  @override
  Widget build(BuildContext context) {
    final top = widget.cats.take(7).toList();
    final totalOutros = widget.cats.length > 7
        ? widget.cats.skip(7).fold<double>(0, (s, c) => s + (c['total'] as num).toDouble())
        : 0.0;
    if (totalOutros > 0) top.add({'nome': 'Outros', 'total': totalOutros});

    final total = top.fold<double>(0, (s, c) => s + (c['total'] as num).toDouble());

    return Column(
      children: [
        SizedBox(
          height: 220,
          child: PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 44,
              pieTouchData: PieTouchData(
                touchCallback: (event, response) {
                  setState(() {
                    if (!event.isInterestedForInteractions ||
                        response?.touchedSection == null) {
                      _touched = -1;
                      return;
                    }
                    _touched = response!.touchedSection!.touchedSectionIndex;
                  });
                },
              ),
              sections: List.generate(top.length, (i) {
                final isTouched = i == _touched;
                final valor = (top[i]['total'] as num).toDouble();
                final pct = total > 0 ? valor / total * 100 : 0.0;
                return PieChartSectionData(
                  color: _coresCategorias[i % _coresCategorias.length],
                  value: valor,
                  title: '${pct.toStringAsFixed(1)}%',
                  radius: isTouched ? 68 : 56,
                  titleStyle: TextStyle(
                    fontSize: isTouched ? 13 : 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    shadows: const [Shadow(color: Colors.black26, blurRadius: 4)],
                  ),
                );
              }),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 6,
          children: List.generate(top.length, (i) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: _coresCategorias[i % _coresCategorias.length],
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '${top[i]['nome']} ${widget.brl.format(top[i]['total'])}',
                  style: const TextStyle(fontSize: 12),
                ),
              ],
            );
          }),
        ),
      ],
    );
  }
}

class _BarSection extends StatelessWidget {
  const _BarSection({required this.meses});
  final List<Map<String, dynamic>> meses;

  @override
  Widget build(BuildContext context) {
    if (meses.isEmpty) {
      return const SizedBox(
        height: 260,
        child: Center(child: Text('Nenhum dado disponível')),
      );
    }

    final maxY = meses.fold<double>(0, (m, e) {
      final r = (e['receitas'] as num).toDouble();
      final d = (e['despesas'] as num).toDouble();
      return [m, r, d].reduce((a, b) => a > b ? a : b);
    });
    final yMax = maxY == 0 ? 1000.0 : maxY * 1.2;

    return SizedBox(
      height: 260,
      child: BarChart(
        BarChartData(
          maxY: yMax,
          barGroups: List.generate(meses.length, (i) {
            final receitas = (meses[i]['receitas'] as num).toDouble();
            final despesas = (meses[i]['despesas'] as num).toDouble();
            return BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: receitas,
                  color: const Color(0xFF4CAF50),
                  width: 10,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                ),
                BarChartRodData(
                  toY: despesas,
                  color: const Color(0xFFF44336),
                  width: 10,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                ),
              ],
            );
          }),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 52,
                getTitlesWidget: (value, meta) {
                  if (value == 0 || value == meta.max) {
                    return const SizedBox.shrink();
                  }
                  final v = value >= 1000
                      ? '${(value / 1000).toStringAsFixed(1)}k'
                      : value.toStringAsFixed(0);
                  return Text(v, style: const TextStyle(fontSize: 10));
                },
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 24,
                getTitlesWidget: (value, _) {
                  final idx = value.toInt();
                  if (idx < 0 || idx >= meses.length) return const SizedBox.shrink();
                  final parts = (meses[idx]['mes'] as String).split('-');
                  final mesIdx = int.tryParse(parts.length > 1 ? parts[1] : '1') ?? 1;
                  return Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      _abrevMeses[(mesIdx - 1).clamp(0, 11)],
                      style: const TextStyle(fontSize: 11),
                    ),
                  );
                },
              ),
            ),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: const FlGridData(show: true, drawVerticalLine: false),
          borderData: FlBorderData(show: false),
        ),
      ),
    );
  }
}
