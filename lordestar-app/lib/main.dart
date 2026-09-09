import 'package:flutter/material.dart';

import 'src/api.dart';
import 'src/share_bridge.dart';
import 'src/store.dart';
import 'src/theme.dart';
import 'src/pages/shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ShareBridge.init();
  final store = await AppStore.load();
  runApp(LordestarApp(store: store));
}

class LordestarApp extends StatelessWidget {
  const LordestarApp({super.key, required this.store});

  final AppStore store;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lordestar',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: HomeShell(store: store, api: ApiClient(store)),
    );
  }
}
