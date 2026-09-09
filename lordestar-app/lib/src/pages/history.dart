import 'package:flutter/material.dart';

import '../api.dart';
import '../models.dart';
import '../store.dart';
import '../theme.dart';
import 'entry_edit.dart';

/// 历史 Tab：全量记录（含私有）按月分组，点卡片进详情。
class HistoryTab extends StatefulWidget {
  const HistoryTab({
    super.key,
    required this.store,
    required this.api,
    required this.refreshTick,
  });

  final AppStore store;
  final ApiClient api;
  final ValueNotifier<int> refreshTick;

  @override
  State<HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<HistoryTab> {
  List<DiaryItem>? _items;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    widget.refreshTick.addListener(_reload);
    _reload();
  }

  @override
  void dispose() {
    widget.refreshTick.removeListener(_reload);
    super.dispose();
  }

  Future<void> _reload() async {
    if (_items == null) setState(() => _loading = true);
    try {
      final items = await widget.api.listDiary();
      if (!mounted) return;
      setState(() {
        _items = items;
        _error = null;
        _loading = false;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _error = '$err';
        _loading = false;
      });
    }
  }

  Future<void> _open(DiaryItem item) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) =>
            EntryDetailPage(store: widget.store, api: widget.api, item: item),
      ),
    );
    if (changed == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 24, 20, 8),
            child: Text(
              '历史记录',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_items == null && _loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _items == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_outlined, size: 40, color: kMuted),
              const SizedBox(height: 12),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton.tonal(onPressed: _reload, child: const Text('重试')),
              const SizedBox(height: 8),
              const Text(
                '若未配置令牌，请先到「设置」填写',
                style: TextStyle(color: kMuted, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }
    final items = _items ?? const <DiaryItem>[];
    if (items.isEmpty) {
      return const Center(
        child: Text('还没有记录，去「记录」页记一笔吧', style: TextStyle(color: kMuted)),
      );
    }
    return RefreshIndicator(
      onRefresh: _reload,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        itemCount: _grouped(items).length,
        itemBuilder: (context, i) => _grouped(items)[i],
      ),
    );
  }

  /// 转成「月份标题 / 卡片」交替的 widget 列表。
  List<Widget> _grouped(List<DiaryItem> items) {
    final out = <Widget>[];
    String? lastMonth;
    for (final item in items) {
      final m = '${item.createdAt.year}-${two(item.createdAt.month)}';
      if (m != lastMonth) {
        lastMonth = m;
        out.add(
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 18, 4, 10),
            child: Text(
              fmtMonth(item.createdAt),
              style: const TextStyle(
                color: kMuted,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
              ),
            ),
          ),
        );
      }
      out.add(_entryCard(item));
    }
    return out;
  }

  Widget _entryCard(DiaryItem item) {
    final Widget thumb;
    if (item.kind == DiaryKind.song) {
      thumb = _thumb(item.cover);
    } else if (item.kind == DiaryKind.photo) {
      thumb = _thumb(item.firstImage);
    } else {
      thumb = Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: kAmber.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.format_quote_rounded, color: kAmber, size: 22),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: PaperCard(
        padding: const EdgeInsets.all(12),
        onTap: () => _open(item),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            thumb,
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.kind == DiaryKind.text
                              ? (item.title.isEmpty ? '(无标题)' : item.title)
                              : item.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (!item.isPublic)
                        const Icon(Icons.lock_outline, size: 13, color: kMuted),
                    ],
                  ),
                  if (item.kind == DiaryKind.song &&
                      item.artist.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(
                      item.artist,
                      style: const TextStyle(color: kTextSoft, fontSize: 12.5),
                    ),
                  ],
                  if (item.note.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Text(
                      item.note,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: kMuted,
                        fontSize: 12.5,
                        height: 1.4,
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),
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
                      const Spacer(),
                      Text(
                        fmtDate(item.createdAt),
                        style: const TextStyle(color: kMuted, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _thumb(String urlOrPath) {
    final url = urlOrPath.trim();
    if (url.isEmpty) {
      return Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: kPanel,
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.music_note, color: kMuted, size: 22),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Image.network(
        widget.store.abs(url),
        width: 56,
        height: 56,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => Container(
          width: 56,
          height: 56,
          color: kPanel,
          child: const Icon(Icons.image_outlined, color: kMuted, size: 20),
        ),
      ),
    );
  }
}
