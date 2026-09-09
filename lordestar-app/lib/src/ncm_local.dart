// 网易云解析的 App 端实现。
//
// 服务端（Cloudflare Worker）出口访问 music.163.com 会被封锁，
// 但手机在国内网络可直连网易云 —— 所以解析放在本机完成：
// 短链/链接 → 歌曲 id → v3 song/detail 元数据；关键词走搜索兜底。
// 封面后续由调用方下载并上传本站媒体库（/api/upload）。
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import 'models.dart';

const String _ua =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 '
    '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

final _urlRe = RegExp(r'https?://[^\s"<>（）()]+');
final _titleRe = RegExp(r'《([^》]+)》');
final _artistRe = RegExp(r'分享(.+?)的(?:单曲|歌曲)');
final _idRe = RegExp(r'[?&#]id=(\d+)');

class NcmLocalResult {
  const NcmLocalResult({this.song, this.error});

  final NcmSong? song;
  final String? error;
}

String? _extractShareUrl(String text) {
  final m = _urlRe.firstMatch(text);
  if (m == null) return null;
  return m.group(0)!.replaceAll(RegExp(r'[，。；]$'), '');
}

({String title, String artist}) _parseFromText(String text) {
  final t = _titleRe.firstMatch(text);
  final a = _artistRe.firstMatch(text);
  return (
    title: t == null ? '' : t.group(1)!,
    artist: a == null ? '' : a.group(1)!.trim(),
  );
}

Future<int?> _resolveSongId(String rawUrl) async {
  try {
    final resp = await http
        .get(
          Uri.parse(rawUrl),
          headers: const {
            'user-agent': _ua,
            'accept':
                'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'zh-CN,zh;q=0.9',
            'referer': 'https://music.163.com/',
          },
        )
        .timeout(const Duration(seconds: 20));
    final finalUrl = resp.request?.url.toString() ?? rawUrl;
    final m = _idRe.firstMatch(finalUrl);
    if (m != null) return int.tryParse(m.group(1)!);
    final m2 =
        RegExp(r'song\?id=(\d+)').firstMatch(resp.body) ??
        RegExp(r'song%3Fid%3D(\d+)').firstMatch(resp.body);
    return m2 == null ? null : int.tryParse(m2.group(1)!);
  } catch (_) {
    return null;
  }
}

Future<int?> _searchSongId(String query) async {
  try {
    final uri = Uri.parse(
      'https://music.163.com/api/search/get/web',
    ).replace(queryParameters: {'s': query, 'type': '1', 'limit': '1'});
    final resp = await http
        .get(
          uri,
          headers: const {
            'user-agent': 'Mozilla/5.0',
            'referer': 'https://music.163.com/',
          },
        )
        .timeout(const Duration(seconds: 15));
    if (resp.statusCode != 200) return null;
    final data = jsonDecode(utf8.decode(resp.bodyBytes));
    final songs = ((data as Map)['result'] as Map?)?['songs'] as List?;
    final first = songs == null || songs.isEmpty ? null : songs.first;
    return first is Map && first['id'] is num
        ? (first['id'] as num).toInt()
        : null;
  } catch (_) {
    return null;
  }
}

Future<NcmSong?> _fetchMeta(int id) async {
  try {
    final resp = await http
        .post(
          Uri.parse('https://music.163.com/api/v3/song/detail'),
          headers: const {
            'user-agent': 'Mozilla/5.0',
            'referer': 'https://music.163.com/',
            'content-type': 'application/x-www-form-urlencoded',
          },
          body:
              'c=${Uri.encodeComponent(jsonEncode([
                {'id': id},
              ]))}',
        )
        .timeout(const Duration(seconds: 15));
    if (resp.statusCode != 200) return null;
    final data = jsonDecode(utf8.decode(resp.bodyBytes)) as Map;
    final songs = data['songs'] as List?;
    if (songs == null || songs.isEmpty) return null;
    final s = songs.first as Map;
    final ar = ((s['ar'] as List?) ?? const [])
        .whereType<Map>()
        .map((e) => e['name']?.toString() ?? '')
        .where((e) => e.isNotEmpty)
        .join(' / ');
    final al = s['al'] as Map?;
    return NcmSong(
      id: id,
      title: s['name']?.toString() ?? '',
      artist: ar,
      album: al?['name']?.toString() ?? '',
      cover: al?['picUrl']?.toString() ?? '',
      songUrl: 'https://music.163.com/#/song?id=$id',
    );
  } catch (_) {
    return null;
  }
}

/// 完整解析：分享文本/链接 → 歌曲（与 docs/04 服务端管线等价，本地执行）。
Future<NcmLocalResult> resolveLocal(String text) async {
  final trimmed = text.trim();
  if (trimmed.isEmpty) return const NcmLocalResult(error: '内容为空');
  final fb = _parseFromText(trimmed);
  final url = _extractShareUrl(trimmed);

  int? id;
  if (url != null) id = await _resolveSongId(url);
  if (id == null && fb.title.isNotEmpty) {
    id = await _searchSongId('${fb.title} ${fb.artist}'.trim());
  }

  if (id != null) {
    final meta = await _fetchMeta(id);
    if (meta != null && meta.title.isNotEmpty) {
      return NcmLocalResult(
        song: NcmSong(
          id: id,
          title: meta.title,
          artist: meta.artist.isEmpty ? fb.artist : meta.artist,
          album: meta.album,
          cover: meta.cover,
          songUrl: meta.songUrl,
        ),
      );
    }
    if (fb.title.isNotEmpty) {
      return NcmLocalResult(
        song: NcmSong(
          id: id,
          title: fb.title,
          artist: fb.artist,
          album: '',
          cover: '',
          songUrl: 'https://music.163.com/#/song?id=$id',
        ),
      );
    }
  }

  if (fb.title.isNotEmpty) {
    return NcmLocalResult(
      song: NcmSong(
        id: 0,
        title: fb.title,
        artist: fb.artist,
        album: '',
        cover: '',
        songUrl: url ?? '',
      ),
    );
  }
  return const NcmLocalResult(error: '无法解析，请检查链接或手动填写歌名/歌手');
}

/// 下载封面（手机直连 126.net），供上传本站媒体库。
Future<Uint8List?> downloadCover(String url) async {
  try {
    final resp = await http
        .get(
          Uri.parse(url),
          headers: const {
            'user-agent': _ua,
            'referer': 'https://music.163.com/',
          },
        )
        .timeout(const Duration(seconds: 25));
    if (resp.statusCode != 200 || resp.bodyBytes.isEmpty) return null;
    if (resp.bodyBytes.length > 8 * 1024 * 1024) return null; // 防超大
    return resp.bodyBytes;
  } catch (_) {
    return null;
  }
}
