import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// 与 Android MainActivity 的 MethodChannel（lordestar/share）通信：
/// 接收「从网易云 App 分享 → Lordestar」的文本。
class ShareBridge {
  ShareBridge._();

  static const _channel = MethodChannel('lordestar/share');

  /// 待处理的分享文本；App 内任意页面可监听。
  static final ValueNotifier<String?> pendingShare = ValueNotifier<String?>(
    null,
  );

  /// 冷启动：取初始分享载荷并开始监听后续（热启动 onNewIntent）。
  static Future<void> init() async {
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onShare') {
        final v = call.arguments as String?;
        if (v != null && v.trim().isNotEmpty) pendingShare.value = v;
      }
    });
    try {
      final initial = await _channel.invokeMethod<String>('getInitialShare');
      if (initial != null && initial.trim().isNotEmpty) {
        pendingShare.value = initial;
      }
    } catch (_) {
      // 非 Android 或通道未就绪时忽略
    }
  }

  static void clear() => pendingShare.value = null;
}
