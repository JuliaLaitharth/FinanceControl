import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../accounts/presentation/screens/accounts_screen.dart';
import '../../../home/presentation/screens/home_screen.dart';
import '../../../notifications/presentation/providers/notificacoes_provider.dart';
import '../../../notifications/presentation/screens/notificacoes_screen.dart';
import '../../../transactions/presentation/screens/transacoes_screen.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _index = 0;

  static const _screens = [
    HomeScreen(),
    TransacoesScreen(),
    AccountsScreen(),
    NotificacoesScreen(),
  ];

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(notificacoesProvider.notifier).carregarContagem(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final naoLidas = ref.watch(
      notificacoesProvider.select((s) => s.naoLidas),
    );

    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Início',
          ),
          const NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Transações',
          ),
          const NavigationDestination(
            icon: Icon(Icons.account_balance_outlined),
            selectedIcon: Icon(Icons.account_balance),
            label: 'Contas',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: naoLidas > 0,
              label: Text(naoLidas > 9 ? '9+' : '$naoLidas'),
              child: const Icon(Icons.notifications_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: naoLidas > 0,
              label: Text(naoLidas > 9 ? '9+' : '$naoLidas'),
              child: const Icon(Icons.notifications),
            ),
            label: 'Alertas',
          ),
        ],
      ),
    );
  }
}
