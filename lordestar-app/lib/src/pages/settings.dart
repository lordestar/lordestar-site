import 'package:flutter/material.dart';

import '../api.dart';
import '../store.dart';
import '../theme.dart';

/// 设置 Tab：服务器地址 + APP_TOKEN + 测试连接。
class SettingsTab extends StatefulWidget {
  const SettingsTab({super.key, required this.store, required this.api});

  final AppStore store;
  final ApiClient api;

  @override
  State<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  late final TextEditingController _base;
  late final TextEditingController _token;
  bool _obscure = true;
  bool _testing = false;
  String? _testResult;

  @override
  void initState() {
    super.initState();
    _base = TextEditingController(text: widget.store.baseUrl);
    _token = TextEditingController(text: widget.store.token);
  }

  @override
  void dispose() {
    _base.dispose();
    _token.dispose();
    super.dispose();
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _save() async {
    await widget.store.setBaseUrl(_base.text);
    await widget.store.setToken(_token.text);
    if (!mounted) return;
    _testResult = null;
    _toast('已保存');
  }

  Future<void> _test() async {
    await _save();
    setState(() {
      _testing = true;
      _testResult = null;
    });
    try {
      final items = await widget.api.listDiary();
      if (!mounted) return;
      setState(() {
        _testing = false;
        _testResult = '连接成功 ✓ 共 ${items.length} 条记录（含私有）';
      });
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _testing = false;
        _testResult = '连接失败：$err';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
        children: [
          const Text(
            '设置',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          const Text(
            '自用 App：服务器与访问令牌只需配置一次。',
            style: TextStyle(color: kMuted, fontSize: 13),
          ),
          const SizedBox(height: 20),
          const Text('服务器地址', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          TextField(
            controller: _base,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(hintText: 'https://lordestar.cn'),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              const Text(
                'App 令牌',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.key_outlined, size: 16, color: kMuted),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _token,
            obscureText: _obscure,
            autocorrect: false,
            enableSuggestions: false,
            decoration: InputDecoration(
              hintText: '粘贴 APP_TOKEN',
              suffixIcon: IconButton(
                icon: Icon(
                  _obscure
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            '令牌在你电脑上的 .app-token.txt 文件里；泄露可随时在 Cloudflare 换新。',
            style: TextStyle(color: kMuted, fontSize: 11.5),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: _save,
            icon: const Icon(Icons.save_outlined),
            label: const Text('保存'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _testing ? null : _test,
            icon: _testing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.wifi_tethering),
            label: Text(_testing ? '测试中…' : '测试连接'),
          ),
          if (_testResult != null) ...[
            const SizedBox(height: 12),
            Text(
              _testResult!,
              style: TextStyle(
                fontSize: 13,
                color: _testResult!.startsWith('连接成功')
                    ? kAqua
                    : Theme.of(context).colorScheme.error,
              ),
            ),
          ],
          const SizedBox(height: 26),
          const Divider(),
          const SizedBox(height: 10),
          const Text(
            'Lordestar v1.0 · 自用日记 App',
            style: TextStyle(color: kTextSoft, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          Text(
            '记录会实时同步到 lordestar.cn：\n'
            '· 公开的「听歌」→ 首页「最近在听」与日记页\n'
            '· 「感想 / 照片」→ 日记页\n'
            '网站后台管理（作品 / 文章）仍在 /admin。',
            style: const TextStyle(color: kMuted, fontSize: 12, height: 1.7),
          ),
          const SizedBox(height: 16),
          FilledButton.tonalIcon(
            onPressed: () => showAboutDialog(
              context: context,
              applicationName: 'Lordestar',
              applicationVersion: '1.0.0',
              applicationLegalese: 'lordestar.cn · 仅供本人使用',
              children: const [
                Text(
                  '数据由 Cloudflare Workers + D1 提供。',
                  style: TextStyle(color: kMuted),
                ),
              ],
            ),
            icon: const Icon(Icons.info_outline),
            label: const Text('关于'),
          ),
        ],
      ),
    );
  }
}
