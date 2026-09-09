import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 自用 App 的本地配置：服务器地址 + APP_TOKEN。
class AppStore extends ChangeNotifier {
  static const _kBase = 'server_base';
  static const _kToken = 'app_token';
  static const kDefaultBase = 'https://lordestar.cn';

  AppStore._();

  static Future<AppStore> load() async {
    final prefs = await SharedPreferences.getInstance();
    final s = AppStore._();
    s._base = prefs.getString(_kBase) ?? kDefaultBase;
    s._token = prefs.getString(_kToken) ?? '';
    return s;
  }

  String _base = kDefaultBase;
  String _token = '';

  String get baseUrl =>
      _base.endsWith('/') ? _base.substring(0, _base.length - 1) : _base;
  String get token => _token;
  bool get hasToken => _token.trim().isNotEmpty;

  Future<void> setBaseUrl(String v) async {
    final clean = v.trim().endsWith('/')
        ? v.trim().substring(0, v.trim().length - 1)
        : v.trim();
    _base = clean.isEmpty ? kDefaultBase : clean;
    await (await SharedPreferences.getInstance()).setString(_kBase, _base);
    notifyListeners();
  }

  Future<void> setToken(String v) async {
    _token = v.trim();
    await (await SharedPreferences.getInstance()).setString(_kToken, _token);
    notifyListeners();
  }

  /// 把 /media/xxx 相对路径拼成绝对 URL；已是 http 的直接返回。
  String abs(String urlOrPath) {
    final v = urlOrPath.trim();
    if (v.isEmpty) return v;
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    if (v.startsWith('/')) return '$baseUrl$v';
    return '$baseUrl/$v';
  }
}
