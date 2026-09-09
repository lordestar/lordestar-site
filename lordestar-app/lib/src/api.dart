import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import 'models.dart';
import 'store.dart';

/// API 请求失败（含服务端返回的 error 文案）。
class ApiException implements Exception {
  ApiException(this.message, {this.status});

  final String message;
  final int? status;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient(this.store);

  final AppStore store;
  static const _timeout = Duration(seconds: 60);

  Map<String, String> _headers({bool json = true}) => {
    if (store.hasToken) 'authorization': 'Bearer ${store.token}',
    if (json) 'content-type': 'application/json; charset=utf-8',
  };

  Uri _uri(String path, [Map<String, String>? query]) {
    final u = Uri.parse('${store.baseUrl}$path');
    return query == null ? u : u.replace(queryParameters: query);
  }

  Never _fail(http.Response r) {
    String msg = '请求失败（HTTP ${r.statusCode}）';
    try {
      final j = jsonDecode(utf8.decode(r.bodyBytes));
      if (j is Map && j['error'] is String) msg = j['error'] as String;
    } catch (_) {}
    if (r.statusCode == 401) msg = '未授权：请到「设置」填写 App 令牌';
    throw ApiException(msg, status: r.statusCode);
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
  }) async {
    final uri = _uri(path, query);
    final req = http.Request(method, uri)..headers.addAll(_headers());
    if (body != null) req.body = jsonEncode(body);
    final resp = await http.Response.fromStream(
      await req.send().timeout(_timeout),
    );
    if (resp.statusCode >= 400) _fail(resp);
    if (resp.bodyBytes.isEmpty) return null;
    return jsonDecode(utf8.decode(resp.bodyBytes));
  }

  /// GET /api/diary：全量（含私有），按时间倒序。
  Future<List<DiaryItem>> listDiary() async {
    final j = await _send('GET', '/api/diary');
    final items = (j as Map<String, dynamic>)['items'] as List? ?? const [];
    return items
        .map((e) => DiaryItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /api/diary：新建，返回新记录 id。
  Future<int> create(Map<String, dynamic> payload) async {
    final j =
        await _send('POST', '/api/diary', body: payload)
            as Map<String, dynamic>;
    return (j['id'] as num).toInt();
  }

  /// PUT /api/diary/:id
  Future<void> update(int id, Map<String, dynamic> payload) =>
      _send('PUT', '/api/diary/$id', body: payload);

  /// DELETE /api/diary/:id
  Future<void> delete(int id) => _send('DELETE', '/api/diary/$id');

  /// POST /api/ncm/resolve：解析分享文本/链接。
  Future<NcmSong?> resolveNcm(String text) async {
    final j =
        await _send('POST', '/api/ncm/resolve', body: {'text': text})
            as Map<String, dynamic>;
    if (j['ok'] == true && j['song'] is Map) {
      return NcmSong.fromJson(j['song'] as Map<String, dynamic>);
    }
    return null;
  }

  String? _lastResolveError;

  String? get lastResolveError => _lastResolveError;

  /// GET /api/ncm/search?q=：按歌名/歌手搜索。
  Future<NcmSong?> searchNcm(String q) async {
    final j =
        await _send('GET', '/api/ncm/search', query: {'q': q})
            as Map<String, dynamic>;
    if (j['ok'] == true && j['song'] is Map) {
      return NcmSong.fromJson(j['song'] as Map<String, dynamic>);
    }
    _lastResolveError = (j['error'] as String?) ?? '没有匹配结果';
    return null;
  }

  /// 解析入口：先当分享文本解析；失败且无 URL 时按关键词搜索兜底。
  Future<NcmSong?> resolveAny(String text) async {
    _lastResolveError = null;
    final byText = await resolveNcm(text);
    if (byText != null) return byText;
    final looksLikeKeywords = !text.contains('http');
    if (looksLikeKeywords) {
      final hit = await searchNcm(text.trim());
      if (hit != null) return hit;
    }
    return null;
  }

  /// POST /api/upload（multipart）：上传图片，返回 {url, key}。
  Future<String> uploadPhoto(
    Uint8List bytes,
    String filename,
    String mime,
  ) async {
    final uri = _uri('/api/upload');
    final req = http.MultipartRequest('POST', uri);
    req.headers.addAll(_headers(json: false));
    final mimeParts = mime.split('/');
    req.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: filename,
        contentType: MediaType(
          mimeParts.first,
          mimeParts.length > 1 ? mimeParts.last : 'octet-stream',
        ),
      ),
    );
    final resp = await http.Response.fromStream(
      await req.send().timeout(_timeout),
    );
    if (resp.statusCode >= 400) _fail(resp);
    final j = jsonDecode(utf8.decode(resp.bodyBytes)) as Map<String, dynamic>;
    return (j['key'] as String?) ?? (j['url'] as String?) ?? '';
  }
}
