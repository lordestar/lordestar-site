import 'package:flutter/material.dart';

import '../api.dart';
import '../models.dart';
import '../store.dart';
import '../theme.dart';
import 'record_song.dart';
import 'record_text.dart';
import 'record_photo.dart';

/// 记录详情：查看 + 编辑（跳对应记录页）+ 删除。
class EntryDetailPage extends StatefulWidget {
  const EntryDetailPage({
    super.key,
    required this.store,
    required this.api,
    required this.item,
  });

  final AppStore store;
  final ApiClient api;
  final DiaryItem item;

  @override
  State<EntryDetailPage> createState() => _EntryDetailPageState();
}

class _EntryDetailPageState extends State<EntryDetailPage> {
  bool _deleting = false;

  Future<void> _edit() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => switch (widget.item.kind) {
          DiaryKind.song => RecordSongPage(
            store: widget.store,
            api: widget.api,
            existing: widget.item,
          ),
          DiaryKind.text => RecordTextPage(
            store: widget.store,
            api: widget.api,
            existing: widget.item,
          ),
          DiaryKind.photo => RecordPhotoPage(
            store: widget.store,
            api: widget.api,
            existing: widget.item,
          ),
        },
      ),
    );
    if (changed == true && mounted) Navigator.of(context).pop(true);
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('删除这条记录？'),
        content: const Text('删除后无法恢复（网站上的公开内容也会同步消失）。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('取消'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('删除'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _deleting = true);
    try {
      await widget.api.delete(widget.item.dbId);
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(content: Text('已删除')));
      Navigator.of(context).pop(true);
    } catch (err) {
      if (!mounted) return;
      setState(() => _deleting = false);
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text('$err')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final isSong = item.kind == DiaryKind.song;
    final isPhoto = item.kind == DiaryKind.photo;
    final media = isSong ? item.cover : (isPhoto ? item.firstImage : '');

    return Scaffold(
      appBar: AppBar(
        title: const Text('详情'),
        actions: [
          IconButton(
            onPressed: _deleting ? null : _edit,
            icon: const Icon(Icons.edit_outlined),
            tooltip: '编辑',
          ),
          IconButton(
            onPressed: _deleting ? null : _delete,
            icon: _deleting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.delete_outline),
            tooltip: '删除',
            color: Theme.of(context).colorScheme.error,
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            Row(
              children: [
                ChipTag(
                  item.kind.labelZh,
                  color: switch (item.kind) {
                    DiaryKind.song => kCoral,
                    DiaryKind.text => kAmber,
                    DiaryKind.photo => kAqua,
                  },
                ),
                const SizedBox(width: 10),
                Text(
                  '${fmtDate(item.createdAt)} · ${item.isPublic ? '公开' : '仅自己可见'}',
                  style: const TextStyle(color: kMuted, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (media.isNotEmpty) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.network(
                  widget.store.abs(media),
                  width: double.infinity,
                  height: isSong ? 220 : 300,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    height: 180,
                    color: kPanel,
                    child: const Center(
                      child: Icon(
                        Icons.image_outlined,
                        size: 44,
                        color: kMuted,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            if (item.title.isNotEmpty)
              Text(
                item.title,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  height: 1.3,
                ),
              ),
            if (isSong && item.artist.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                item.artist,
                style: const TextStyle(color: kTextSoft, fontSize: 15),
              ),
            ],
            if (isSong && item.album.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  '专辑：${item.album}',
                  style: const TextStyle(color: kMuted, fontSize: 13),
                ),
              ),
            if (item.note.isNotEmpty) ...[
              const SizedBox(height: 14),
              PaperCard(
                color: kPanel,
                padding: const EdgeInsets.all(14),
                child: Text(
                  item.note,
                  style: const TextStyle(fontSize: 15, height: 1.7),
                ),
              ),
            ],
            if (isSong && item.songUrl.isNotEmpty) ...[
              const SizedBox(height: 14),
              Text(
                item.songUrl,
                style: const TextStyle(color: kMuted, fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 24),
            FilledButton.tonalIcon(
              onPressed: _deleting ? null : _edit,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('编辑这条记录'),
            ),
          ],
        ),
      ),
    );
  }
}
