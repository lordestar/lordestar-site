import 'package:flutter/material.dart';

import '../api.dart';
import '../models.dart';
import '../ncm_local.dart';
import '../store.dart';
import '../theme.dart';

/// 记歌页：分享文本自动解析 / 手动粘贴 / 关键词搜索 → 预览 → 保存。
class RecordSongPage extends StatefulWidget {
  const RecordSongPage({
    super.key,
    required this.store,
    required this.api,
    this.initialText,
    this.existing,
  });

  final AppStore store;
  final ApiClient api;

  /// 来自系统分享的文本（冷/热启动都会自动解析）。
  final String? initialText;

  /// 编辑已有记录（传 null 为新建）。
  final DiaryItem? existing;

  @override
  State<RecordSongPage> createState() => _RecordSongPageState();
}

class _RecordSongPageState extends State<RecordSongPage> {
  late final TextEditingController _input;
  late final TextEditingController _title;
  late final TextEditingController _artist;
  late final TextEditingController _album;
  late final TextEditingController _note;

  bool _resolving = false;
  bool _saving = false;
  bool _isPublic = true;
  String _cover = '';
  int _ncmId = 0;
  String _songUrl = '';
  String? _resolveError;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _input = TextEditingController();
    _title = TextEditingController(text: e?.title ?? '');
    _artist = TextEditingController(text: e?.artist ?? '');
    _album = TextEditingController(text: e?.album ?? '');
    _note = TextEditingController(text: e?.note ?? '');
    if (e != null) {
      _cover = e.cover;
      _ncmId = e.ncmId ?? 0;
      _songUrl = e.songUrl;
      _isPublic = e.isPublic;
    } else if (widget.initialText != null &&
        widget.initialText!.trim().isNotEmpty) {
      _input.text = widget.initialText!;
      WidgetsBinding.instance.addPostFrameCallback((_) => _resolve());
    }
  }

  @override
  void dispose() {
    _input.dispose();
    _title.dispose();
    _artist.dispose();
    _album.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _resolve() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _resolving = true;
      _resolveError = null;
    });

    // 1) 手机本地解析（国内网络可直连网易云；服务端出口已被 163 封锁）
    NcmSong? song;
    String? err;
    try {
      final local = await resolveLocal(text);
      song = local.song;
      err = local.error;
    } catch (e) {
      err = '$e';
    }

    // 2) 服务端兜底（手机无法直连网易云等场景）
    if (song == null) {
      try {
        song = await widget.api.resolveAny(text);
        err = song == null ? (widget.api.lastResolveError ?? '没找到这首歌') : null;
      } catch (e) {
        err = '$e';
      }
    }

    if (!mounted) return;
    final s = song;
    setState(() {
      if (s != null) {
        _title.text = s.title;
        _artist.text = s.artist;
        _album.text = s.album;
        _cover = s.cover;
        _ncmId = s.id;
        _songUrl = s.songUrl;
        _resolveError = null;
      } else {
        _resolveError = err ?? '没找到这首歌';
      }
      _resolving = false;
    });

    // 3) 封面入库：126 外链 → 下载并上传本站媒体库（失败保留外链）
    if (s != null &&
        s.cover.startsWith('http') &&
        !s.cover.contains('/media/')) {
      await _storeCover(s.cover);
    }
  }

  /// 把外链封面下载后上传到本站 /api/upload，cover 存为 /media/… 路径。
  Future<void> _storeCover(String url) async {
    try {
      final bytes = await downloadCover(url);
      if (bytes == null) return;
      final key = await widget.api.uploadPhoto(
        bytes,
        'cover.jpg',
        'image/jpeg',
      );
      if (!mounted) return;
      setState(() {
        if (key.isNotEmpty) _cover = '/media/$key';
      });
    } catch (_) {
      // 保留原外链封面
    }
  }

  Future<void> _save() async {
    final title = _title.text.trim();
    if (title.isEmpty) {
      _toast('请填写歌名（可先解析或直接输入）');
      return;
    }
    setState(() => _saving = true);
    try {
      final payload = {
        'kind': 'song',
        'title': title,
        'artist': _artist.text.trim(),
        'album': _album.text.trim(),
        'cover': _cover.trim(),
        'ncmId': _ncmId == 0 ? null : _ncmId,
        'songUrl': _songUrl.trim(),
        'note': _note.text.trim(),
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
      _toast('$err');
      setState(() => _saving = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? '编辑听歌记录' : '记一首歌'),
        actions: [
          if (_isEdit)
            IconButton(
              onPressed: () => Navigator.of(context).pop(true),
              icon: const Icon(Icons.check),
              tooltip: '返回',
            ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            if (!_isEdit) ...[
              const Text(
                '从网易云分享过来，或粘贴链接、搜索歌名。',
                style: TextStyle(color: kMuted, fontSize: 13),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _input,
                minLines: 2,
                maxLines: 4,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _resolve(),
                decoration: InputDecoration(
                  hintText: '例如：分享歌曲《灰色》… https://163cn.tv/xxxx',
                  suffixIcon: _resolving
                      ? const Padding(
                          padding: EdgeInsets.all(14),
                          child: SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : IconButton(
                          onPressed: _resolve,
                          icon: const Icon(Icons.travel_explore),
                          tooltip: '解析',
                        ),
                ),
              ),
              const SizedBox(height: 12),
              if (_resolveError != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF08A6F).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 18,
                        color: Color(0xFFF08A6F),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '$_resolveError。可在下方手动填写歌名/歌手后直接保存。',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
            const SizedBox(height: 8),
            // 歌曲预览
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _cover.isEmpty
                    ? Container(
                        width: 84,
                        height: 84,
                        decoration: BoxDecoration(
                          color: kPanel,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: kBorderSoft),
                        ),
                        child: const Icon(
                          Icons.music_note,
                          color: kMuted,
                          size: 34,
                        ),
                      )
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(
                          widget.store.abs(_cover),
                          width: 84,
                          height: 84,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            width: 84,
                            height: 84,
                            color: kPanel,
                            child: const Icon(
                              Icons.broken_image_outlined,
                              color: kMuted,
                            ),
                          ),
                        ),
                      ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: _title,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                        decoration: const InputDecoration(
                          hintText: '歌名 *',
                          filled: false,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _artist,
                        decoration: const InputDecoration(
                          hintText: '歌手',
                          filled: false,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _album,
              decoration: const InputDecoration(
                hintText: '专辑（可选）',
                filled: false,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _note,
              minLines: 2,
              maxLines: 5,
              decoration: const InputDecoration(hintText: '此刻想说点什么（可选）…'),
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
                _isPublic ? '会显示在 lordestar.cn（首页「最近在听」）' : '仅自己可见，网站不展示',
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
            const SizedBox(height: 12),
            if (_songUrl.isNotEmpty)
              Text(
                '网易云链接：$_songUrl',
                style: const TextStyle(color: kMuted, fontSize: 11),
              ),
          ],
        ),
      ),
    );
  }
}
