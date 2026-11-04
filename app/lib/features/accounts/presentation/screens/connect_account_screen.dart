import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../providers/accounts_provider.dart';

/// Abre o Pluggy Connect Widget em um WebView.
/// Intercepta a URL de callback `financecontrol://connect?itemId=XXX`
/// retornada pelo widget e envia o itemId ao backend.
class ConnectAccountScreen extends ConsumerStatefulWidget {
  const ConnectAccountScreen({super.key});

  @override
  ConsumerState<ConnectAccountScreen> createState() =>
      _ConnectAccountScreenState();
}

class _ConnectAccountScreenState extends ConsumerState<ConnectAccountScreen> {
  static const _callbackScheme = 'financecontrol';
  static const _pluggyWidgetBase = 'https://connect.pluggy.ai';

  WebViewController? _controller;
  bool _loading = true;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _iniciar();
  }

  Future<void> _iniciar() async {
    final token = await ref.read(accountsProvider.notifier).gerarConnectToken();
    if (token == null) {
      if (mounted) {
        setState(() {
          _errorMsg = 'Não foi possível iniciar a conexão bancária.';
          _loading = false;
        });
      }
      return;
    }

    final url =
        '$_pluggyWidgetBase/?connectToken=$token'
        '&connectorTypes=PERSONAL_BANK,BUSINESS_BANK,INVESTMENT'
        '&onSuccess=$_callbackScheme://connect'
        '&onError=$_callbackScheme://error';

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: _interceptarNavegacao,
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: (_) => setState(() => _loading = false),
          onWebResourceError: (err) => setState(() {
            _loading = false;
            _errorMsg = 'Erro ao carregar o widget de conexão.';
          }),
        ),
      )
      ..loadRequest(Uri.parse(url));

    if (mounted) setState(() => _controller = controller);
  }

  NavigationDecision _interceptarNavegacao(NavigationRequest req) {
    final uri = Uri.tryParse(req.url);
    if (uri == null) return NavigationDecision.navigate;

    if (uri.scheme == _callbackScheme) {
      if (uri.host == 'connect') {
        final itemId = uri.queryParameters['itemId'];
        if (itemId != null && itemId.isNotEmpty) {
          _registrar(itemId);
        } else {
          Navigator.pop(context, false);
        }
      } else {
        // Usuário cancelou ou ocorreu erro no widget
        Navigator.pop(context, false);
      }
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  }

  Future<void> _registrar(String itemId) async {
    if (!mounted) return;
    setState(() => _loading = true);

    final sucesso = await ref
        .read(accountsProvider.notifier)
        .registrarConsentimento(itemId);

    if (!mounted) return;
    if (sucesso) {
      Navigator.pop(context, true);
    } else {
      final erro = ref.read(accountsProvider).errorMessage ??
          'Não foi possível conectar a conta.';
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(erro)));
      Navigator.pop(context, false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Conectar conta bancária'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context, false),
        ),
      ),
      body: Stack(
        children: [
          if (_errorMsg != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(_errorMsg!, textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: () {
                        setState(() {
                          _errorMsg = null;
                          _loading = true;
                        });
                        _iniciar();
                      },
                      child: const Text('Tentar novamente'),
                    ),
                  ],
                ),
              ),
            )
          else if (_controller != null)
            WebViewWidget(controller: _controller!)
          else
            const Center(child: CircularProgressIndicator()),
          if (_loading && _controller != null)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
