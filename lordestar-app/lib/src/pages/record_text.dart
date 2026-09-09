import 'package:flutter/material.dart';

import '../api.dart';
import '../models.dart';
import '../store.dart';
import '../theme.dart';

/// 记感想（文字）页。
class RecordTextPage extends StatefulWidget {
  const RecordTextPage({
    super.key,
    required this.store,
    required this.api,
    this.existing,
  });

  final AppStore store;
  final ApiClient api;
  final DiaryItem? existing;

  @override
  State<RecordTextPage> createState() => _RecordTextPageState();
}

class _RecordTextPageState extends State<RecordTextPage> {
  late final TextEditingController _title;
  late final TextEditingController _body;
  bool _isPublic = true;
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _title = TextEditingController(text: e?.title ?? '');
    _body = TextEditingController(text: e?.note ?? '');
    _isPublic = e?.isPublic ?? true;
  }

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _save() async {
    final content = _body.text.trim();
    if (content.isEmpty) {
      _toast('写点内容再保存吧');
      return;
    }
    final title = _title.text.trim().isEmpty
        ? autoTitle(content)
        : _title.text.trim();
    setState(() => _saving = true);
    try {
      final payload = {
        'kind': 'text',
        'title': title,
        'note': content,
        'images': <String>[],
        'public': _isPublic,
      };
      if (_isEdit) {
        await widget.api.update(widget.existing!.dbId, payload);
      } else {
        await widget.api.create(payload);
      }
      if (!mounted) return;
      _toast('已${_isEdit ? '保存' : '记录'} ✓');
      Navigator.of(context).pop(true);
    } catch (err) {
      if (!mounted) return;
      setState(() => _saving = false);
      _toast('$err');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? '编辑感想' : '写点感想')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            const Text(
              '一段话、一首诗，或只是当下的念头。',
              style: TextStyle(color: kMuted, fontSize: 13),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _body,
              autofocus: !_isEdit,
              minLines: 6,
              maxLines: 16,
              decoration: const InputDecoration(hintText: '写点什么…'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _title,
              decoration: const InputDecoration(
                hintText: '标题（留空自动取正文开头）',
                filled: false,
              ),
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isPublic,
              onChanged: (v) => setState(() => _isPublic = v),
              title: const Text(
                '公开',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                _isPublic ? '会出现在 lordestar.cn 日记页' : '仅自己可见',
                style: const TextStyle(color: kMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.check_rounded),
              label: Text(_saving ? '保存中…' : '保存'),
            ),
          ],
        ),
      ),
    );
  }
}
