import 'package:flutter/material.dart';

import '../api.dart';
import '../share_bridge.dart';
import '../store.dart';
import '../theme.dart';
import 'record_song.dart';
import 'record_text.dart';
import 'record_photo.dart';
import 'history.dart';
import 'settings.dart';

/// 主壳：记录 / 历史 / 设置 三页 + 网易云分享横幅。
class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.store, required this.api});

  final AppStore store;
  final ApiClient api;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  late final ValueNotifier<int> _tick;

  @override
  void initState() {
    super.initState();
    _tick = ValueNotifier<int>(0);
  }

  @override
  void dispose() {
    _tick.dispose();
    super.dispose();
  }

  void _changed() => _tick.value++;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0.9, -1.1),
            radius: 1.6,
            colors: [Color(0x0FFFFFFF), Color(0x00000000)],
            stops: [0.0, 0.6],
          ),
        ),
        child: IndexedStack(
          index: _index,
          children: [
            _RecordTab(
              store: widget.store,
              api: widget.api,
              onChanged: _changed,
            ),
            HistoryTab(
              store: widget.store,
              api: widget.api,
              refreshTick: _tick,
            ),
            SettingsTab(store: widget.store, api: widget.api),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.edit_note_outlined),
            selectedIcon: Icon(Icons.edit_note),
            label: '记录',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history),
            label: '历史',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: '设置',
          ),
        ],
      ),
    );
  }
}

/// 记录首页：三个入口 + 分享横幅。
class _RecordTab extends StatelessWidget {
  const _RecordTab({
    required this.store,
    required this.api,
    required this.onChanged,
  });

  final AppStore store;
  final ApiClient api;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        children: [
          Text(
            'Lordestar',
            style: const TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '随手记下听过的歌、冒出的念头和想留住的瞬间。',
            style: const TextStyle(color: kMuted, fontSize: 14),
          ),
          const SizedBox(height: 20),
          ListenableBuilder(
            listenable: ShareBridge.pendingShare,
            builder: (context, _) {
              final share = ShareBridge.pendingShare.value;
              if (share == null || share.trim().isEmpty) {
                return const SizedBox.shrink();
              }
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: PaperCard(
                  color: kAqua.withValues(alpha: 0.08),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.ios_share, size: 18, color: kAqua),
                          SizedBox(width: 8),
                          ChipTag('来自网易云', color: kAqua),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        '收到一条分享，要记成「听歌日记」吗？',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      Text(
                        share,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: kMuted, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          FilledButton(
                            style: FilledButton.styleFrom(
                              minimumSize: const Size(0, 40),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 18,
                              ),
                              backgroundColor: kAqua,
                            ),
                            onPressed: () async {
                              final saved = await Navigator.of(context)
                                  .push<bool>(
                                    MaterialPageRoute(
                                      builder: (_) => RecordSongPage(
                                        store: store,
                                        api: api,
                                        initialText: share,
                                      ),
                                    ),
                                  );
                              if (saved == true) {
                                ShareBridge.clear();
                                onChanged();
                              }
                            },
                            child: const Text('去记录'),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: ShareBridge.clear,
                            child: const Text(
                              '忽略',
                              style: TextStyle(color: kMuted),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          _EntryTile(
            icon: Icons.music_note_rounded,
            color: kCoral,
            title: '记一首歌',
            subtitle: '网易云分享直达 · 或粘贴链接 / 搜索歌名',
            onTap: () async {
              final saved = await Navigator.of(context).push<bool>(
                MaterialPageRoute(
                  builder: (_) => RecordSongPage(store: store, api: api),
                ),
              );
              if (saved == true) onChanged();
            },
          ),
          _EntryTile(
            icon: Icons.edit_rounded,
            color: kAmber,
            title: '写点感想',
            subtitle: '一句诗、一段话，留作碎片记录',
            onTap: () async {
              final saved = await Navigator.of(context).push<bool>(
                MaterialPageRoute(
                  builder: (_) => RecordTextPage(store: store, api: api),
                ),
              );
              if (saved == true) onChanged();
            },
          ),
          _EntryTile(
            icon: Icons.photo_camera_rounded,
            color: kAqua,
            title: '拍张照片',
            subtitle: '拍照或从相册选一张，配几句话',
            onTap: () async {
              final saved = await Navigator.of(context).push<bool>(
                MaterialPageRoute(
                  builder: (_) => RecordPhotoPage(store: store, api: api),
                ),
              );
              if (saved == true) onChanged();
            },
          ),
          const SizedBox(height: 18),
          PaperCard(
            color: Colors.transparent,
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.wb_sunny_outlined, size: 18, color: kMuted),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '记录会同步到 lordestar.cn：公开的听歌记录会出现在首页「最近在听」，文字与照片会进入日记页。',
                    style: const TextStyle(
                      color: kMuted,
                      fontSize: 12,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EntryTile extends StatelessWidget {
  const _EntryTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: PaperCard(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(color: kMuted, fontSize: 12.5),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: kMuted),
          ],
        ),
      ),
    );
  }
}
